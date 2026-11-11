// little notes under a blog post, and replies to them. kept by the hearth (kindly checked, links looked at first).
// on this computer (localhost), or with ?preview, they're kept only in this browser, to try it out.
(() => {
  const box = document.getElementById('comments');
  if (!box) return;
  const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);
  const PREVIEW = new URLSearchParams(location.search).has('preview') || LOCAL;
  const API = 'https://scorsby-hearth.samrobertsbaca.workers.dev/comments';
  const post = decodeURIComponent(location.pathname.split('/').pop().replace(/\.html$/, ''));
  const URL_RE = /\bhttps?:\/\/[^\s<>"'`]+/gi;
  // the scorsby colors, so a name always has the same little dot
  const COLORS = ['#00b4ff', '#ff5fae', '#62d64a', '#ff9a3c', '#9b6bff', '#ffd23f', '#ff4d4d', '#e83ad8', '#b6f03a', '#ffb38a', '#7fd2ff', '#5b4cff'];
  const colorOf = (name) => { let h = 7; for (const ch of name || 'someone') h = (h * 31 + ch.codePointAt(0)) >>> 0; return name ? COLORS[h % COLORS.length] : '#c9c4bd'; };
  const day = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toLowerCase();
  const myName = () => { try { return localStorage.getItem('scorsby-name') || ''; } catch { return ''; } };
  const reader = (() => { try { let k = localStorage.getItem('scorsby-reader'); if (!k) { k = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); localStorage.setItem('scorsby-reader', k); } return k; } catch { return Math.random().toString(36).slice(2, 14); } })();
  const flaggedKey = 'scorsby-flagged', flagged = () => { try { return new Set(JSON.parse(localStorage.getItem(flaggedKey) || '[]')); } catch { return new Set(); } };
  const rememberFlag = (id) => { try { const f = flagged(); f.add(id); localStorage.setItem(flaggedKey, JSON.stringify([...f])); } catch {} };
  const rememberName = (n) => { try { if (n) localStorage.setItem('scorsby-name', n); } catch {} };
  // the notes written in this browser (so they can be taken back)
  const mineKey = 'scorsby-mine', mine = () => { try { return new Set(JSON.parse(localStorage.getItem(mineKey) || '[]')); } catch { return new Set(); } };
  const rememberMine = (id) => { try { const s = mine(); s.add(id); localStorage.setItem(mineKey, JSON.stringify([...s])); } catch {} };
  // (samuel's browser holds the moderation key: what he writes here goes with it, and wears his mark)
  const modKey = () => { try { return localStorage.getItem('scorsby-notes-key') || ''; } catch { return ''; } };
  // his mark: the turning triangle, with the point at its center
  const NS = 'http://www.w3.org/2000/svg';
  function tri() {
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '-50 -50 100 100'); s.setAttribute('class', 'c-tri'); s.setAttribute('role', 'img'); s.setAttribute('aria-label', 'samuel');
    const t = document.createElementNS(NS, 'title'); t.textContent = 'samuel, who writes here';
    const p = document.createElementNS(NS, 'polygon'); p.setAttribute('points', '0,-40 34.641,20 -34.641,20'); p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'currentColor'); p.setAttribute('stroke-width', '8'); p.setAttribute('stroke-linejoin', 'round');
    const d = document.createElementNS(NS, 'circle'); d.setAttribute('r', '7'); d.setAttribute('fill', 'currentColor');
    s.append(t, p, d); return s;
  }

  // ---- where they're kept
  const previewKey = `scorsby-comments:${post}`;
  const previewList = () => { try { return JSON.parse(localStorage.getItem(previewKey) || '[]'); } catch { return []; } };
  async function load() {
    if (PREVIEW) { // (taken down on the moderation page, or taken back: those with replies keep their place)
      const list = previewList(), kids = new Set(list.filter((c) => !c.gone).map((c) => c.parent));
      return list.filter((c) => !c.gone || (c.gone === 3 && kids.has(c.id))).map((c) => (c.gone ? { ...c, name: '', text: '' } : c));
    }
    const r = await fetch(`${API}?post=${encodeURIComponent(post)}`).then((x) => x.json()).catch(() => null);
    return r && r.ok ? r.comments : null;
  }
  async function send(note) {
    if (PREVIEW) {
      const list = previewList(), up = note.parent != null ? list.find((c) => c.id === note.parent) : null;
      const depth = up ? Math.min(2, up.depth + 1) : 0, parent = up ? (up.depth >= 2 ? up.parent : up.id) : null;
      const c = { id: Date.now(), parent, depth, name: (note.name || '').toLowerCase().slice(0, 16), text: note.text.slice(0, 600) /* (as written) */, said: new Date().toISOString(), me: modKey() ? 1 : 0 };
      list.push(c); try { localStorage.setItem(previewKey, JSON.stringify(list)); } catch {}
      return { ok: true, comment: c };
    }
    const headers = { 'content-type': 'application/json' }; if (modKey()) headers['x-key'] = modKey();
    return fetch(API, { method: 'POST', headers, body: JSON.stringify({ post, who: reader, ...note }) })
      .then((x) => x.json()).catch(() => ({ ok: false, why: 'that note got lost on the way. try again?' }));
  }
  async function takeBack(id) {
    if (PREVIEW) {
      const list = previewList(); for (const c of list) if (c.id === id) c.gone = 3;
      try { localStorage.setItem(previewKey, JSON.stringify(list)); } catch {}
      return { ok: true };
    }
    const headers = { 'content-type': 'application/json' }; if (modKey()) headers['x-key'] = modKey();
    return fetch(`${API}/delete`, { method: 'POST', headers, body: JSON.stringify({ post, id, who: reader }) })
      .then((x) => x.json()).catch(() => ({ ok: false }));
  }
  async function change(id, text) {
    if (PREVIEW) {
      const list = previewList(), edited = new Date().toISOString(); for (const c of list) if (c.id === id) { c.text = text.slice(0, 600); c.edited = edited; }
      try { localStorage.setItem(previewKey, JSON.stringify(list)); } catch {}
      return { ok: true, text: text.slice(0, 600), edited };
    }
    const headers = { 'content-type': 'application/json' }; if (modKey()) headers['x-key'] = modKey();
    return fetch(`${API}/edit`, { method: 'POST', headers, body: JSON.stringify({ post, id, who: reader, text }) })
      .then((x) => x.json()).catch(() => ({ ok: false, why: 'that change got lost on the way. try again?' }));
  }
  async function flag(id) {
    if (PREVIEW) {
      // (in the preview, one browser is one reader, so a single flag counts as three: to see what happens)
      const list = previewList(); for (const c of list) if (c.id === id) { c.flags = (c.flags || 0) + 3; if (c.flags >= 3 && !c.kept) c.gone = 2; }
      try { localStorage.setItem(previewKey, JSON.stringify(list)); } catch {}
      return { ok: true, hidden: true };
    }
    return fetch(`${API}/flag`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ post, id, who: reader }) })
      .then((x) => x.json()).catch(() => ({ ok: false }));
  }

  // ---- drawing them
  function words(text) {
    // the words, with any links made into links (they open elsewhere, and say where they go)
    const frag = document.createDocumentFragment();
    let last = 0;
    for (const m of text.matchAll(URL_RE)) {
      frag.append(text.slice(last, m.index));
      let host = ''; try { host = new URL(m[0]).hostname.replace(/^www\./, ''); } catch {}
      const a = document.createElement('a');
      a.href = m[0]; a.target = '_blank'; a.rel = 'nofollow ugc noopener noreferrer';
      a.textContent = m[0].replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').slice(0, 48) + (m[0].length > 60 ? '…' : '');
      frag.append(a);
      if (host) { const h = document.createElement('span'); h.className = 'c-host'; h.textContent = ` (${host})`; frag.append(h); }
      last = m.index + m[0].length;
    }
    frag.append(text.slice(last));
    return frag;
  }
  function noteEl(c) {
    const el = document.createElement('div'); el.className = 'c-note'; el.dataset.id = c.id;
    if (c.gone) { // (taken back, with replies under it: just its place)
      const q = document.createElement('p'); q.className = 'c-quiet c-gone'; q.textContent = '(a note its writer deleted)';
      const kids = document.createElement('div'); kids.className = 'c-kids';
      el.append(q, kids); return el;
    }
    const head = document.createElement('div'); head.className = 'c-head';
    let dot = document.createElement('span'); dot.className = 'c-dot'; dot.style.background = colorOf(c.name);
    if (c.me) { dot = tri(); el.classList.add('c-me'); }
    const who = document.createElement('b'); who.textContent = c.name ? `${c.name} scorsby` : 'someone';
    head.append(dot, who, ` · ${day(c.said)}`);
    if (c.edited) { // (when, on hover or a tap)
      const at = new Date(c.edited).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).toLowerCase();
      const e = document.createElement('span'); e.className = 'c-edited'; e.tabIndex = 0; e.title = `edited ${at}`; e.dataset.at = at; e.textContent = 'edited';
      e.addEventListener('click', () => { e.textContent = e.textContent === 'edited' ? `edited ${at}` : 'edited'; });
      head.append(' · ', e);
    }
    const p = document.createElement('p'); p.className = 'c-words'; p.append(words(c.text));
    const reply = document.createElement('button'); reply.type = 'button'; reply.className = 'c-reply'; reply.textContent = 'reply';
    reply.addEventListener('click', () => openForm(el, c.id));
    // "not kind?": asks once, then counts. enough different readers, and the note hides itself until samuel looks
    const nk = document.createElement('button'); nk.type = 'button'; nk.className = 'c-flag';
    const done = flagged().has(c.id);
    nk.textContent = done ? 'noted' : 'not kind?'; nk.disabled = done;
    nk.addEventListener('click', async () => {
      if (!nk.dataset.sure) { nk.dataset.sure = '1'; nk.textContent = 'mark as not kind?'; return; }
      nk.disabled = true; nk.textContent = '…';
      const r = await flag(c.id);
      if (!r || !r.ok) { nk.disabled = false; nk.textContent = 'try again'; return; }
      rememberFlag(c.id); nk.textContent = r.hidden ? 'thanks. it is hidden now.' : 'thanks, noted.';
      if (r.hidden) setTimeout(() => el.remove(), 1400);
    });
    const acts = document.createElement('div'); acts.className = 'c-acts'; acts.append(reply);
    if (mine().has(c.id)) {
      // your own: change it (the pencil), or delete it (the trash, which asks once). instead of "not kind?", which you wouldn't need
      const ed = document.createElement('button'); ed.type = 'button'; ed.className = 'c-icon'; ed.innerHTML = PENCIL; ed.setAttribute('aria-label', 'edit'); ed.title = 'edit';
      ed.addEventListener('click', () => editIn(el, c));
      const tb = document.createElement('button'); tb.type = 'button'; tb.className = 'c-icon'; tb.innerHTML = TRASH; tb.setAttribute('aria-label', 'delete'); tb.title = 'delete';
      tb.addEventListener('click', async () => {
        if (!tb.dataset.sure) { tb.dataset.sure = '1'; tb.innerHTML = `${TRASH}<span>delete?</span>`; setTimeout(() => { if (!tb.disabled) { delete tb.dataset.sure; tb.innerHTML = TRASH; } }, 4000); return; }
        tb.disabled = true; tb.textContent = '…';
        const r = await takeBack(c.id);
        if (!r || !r.ok) { tb.disabled = false; tb.textContent = (r && r.why) || 'try again'; return; }
        c.gone = 3; c.name = ''; c.text = '';
        if (!all.some((x) => x.parent === c.id && !x.gone)) all = all.filter((x) => x !== c);
        draw(all);
      });
      acts.append(ed, tb);
    } else acts.append(nk);
    const kids = document.createElement('div'); kids.className = 'c-kids';
    el.append(head, p, acts, kids);
    return el;
  }
  function draw(list) {
    listEl.textContent = '';
    const byId = new Map();
    for (const c of list) {
      const el = noteEl(c); byId.set(c.id, el);
      const up = c.parent != null && byId.get(c.parent);
      (up ? up.querySelector(':scope > .c-kids') : listEl).append(el);
    }
  }

  // little line drawings, in the ink of the words
  const ICON = (d) => `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const PENCIL = ICON('<path d="M10.5 2.5l3 3-8 8H2.5v-3z"/><path d="M9 4l3 3"/>');
  const TRASH = ICON('<path d="M2.5 4.5h11"/><path d="M6 4.5V3h4v1.5"/><path d="M4 4.5l.7 9h6.6l.7-9"/><path d="M6.8 7v4.5M9.2 7v4.5"/>');
  function editIn(el, c) {
    const p = el.querySelector(':scope > .c-words'), acts = el.querySelector(':scope > .c-acts');
    if (el.querySelector(':scope > .c-form')) return;
    const f = document.createElement('form'); f.className = 'c-form c-editing';
    f.innerHTML = `<textarea name="text" maxlength="900" rows="3"></textarea><div class="c-row"><span class="c-said" aria-live="polite"></span><span><button type="button" class="c-flag c-cancel">never mind</button> <button type="submit">save</button></span></div>`;
    f.elements.text.value = c.text;
    p.hidden = true; acts.hidden = true; p.after(f);
    const t = f.elements.text; t.focus(); t.setSelectionRange(t.value.length, t.value.length);
    const close = () => { f.remove(); p.hidden = false; acts.hidden = false; };
    f.querySelector('.c-cancel').addEventListener('click', close);
    t.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = t.value.trim(), said = f.querySelector('.c-said'), btn = f.querySelector('button[type="submit"]');
      if (!text) { said.textContent = 'try some words. (or the trash takes it away)'; return; }
      if (text === c.text) { close(); return; }
      btn.disabled = true; said.textContent = 'saving…';
      const r = await change(c.id, text);
      btn.disabled = false;
      if (!r || !r.ok) { said.textContent = (r && r.why) || 'that change got lost on the way. try again?'; return; }
      c.text = r.text; c.edited = r.edited; draw(all);
    });
  }

  // ---- writing one (a note, or a reply under one)
  function form(parent) {
    const f = document.createElement('form'); f.className = 'c-form';
    f.innerHTML = `
      <label class="c-name"><input name="who" maxlength="16" autocomplete="off" spellcheck="false" placeholder="your name"> <span>scorsby</span></label>
      <textarea name="text" maxlength="900" rows="${parent == null ? 3 : 2}" placeholder="${parent == null ? 'say something kind…' : 'a reply…'}"></textarea>
      <input name="website" tabindex="-1" autocomplete="off" class="c-trap" aria-hidden="true">
      <div class="c-row"><span class="c-said" aria-live="polite"></span><button type="submit">${parent == null ? 'send' : 'reply'}</button></div>`;
    f.elements.who.value = myName();
    let started = 0;
    f.addEventListener('focusin', () => { started = started || Date.now(); });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = f.elements.text.value.trim(), said = f.querySelector('.c-said'), btn = f.querySelector('button');
      if (!text) { said.textContent = 'try some words.'; return; }
      btn.disabled = true; said.textContent = 'sending…';
      const r = await send({ parent, name: f.elements.who.value.trim(), text, website: f.elements.website.value, ms: Date.now() - (started || Date.now()) });
      btn.disabled = false;
      if (!r || !r.ok) { said.textContent = (r && r.why) || 'that note got lost on the way. try again?'; return; }
      rememberName(f.elements.who.value.trim().toLowerCase());
      f.elements.text.value = ''; said.textContent = r.boinked ? 'sent (with a boink or two).' : 'sent ♥';
      if (r.comment) { if (r.comment.id != null) rememberMine(r.comment.id); all.push(r.comment); draw(all); }
      if (parent != null) f.remove();
    });
    return f;
  }
  function openForm(noteEl, parent) {
    const open = noteEl.querySelector(':scope > .c-form');
    if (open) { open.remove(); return; }
    const f = form(parent); noteEl.querySelector(':scope > .c-kids').before(f); f.elements.text.focus();
  }

  // ---- the section
  box.innerHTML = `<h3>leave a little note ♥</h3>${PREVIEW ? '<p class="c-preview">(a preview: notes here are kept only in this browser)</p>' : ''}`;
  const top = form(null), listEl = document.createElement('div'); listEl.className = 'c-list';
  box.append(top, listEl);
  let all = [];
  load().then((list) => {
    if (!list) { listEl.innerHTML = '<p class="c-quiet">the notes are resting just now.</p>'; return; }
    all = list; draw(all);
  });
})();
