# the magic button: brings in what's new, rebuilds the site, then commits and sends it all out.
#   python god.py                     (commits as "site update, <date>")
#   python god.py "a new blog post"    (commits with your own message)
#
# 1. pulls main (the daily story arrives there on its own), keeping anything you haven't committed yet
# 2. runs update_site.py -ns (the posts, the search, the sitemap; the story comes from the daily cron)
# 3. commits everything and pushes main
# 4. brings the world branch (../scorsby-world) up to main and pushes it too
import os, subprocess, sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WORLD = ROOT.parent / "scorsby-world"
ENV = {**os.environ, "PYTHONIOENCODING": "utf-8"}  # (update_site.py prints emoji)
for stream in (sys.stdout, sys.stderr):
    stream.reconfigure(encoding="utf-8", errors="replace")  # (and so does this, on a windows console)

_print = print
def print(*a, **k): _print(*a, **k, flush=True)  # (so these lines and each step's own output come out in order)

def run(*cmd, cwd=ROOT, check=True):
    print("›", " ".join(cmd))
    return subprocess.run(cmd, cwd=cwd, env=ENV, check=check)

def out(*cmd, cwd=ROOT):
    return subprocess.run(cmd, cwd=cwd, env=ENV, capture_output=True, text=True).stdout.strip()

def main():
    message = " ".join(sys.argv[1:]).strip() or f"site update, {datetime.now():%b %d %Y}".lower()

    if out("git", "branch", "--show-current") != "main":
        sys.exit("god.py: not on main here, so nothing was done. (git switch main, then try again)")

    print("\n♥ bringing in what's new")
    run("git", "pull", "--rebase", "--autostash", "-q", "origin", "main")

    print("\n♥ rebuilding the site")
    run(sys.executable, "update_site.py", "-ns")

    print("\n♥ committing")
    run("git", "add", "-A")
    if out("git", "diff", "--cached", "--name-only"):
        print(out("git", "diff", "--cached", "--stat"))
        run("git", "commit", "-q", "-m", message)
    else:
        print("nothing new to commit")
    run("git", "push", "-q", "origin", "main")

    if WORLD.is_dir():
        print("\n♥ the world branch")
        run("git", "merge", "-q", "--ff-only", "main", cwd=WORLD)
        run("git", "push", "-q", "origin", "world", cwd=WORLD)
    else:
        print(f"\n(no {WORLD.name} folder next to this one, so the world branch was left as it is)")

    print("\n✓ all done. peace, love and joy <3")

if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as e:
        sys.exit(f"\ngod.py stopped: that last step failed (exit {e.returncode}). nothing after it ran; see the message above.")
