"""Rebuild archive/home/<slug>/ snapshots of old homepages straight from git.

Each era is one commit. Starting from that commit's index.html, it follows
every local file the page asks for (styles, scripts, images, sounds, iframes,
the navbar it fetches...) and copies each one as it was at that commit, so an
old page runs with its own old code instead of today's.

Links to other pages (<a href="about.html">) are not followed: they are pointed
at the live site instead. Paths starting with "/" are pointed inside the
snapshot when the snapshot has that file.

Run from the repo root:  python tools/snapshot_homepages.py
"""
import os
import posixpath
import re
import shutil
import subprocess
import sys

# slug, commit, the page to start from (it becomes the snapshot's index.html)
# (april 2025, before the site lived here, is linked on the wayback machine instead)
ERAS = [
    ("2025", "29dd718", "index.html"),
    ("2025-notice", "a01c288", "index.html"),
    # the 24-cell home at its most finished, with the bigger zia, from after it moved behind the splash
    ("2026-newyear", "c96e57a", "home.html"),
    ("2026-selfportrait", "b2c37de", "index.html"),
    ("2026-champ", "84a5193", "index.html"),
]

OUT = "archive/home"
MAX_BYTES = 20 * 1024 * 1024
TEXT_EXT = {".html", ".htm", ".css", ".js", ".mjs", ".json", ".svg"}
EXT = (r"css|js|mjs|json|png|jpe?g|gif|webp|svg|ico|mp3|wav|ogg|m4a|mp4|webm|"
       r"otf|ttf|woff2?|bin|html?|txt|pdf|glsl|frag|vert|obj|csv|md")
REF = re.compile(r"""(?<=["'(`=])\s*([^"'()`\s<>=]+?\.(?:%s))(?=[?#"')`\s>])""" % EXT, re.I)
ANCHOR = re.compile(r"""<a\b[^>]*?\bhref\s*=\s*["']([^"'#?]+\.html?)""", re.I)


def git(*args, binary=False):
    return subprocess.run(["git", *args], check=True, capture_output=True,
                          text=not binary).stdout


def is_external(r):
    return re.match(r"^(?:[a-z]+:|//)", r, re.I) is not None


def candidates(ref, from_file):
    ref = ref.strip()
    if ref.startswith("/"):
        return [posixpath.normpath(ref.lstrip("/"))]
    here = posixpath.dirname(from_file)
    # relative to the file itself, to the page (scripts resolve against it), and to the root
    out = [posixpath.normpath(posixpath.join(here, ref)), posixpath.normpath(ref)]
    return [c for c in dict.fromkeys(out) if not c.startswith("..")]


def blobs(commit):
    out = {}
    for line in git("ls-tree", "-r", "-l", commit).splitlines():
        meta, path = line.split("\t", 1)
        _, _, sha, size = meta.split()
        out[path] = (sha, int(size) if size != "-" else 0)
    return out


NOW = None


def snapshot(slug, commit, entry="index.html"):
    global NOW
    NOW = NOW or blobs("HEAD")
    old = blobs(commit)
    tree = set(old)
    sizes = {p: s for p, (_, s) in old.items()}
    # pictures and sounds that haven't changed since are borrowed from the live site, not copied
    shared = {p for p, (sha, _) in old.items()
              if posixpath.splitext(p)[1].lower() not in TEXT_EXT and NOW.get(p, (None,))[0] == sha}

    files, queue, skipped, anchors, borrowed = {}, [entry], [], {}, set()
    while queue:
        f = queue.pop()
        if f in files or f in borrowed:
            continue
        if f in shared:
            borrowed.add(f)
            continue
        if sizes.get(f, 0) > MAX_BYTES:
            skipped.append(f)
            continue
        data = git("show", f"{commit}:{f}", binary=True)
        files[f] = data
        if posixpath.splitext(f)[1].lower() not in TEXT_EXT:
            continue
        text = data.decode("utf-8", "replace")
        page_links = set(ANCHOR.findall(text)) if f.endswith((".html", ".htm")) else set()
        for ref in REF.findall(text):
            if is_external(ref):
                continue
            if ref in page_links:
                anchors.setdefault(f, set()).add(ref)
                continue
            for c in candidates(ref, f):
                if c in tree and c not in files:
                    queue.append(c)

    dest = posixpath.join(OUT, slug)
    if os.path.isdir(dest):
        shutil.rmtree(dest)
    prefix = "/" + dest + "/"
    for f, data in files.items():
        if posixpath.splitext(f)[1].lower() in TEXT_EXT:
            text = data.decode("utf-8", "replace")

            def fix(m):
                ref = m.group(1)
                lead = m.group(0)[: m.start(1) - m.start(0)]
                if is_external(ref):
                    return m.group(0)
                if ref in anchors.get(f, ()):
                    # another page of the old site: send it to the live one
                    target = candidates(ref, f)[0]
                    return lead + "/" + target
                found = [c for c in candidates(ref, f) if c in files or c in borrowed]
                if not found:
                    return m.group(0)
                c = found[0]
                if c in borrowed:
                    return lead + "/" + c
                if ref.strip().startswith("/"):
                    return lead + prefix + c
                return m.group(0)

            text = REF.sub(fix, text)
            if f.endswith((".html", ".htm")) and "charset" not in text.lower():
                # (some old pages never said they were utf-8, and a plain server shows them garbled)
                text = re.sub(r"<head[^>]*>", lambda h: h.group(0) + '\n<meta charset="UTF-8">', text, count=1, flags=re.I)
            data = text.encode("utf-8")
        out = os.path.join(dest, *f.split("/"))
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "wb") as fh:
            fh.write(data)
        if f == entry and entry != "index.html":
            # it sits beside the entry page, so all its relative paths still hold
            with open(os.path.join(dest, "index.html"), "wb") as fh:
                fh.write(data)
    total = sum(len(d) for d in files.values())
    return len(files), len(borrowed), total, skipped


def main():
    if not os.path.exists("CNAME"):
        sys.exit("run this from the repo root")
    keep = {slug for slug, *_ in ERAS}
    for old in os.listdir(OUT) if os.path.isdir(OUT) else []:
        if old not in keep:
            shutil.rmtree(os.path.join(OUT, old))
    for slug, commit, entry in ERAS:
        n, b, total, skipped = snapshot(slug, commit, entry)
        note = f"  (left out, too big: {', '.join(skipped)})" if skipped else ""
        print(f"{slug:20} {commit}  {n:3} copied {total / 1e6:6.2f} MB, {b:3} borrowed from live{note}")


if __name__ == "__main__":
    main()
