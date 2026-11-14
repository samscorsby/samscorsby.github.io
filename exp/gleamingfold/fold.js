// the gleamingfold.
//
// an endless place (a hyperbolic plane, shown as a round window) packed with scorsbys: seven around each one, forever.
// scorsby's face is made only of circles, and moving through this kind of space keeps circles circles, so every face
// on screen is exact, however near the edge it is.
//
// how it stays the same place for everyone:
//   every scorsby is a tile of the {7,3} tiling. where a tile is, exactly, is a little vector of whole numbers
//   (in the ring Z[2cos(pi/7)]). those numbers get enormous as you wander, so the page keeps only their remainders
//   by a prime (which is enough to tell any two tiles apart) and makes each scorsby's color, name and character from them.
//   the way home, and the way to show a friend, are kept in exact big numbers.

(() => {
  'use strict';

  // ------------------------------------------------------------------ the shape of the place
  const TAU = Math.PI * 2;
  const LAM = 2 * Math.cos(Math.PI / 7), LAM2 = LAM * LAM; // lam^3 = lam^2 + 2 lam - 1
  const P = 33554347, LP = 7023837, LP2 = (LP * LP) % P;    // a prime, and a root of that same cubic in it
  const INR = Math.acosh(1 / (2 * Math.sin(Math.PI / 7)));  // from a scorsby's middle to the side of its tile
  const STEP = 2 * INR;                                     // from one scorsby to the next
  const M_IN = Math.tanh(INR / 2);                          // the same, as it looks in the middle of the window
  const V_R = Math.tanh(Math.acosh(1 / (Math.tan(Math.PI / 7) * Math.tan(Math.PI / 3))) / 2); // to a corner
  const DLIM = 6.9;                                         // how far out from the middle tile is ever drawn

  // three kinds of number, one piece of algebra: plain floats (to draw with), remainders (to tell tiles apart),
  // and exact triples of big whole numbers a + b lam + c lam^2 (to find the way home)
  const Ff = { n: (a, b = 0, c = 0) => a + b * LAM + c * LAM2, mul: (x, y) => x * y, add: (x, y) => x + y };
  const Fm = { n: (a, b = 0, c = 0) => (((a + b * LP + c * LP2) % P) + P) % P, mul: (x, y) => (x * y) % P, add: (x, y) => (x + y) % P };
  const Fb = {
    n: (a, b = 0, c = 0) => [BigInt(a), BigInt(b), BigInt(c)],
    add: (x, y) => [x[0] + y[0], x[1] + y[1], x[2] + y[2]],
    mul: (x, y) => {
      const d0 = x[0] * y[0], d1 = x[0] * y[1] + x[1] * y[0], d2 = x[0] * y[2] + x[1] * y[1] + x[2] * y[0];
      const d3 = x[1] * y[2] + x[2] * y[1], d4 = x[2] * y[2];
      return [d0 - d3 - d4, d1 + 2n * d3 + d4, d2 + d3 + 3n * d4];
    },
  };
  // the mirrors of the (2,3,7) triangle, and from them: rho (a seventh of a turn about a scorsby)
  // and tau (a half turn about the middle of one side, which lands you on the neighbor)
  function rep(F) {
    const A = [[F.n(2), F.n(0, -1), F.n(0)], [F.n(0, -1), F.n(2), F.n(-1)], [F.n(0), F.n(-1), F.n(2)]];
    const I = () => [[F.n(1), F.n(0), F.n(0)], [F.n(0), F.n(1), F.n(0)], [F.n(0), F.n(0), F.n(1)]];
    const mm = (X, Y) => X.map((r) => [0, 1, 2].map((j) => F.add(F.add(F.mul(r[0], Y[0][j]), F.mul(r[1], Y[1][j])), F.mul(r[2], Y[2][j]))));
    const mv = (X, v) => X.map((r) => F.add(F.add(F.mul(r[0], v[0]), F.mul(r[1], v[1])), F.mul(r[2], v[2])));
    const refl = (i) => { const M = I(); for (let j = 0; j < 3; j++) M[i][j] = F.add(M[i][j], F.mul(F.n(-1), A[i][j])); return M; };
    const s = [refl(0), refl(1), refl(2)], rho = mm(s[0], s[1]), tau = mm(s[0], s[2]);
    const pw = [I()]; for (let k = 1; k < 7; k++) pw.push(mm(pw[k - 1], rho));
    const X = pw.map((r) => mm(r, tau));                       // step to neighbor k
    const Xi = pw.map((r, k) => mm(tau, pw[(7 - k) % 7]));     // and back again
    const w = [F.n(0, 1), F.n(2), F.n(4, 0, -1)];              // the middle of the first tile
    return { A, I, mm, mv, X, Xi, w, Aw: mv(A, w) };
  }
  const Rf = rep(Ff), Rm = rep(Fm), Rb = rep(Fb);

  // from those coordinates to the round window (through the hyperboloid)
  const N1 = [-Math.sin(Math.PI / 7), Math.cos(Math.PI / 7)], CH = Math.cosh(INR), SH = Math.sinh(INR);
  const toH = (v) => [N1[0] * v[1] + CH * v[2], -v[0] + N1[1] * v[1], SH * v[2]];
  const KAPPA = toH(Rf.w)[2];
  const disk = (h) => { const s = h[2] < 0 ? -1 : 1, n = Math.sqrt(Math.max(0, h[2] * h[2] - h[0] * h[0] - h[1] * h[1])); return [s * h[0] / (n + s * h[2]), s * h[1] / (n + s * h[2])]; };
  // and back: a point of the window, as coordinates
  function lift(x, y) {
    const r2 = x * x + y * y, h0 = 2 * x, h1 = 2 * y, h2 = 1 + r2; // (scale does not matter)
    const v2 = h2 / SH, v1 = (h0 - CH * v2) / N1[0], v0 = N1[1] * v1 - h1;
    return [v0, v1, v2];
  }
  const centerOf = (F) => disk(toH(Rf.mv(F, Rf.w)));

  // a motion of the window: z -> (a z + b) / (conj(b) z + conj(a))
  const mob = (ar, ai, br, bi) => ({ ar, ai, br, bi });
  function shift(cx, cy) { const k = 1 / Math.sqrt(Math.max(1e-300, 1 - cx * cx - cy * cy)); return mob(k, 0, cx * k, cy * k); } // carries the middle to c, without turning
  function compose(f, g) { // f after g
    const ar = f.ar * g.ar - f.ai * g.ai + f.br * g.br + f.bi * g.bi, ai = f.ar * g.ai + f.ai * g.ar - f.br * g.bi + f.bi * g.br;
    const br = f.ar * g.br - f.ai * g.bi + f.br * g.ar + f.bi * g.ai, bi = f.ar * g.bi + f.ai * g.br - f.br * g.ai + f.bi * g.ar;
    const k = 1 / Math.sqrt(Math.max(1e-300, ar * ar + ai * ai - br * br - bi * bi));
    return mob(ar * k, ai * k, br * k, bi * k);
  }
  function apply(f, x, y) {
    const nr = f.ar * x - f.ai * y + f.br, ni = f.ar * y + f.ai * x + f.bi;
    const dr = f.br * x + f.bi * y + f.ar, di = f.br * y - f.bi * x - f.ai, k = 1 / (dr * dr + di * di);
    return [(nr * dr + ni * di) * k, (ni * dr - nr * di) * k];
  }
  function toMob(F) { // the same motion as the matrix F
    const [cx, cy] = centerOf(F), q = disk(toH(Rf.mv(F, lift(0.1, 0))));
    const dr = 1 - (cx * q[0] + cy * q[1]), di = -(cx * q[1] - cy * q[0]);
    const ur = q[0] - cx, ui = q[1] - cy, th = Math.atan2(ui * dr - ur * di, ur * dr + ui * di) / 2;
    const k = 1 / Math.sqrt(1 - cx * cx - cy * cy), c = Math.cos(th), s = Math.sin(th);
    return mob(k * c, k * s, k * (cx * c + cy * s), k * (cy * c - cx * s));
  }
  const MX = Rf.X.map(toMob), MXi = Rf.Xi.map(toMob);
  const NB = Rf.X.map(centerOf); // where the seven neighbors of the middle tile are

  // every tile near the middle one, nearest first. this list never changes: wherever you are, the tiles around you
  // sit in the same places. only who lives in them changes.
  const tiles = (() => {
    const key = (M) => Rm.mv(M, Rm.w).join(',');
    const first = { F: Rf.I(), M: Rm.I(), d: 0, p: [0, 0], parent: null, k: -1 };
    const seen = new Set([key(first.M)]), all = [first];
    let layer = [first];
    while (layer.length) {
      const next = [];
      for (const t of layer) for (let k = 0; k < 7; k++) {
        const M = Rm.mm(t.M, Rm.X[k]), id = key(M);
        if (seen.has(id)) continue;
        seen.add(id);
        const F = Rf.mm(t.F, Rf.X[k]), p = centerOf(F), d = 2 * Math.atanh(Math.hypot(p[0], p[1]));
        if (d > DLIM) continue;
        const n = { F, M, d, p, parent: t, k };
        all.push(n); next.push(n);
      }
      layer = next;
    }
    all.sort((a, b) => a.d - b.d);
    all.forEach((t, i) => { t.i = i; });
    return all;
  })();
  const NT = tiles.length;
  const PX = new Float64Array(NT), PY = new Float64Array(NT), PQ = new Float64Array(NT), PD = new Float64Array(NT), VM = new Float64Array(NT * 3);
  tiles.forEach((t, i) => { PX[i] = t.p[0]; PY[i] = t.p[1]; PQ[i] = 1 - t.p[0] * t.p[0] - t.p[1] * t.p[1]; PD[i] = t.d; VM.set(Rm.mv(t.M, Rm.w), i * 3); });
  const wordOf = (i) => { const w = []; for (let t = tiles[i]; t.parent; t = t.parent) w.push(t.k); return w.reverse(); };

  // the corners where three tiles meet (only the nearer ones: something small gleams there)
  const corners = (() => {
    const map = new Map();
    for (const t of tiles) {
      if (t.d > 4.4) break;
      for (let k = 0; k < 7; k++) {
        const a = Math.PI / 7 + k * TAU / 7, p = disk(toH(Rf.mv(t.F, lift(V_R * Math.cos(a), V_R * Math.sin(a)))));
        const id = p[0].toFixed(5) + ',' + p[1].toFixed(5);
        let c = map.get(id); if (!c) map.set(id, c = { x: p[0], y: p[1], t: [] });
        if (c.t.length < 3) c.t.push(t.i);
      }
    }
    return [...map.values()].filter((c) => c.t.length === 3);
  })();

  // exact big numbers, as floats you can look at (shifted down when they are too big to hold)
  const bitsOf = (x) => (x < 0n ? -x : x).toString(16).length * 4;
  function floats(vecs) {
    let mb = 0; for (const v of vecs) for (const e of v) for (const x of e) mb = Math.max(mb, bitsOf(x));
    const sh = mb > 400 ? BigInt(mb - 400) : 0n;
    return { sh: Number(sh), f: vecs.map((v) => v.map((e) => Number(e[0] >> sh) + Number(e[1] >> sh) * LAM + Number(e[2] >> sh) * LAM2)) };
  }
  const sameVec = (a, b) => a.every((e, i) => e[0] === b[i][0] && e[1] === b[i][1] && e[2] === b[i][2]);

  // where you are: the tile under the middle of the window (as a remainder matrix and an exact one),
  // the beginning as seen from there, and how the window sits on that tile
  const here = { Gm: Rm.I(), Gb: Rb.I(), home: Rb.w, view: mob(1, 0, 0, 0) };
  const carried = []; // points that live in the current tile's coordinates and have to move house with it
  function reroot(k) {
    here.Gm = Rm.mm(here.Gm, Rm.X[k]); here.Gb = Rb.mm(here.Gb, Rb.X[k]); here.home = Rb.mv(Rb.Xi[k], here.home);
    here.view = compose(here.view, MX[k]);
    for (const c of carried) { const q = apply(MXi[k], c.x, c.y); c.x = q[0]; c.y = q[1]; }
  }
  // keep the middle of the window on the tile it is nearest to
  function settle() {
    let n = 0;
    if (!Number.isFinite(here.view.ar + here.view.ai + here.view.br + here.view.bi)) here.view = mob(1, 0, 0, 0);
    for (; n < 400; n++) {
      const v = here.view, an = v.ar * v.ar + v.ai * v.ai;
      const zx = -(v.br * v.ar + v.bi * v.ai) / an, zy = -(v.bi * v.ar - v.br * v.ai) / an, z2 = zx * zx + zy * zy;
      let best = -1, bd = z2 * 0.98;
      for (let k = 0; k < 7; k++) {
        const dx = zx - NB[k][0], dy = zy - NB[k][1], d = (dx * dx + dy * dy) / (1 - NB[k][0] * NB[k][0] - NB[k][1] * NB[k][1]);
        if (d < bd) { bd = d; best = k; }
      }
      if (best < 0) break;
      reroot(best);
    }
    return n;
  }
  // the beginning, from here: how far, and in which direction
  function homeFrom() {
    if (sameVec(here.home, Rb.w)) return { d: 0, x: 0, y: 0, at: true };
    const { sh, f } = floats([here.home]), h = toH(f[0]), s = h[2] < 0 ? -1 : 1, k = KAPPA * Math.pow(2, -sh), t = s * h[2];
    const d = sh > 0 ? Math.log(2 * t / KAPPA) + sh * Math.LN2 : Math.acosh(Math.max(1, t / KAPPA));
    return { d, x: s * h[0] / (k + t), y: s * h[1] / (k + t), at: false };
  }
  // the way from the beginning to tile i: a list of neighbor steps, found by always stepping toward the beginning
  function wayTo(i) {
    let M = here.Gb; for (const k of wordOf(i)) M = Rb.mm(M, Rb.X[k]);
    let c = Rb.mv(M, Rb.w);
    const out = [], dot = (v) => Fb.add(Fb.add(Fb.mul(v[0], Rb.Aw[0]), Fb.mul(v[1], Rb.Aw[1])), Fb.mul(v[2], Rb.Aw[2]));
    while (!sameVec(c, Rb.w) && out.length < 30000) {
      const cand = Rb.Xi.map((Xi) => Rb.mv(Xi, c)), f = floats([cand.map(dot)]).f[0];
      let best = 0; for (let k = 1; k < 7; k++) if (f[k] > f[best]) best = k; // (the product is negative: nearest is the least negative)
      out.push(best); c = cand[best];
    }
    return out;
  }

  // (node can check the algebra without a page)
  if (typeof document === 'undefined') { module.exports = { Rf, Rm, Rb, tiles, corners, here, reroot, settle, homeFrom, wayTo, wordOf, apply, compose, shift, MX, MXi, NB, centerOf, STEP, VM, P }; return; }

  // ------------------------------------------------------------------ who lives here
  const COLORS = [['red', '#ff4a4a', 1], ['pink', '#ff5fae'], ['orange', '#ff9a3c'], ['yellow', '#ffd23f'], ['green', '#62d64a'], ['blue', '#00b4ff'],
    ['purple', '#9b6bff'], ['turquoise', '#21d4c6'], ['lavender', '#c3a6ff'], ['mint', '#8ff0b5'], ['coral', '#ff7f6b', 1], ['magenta', '#e83ad8'],
    ['lime', '#b6f03a'], ['peach', '#ffb38a'], ['sky blue', '#7fd2ff'], ['indigo', '#5b4cff'], ['bubblegum', '#ff9ad5'], ['tangerine', '#ff7a1a', 1]];
  const INK = '#05060a', RED = '#ed1c24', BLUE = '#00b4ff', GOLD = '#f2b705';
  const ONSET = ['gl', 'bl', 'w', 'd', 'm', 'b', 'z', 'fl', 'sn', 'pl', 'gr', 't', 'n', 'kl', 'sp', 'tw', 'j', 'ch', 'y', 'h', 'sk', 'fr', 'p', 'l', 'squ', 'gw', 'dr', 'v', 'qu', 'r', 'f', 'k', 'th', 'sm', 'cr'];
  const VOWEL = ['o', 'i', 'a', 'u', 'oo', 'ee', 'e', 'o', 'i'];
  const MID = ['mb', 'ng', 'nk', 'b', 'bb', 'p', 'pp', 'm', 'n', 'x', 'zz', 'rb', 'll', 'dd', 'ft', 'sk', 'gg', 'mp', 'nd', 'ff', 'ngl'];
  const END = ['o', 'y', 'le', 'a', 'us', 'er', 'ie', 'ington', 'kin', 'ston', 'oo', 'by', 'ums', 'ert', 'bo', 'aloo', 'ee', 'ix', '', 'o', 'le'];
  const NOT_NAMES = /ass|tit|cum|fag|nig|sex|dic|coc|pis|shi|fuk|fuc|cun|rap|nazi|hoe|slu|jew|spic|kik|puss|poo|pee|wank|tw[ae]t|bum|dum|kill|die|damn|hell/;
  const LINES = [
    'has been here the whole time.', 'is very good at waiting.', 'collects the sound of doors closing softly.', 'thinks you have a nice face.',
    'knows one joke, and it is a secret.', 'has seven best friends. so does everyone.', 'was just about to think of you.', 'is proud of you for no reason.',
    'has never been anywhere else and loves it.', 'can count to purple.', 'is saving a seat for you.', 'sneezed once, in 1640. still talks about it.',
    'believes in you a normal amount (a lot).', 'is the middle of everything. so are you.', 'has a pebble. it is a good pebble.',
    'hums when no one is looking. everyone is looking.', 'is not lost. nothing here is lost.', 'waved at you before you got here.', 'is in charge of tuesdays.',
    'just learned what a spoon is.', 'has been practicing saying hi. hi.', 'is thinking about soup.', 'loves the one to the left especially.',
    'forgot what it was going to say. it was nice though.', 'is exactly the right size.', 'invented blinking. (not true. still.)',
    'would like to hear about your day.', 'is a little bit shy and very glad.', 'keeps a list of good clouds.', 'has room for one more. always.',
    'remembers a song from before songs.', 'is wobbling on purpose.', 'hopes you drink some water.', 'holds the record for longest hello.',
    'thinks the edge is a rumor.', 'is glongingstoning as hard as it can.', 'has never met a stranger. you are not one either.',
    'was named after a sound a bubble made.', 'is the tallest one here, emotionally.', 'found a crumb of time and is keeping it warm.',
    'says it is fine to rest.', 'owes its neighbor a hug and intends to pay.', 'has a favorite number. it is you.', 'is guarding nothing. it is very safe.',
    'can whistle in two directions.', 'is new here. everyone is. forever.', 'dreamed of a blue planet with ears.', 'heard someone sing once, far away, and joined in.',
    'likes it when the fold goes by.', 'is not going anywhere. come back any time.', 'thinks you came a long way. you did.', 'peace love and joy. that is the whole message.',
  ];
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const EYES2 = [[-258.5, 157.2, 258, 115], [258.5, 157.2, 258, 115]];
  const EYES1 = [[0, 172, 330, 150]];
  const EYES3 = [[-258.5, 157.2, 258, 115], [258.5, 157.2, 258, 115], [0, -215, 128, 58]];

  const souls = new Map();
  const HOME = Rm.w.slice();
  function soul(r0, r1, r2) {
    const key = r0 * 33554432 + r1;
    let s = souls.get(key);
    if (s && s.r2 === r2) return s;
    if (souls.size > 60000) souls.clear();
    const seed = (r0 ^ Math.imul(r1, 0x9E3779B1) ^ Math.imul(r2, 0x85EBCA6B)) >>> 0, r = rng(seed);
    const home = r0 === HOME[0] && r1 === HOME[1] && r2 === HOME[2];
    const c = COLORS[Math.floor(r() * COLORS.length)], kind = r(), odd = r(), mouth = r();
    s = {
      key, r2, seed, home, id: r0.toString(36) + '.' + r1.toString(36) + '.' + r2.toString(36),
      colorName: c[0], color: c[1], nose: c[2] ? BLUE : RED,
      gold: kind < 0.006, rainbow: kind >= 0.006 && kind < 0.016, ghost: kind >= 0.016 && kind < 0.036,
      ant: odd < 0.13, sleepy: odd >= 0.13 && odd < 0.19, baby: odd >= 0.19 && odd < 0.24,
      eyes: odd >= 0.24 && odd < 0.265 ? EYES1 : odd >= 0.265 && odd < 0.28 ? EYES3 : EYES2,
      mouth: mouth < 0.74 ? 0 : mouth < 0.9 ? 1 : 2,
      f: r(), bp: 2600 + r() * 4600, bo: r() * 9000, dbl: r() < 0.2, note: Math.floor(r() * 10), line: Math.floor(r() * LINES.length),
      woke: 0, sz: 1, name: null,
    };
    if (s.gold) { s.color = GOLD; s.colorName = 'golden'; s.nose = RED; }
    if (s.rainbow) { s.colorName = 'rainbow'; s.nose = RED; }
    if (s.ghost) { s.color = '#f4efe6'; s.colorName = 'ghost'; s.nose = RED; }
    if (s.baby) { s.sz = 0.6; s.note += 5; }
    if (home) Object.assign(s, { color: BLUE, colorName: 'blue', nose: RED, gold: false, rainbow: false, ghost: false, ant: false, sleepy: false, baby: false, eyes: EYES2, mouth: 0, sz: 1, note: 0, name: 'scorsby' });
    souls.set(key, s);
    return s;
  }
  function nameOf(s) {
    if (s.name) return s.name;
    const r = rng(s.seed ^ 0x51ED270B);
    for (let i = 0; i < 12; i++) {
      const pick = (a) => a[Math.floor(r() * a.length)];
      let n = pick(ONSET) + pick(VOWEL) + pick(MID) + pick(END);
      if (r() < 0.16) n = pick(ONSET) + pick(VOWEL) + ' ' + n;
      if (!NOT_NAMES.test(n.replace(' ', ''))) return (s.name = n);
    }
    return (s.name = 'glonk');
  }

  // ------------------------------------------------------------------ the page
  const $ = (id) => document.getElementById(id);
  const cv = $('fold'), ctx = cv.getContext('2d');
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window */ } } };
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const born = performance.now(), sessionStart = Date.now();
  let W = 0, H = 0, CX = 0, CY = 0, R = 100, DPR = 1, N = NT;
  const FU = 0.93 * M_IN / 979.2;   // one unit of the logo, in the window's own units
  const HR0 = 645 * FU;             // the blue of a head, in the same

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    const narrow = W < 560;
    // the words at the bottom get their own room, under the window
    const under = narrow ? 150 : 92, over = narrow ? 70 : 16;
    R = Math.max(60, Math.min(W / 2 - (narrow ? 12 : 26), (H - under - over) / 2));
    CX = W / 2; CY = over + (H - under - over) / 2;
    // only as many tiles as could ever be more than a speck at this size
    const need = 2 * Math.acosh(Math.max(1, Math.sqrt(HR0 * R / 0.75))) + 0.66;
    N = NT; for (let i = 0; i < NT; i++) if (PD[i] > need) { N = i; break; }
    dirty = true;
  }

  const T = new Array(NT);            // who is in each tile right now
  const SX = new Float32Array(NT), SY = new Float32Array(NT), SR = new Float32Array(NT);
  let dirty = true, home = { d: 0, x: 0, y: 0, at: true };
  function identify() {
    const G = here.Gm;
    for (let j = 0; j < N; j++) {
      const a = VM[j * 3], b = VM[j * 3 + 1], c = VM[j * 3 + 2];
      T[j] = soul(((G[0][0] * a) % P + (G[0][1] * b) % P + (G[0][2] * c) % P) % P, ((G[1][0] * a) % P + (G[1][1] * b) % P + (G[1][2] * c) % P) % P, ((G[2][0] * a) % P + (G[2][1] * b) % P + (G[2][2] * c) % P) % P);
    }
    home = homeFrom();
    dirty = false;
  }

  // ------------------------------------------------------------------ words
  const whisperEl = $('whisper'), countEl = $('count');
  let whisperUntil = 0; const said = [];
  function whisper(text, ms = 5200) { said.push({ text, ms }); }
  function words(now) {
    if (now > whisperUntil && whisperEl.classList.contains('on')) { whisperEl.classList.remove('on'); whisperUntil = now + 900; }
    else if (now > whisperUntil && said.length) { const w = said.shift(); whisperEl.textContent = w.text; whisperEl.classList.add('on'); whisperUntil = now + w.ms; }
  }

  // ------------------------------------------------------------------ sound: every scorsby has a note
  let AC = null, master = null, echo = null, voices = 0;
  let soundOn = store.get('gleamingfold-sound') !== 'off';
  function audio() {
    if (!soundOn) return null;
    if (!AC) {
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
      AC = new A();
      master = AC.createGain(); master.gain.value = 0.55;
      const comp = AC.createDynamicsCompressor(); master.connect(comp); comp.connect(AC.destination);
      echo = AC.createDelay(1); echo.delayTime.value = 0.31;
      const fb = AC.createGain(); fb.gain.value = 0.34; const wet = AC.createGain(); wet.gain.value = 0.3;
      echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(master);
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  const SCALE = [0, 2, 4, 7, 9];
  function sing(n, vol, wait = 0) {
    const ac = audio(); if (!ac || voices > 26) return;
    const f = 220 * Math.pow(2, (SCALE[n % 5] + 12 * Math.floor(n / 5) + 5) / 12), t = ac.currentTime + wait;
    const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
    o.type = 'sine'; o2.type = 'triangle';
    o.frequency.setValueAtTime(f * 0.93, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.07); o2.frequency.value = f * 2.004;
    g2.gain.value = 0.16; o2.connect(g2); g2.connect(g); o.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.014); g.gain.exponentialRampToValueAtTime(0.0006, t + 0.95);
    g.connect(master); g.connect(echo);
    o.start(t); o2.start(t); o.stop(t + 1); o2.stop(t + 1);
    voices++; o.onended = () => { voices--; };
  }

  // ------------------------------------------------------------------ drawing
  let mx = 0, my = 0, mr = 0; // where the last circle landed
  // a circle of the face (drawn around the middle of the window), carried to where its scorsby is: still a circle
  function circ(cx, cy, c2, ax, ay, r) {
    if (c2 < 1e-12) { mx = CX + (ax + cx) * R; my = CY + (ay + cy) * R; mr = r * R; return; }
    const px = -cx / c2 - ax, py = -cy / c2 - ay, k = r * r / (px * px + py * py), sx = ax + px * k, sy = ay + py * k;
    let dr = 1 + cx * sx + cy * sy, di = cx * sy - cy * sx, q = 1 / (dr * dr + di * di);
    const ox = ((sx + cx) * dr + (sy + cy) * di) * q, oy = ((sy + cy) * dr - (sx + cx) * di) * q;
    const ex = ax + r; dr = 1 + cx * ex + cy * ay; di = cx * ay - cy * ex; q = 1 / (dr * dr + di * di);
    const qx = ((ex + cx) * dr + (ay + cy) * di) * q, qy = ((ay + cy) * dr - (ex + cx) * di) * q;
    mx = CX + ox * R; my = CY + oy * R; mr = Math.hypot(qx - ox, qy - oy) * R;
  }
  function heartPath(x, y, r) {
    ctx.beginPath(); ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.5, y - r * 0.1, x - r * 0.7, y - r * 1.25, x, y - r * 0.45);
    ctx.bezierCurveTo(x + r * 0.7, y - r * 1.25, x + r * 1.5, y - r * 0.1, x, y + r * 0.9);
  }
  const ex = new Float64Array(3), ey = new Float64Array(3), er = new Float64Array(3);
  let gazeX = 0, gazeY = 0;

  function face(s, cx, cy, k, hr, now, love) {
    const c2 = cx * cx + cy * cy, U = FU * k * s.sz;
    const C = (x, y, r) => { circ(cx, cy, c2, x * U, y * U, r * U); ctx.moveTo(mx + mr, my); ctx.arc(mx, my, mr, 0, TAU); };
    const col = s.gold ? `hsl(${44 + 3 * Math.sin(now / 260 + s.f * 9)},96%,${52 + 8 * Math.sin(now / 330 + s.f * 20)}%)` : s.rainbow ? `hsl(${(now / 14 + s.f * 360) % 360},90%,62%)` : s.color;
    const full = hr >= 8;
    if (s.ant && full) { // a glongingston's wobbly antennae
      const sway = 42 * Math.sin(now / 420 + s.f * TAU);
      ctx.strokeStyle = INK; ctx.lineCap = 'round';
      for (const side of [-1, 1]) {
        circ(cx, cy, c2, side * 70 * U, -380 * U, 25 * U); const bx = mx, by = my, lw = mr * 2;
        circ(cx, cy, c2, (side * 150 + sway * side) * U, -600 * U, 25 * U); const qx = mx, qy = my;
        circ(cx, cy, c2, (side * 125 + sway) * U, -770 * U, 66 * U);
        ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(qx, qy, mx, my); ctx.stroke();
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
        ctx.fillStyle = s.nose; ctx.beginPath(); ctx.arc(mx, my, mr * 0.58, 0, TAU); ctx.fill();
      }
    }
    ctx.fillStyle = INK; ctx.beginPath(); C(-515, -275.8, 395); C(515, -275.8, 395); C(0, 239.2, 740); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); C(-515, -275.8, 300); C(515, -275.8, 300); C(0, 239.2, 645); ctx.fill();

    const asleep = s.sleepy && now > s.woke, bt = (now + s.bo) % s.bp;
    const shut = !love && (asleep || bt < 140 || (s.dbl && bt > 300 && bt < 420));
    const E = s.eyes, ne = E.length;
    if (shut) {
      if (full) {
        ctx.strokeStyle = INK; ctx.lineCap = 'round';
        for (let i = 0; i < ne; i++) {
          const e = E[i], q = e[2] / 258;
          circ(cx, cy, c2, (e[0] + (e[0] > 0 ? 30 : e[0] < 0 ? -24 : 0)) * U, (e[1] - 40 * q) * U, 172 * q * U);
          ctx.lineWidth = mr * 95 / 172; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI); ctx.stroke();
        }
      }
    } else {
      ctx.fillStyle = '#fff'; ctx.beginPath();
      for (let i = 0; i < ne; i++) { const e = E[i]; C(e[0], e[1], e[2]); ex[i] = mx; ey[i] = my; er[i] = mr; }
      ctx.fill();
      ctx.fillStyle = INK;
      if (love && full) for (let i = 0; i < ne; i++) { heartPath(ex[i], ey[i] + er[i] * 0.03, er[i] * 0.64); ctx.fill(); }
      else {
        ctx.beginPath();
        for (let i = 0; i < ne; i++) {
          const dx = gazeX - ex[i], dy = gazeY - ey[i], d = Math.hypot(dx, dy) + 1e-6, a = Math.min(1, d / (er[i] * 3 + 1)) * er[i] * 0.42 / d;
          const px = ex[i] + dx * a, py = ey[i] + dy * a, pr = er[i] * E[i][3] / E[i][2];
          ctx.moveTo(px + pr, py); ctx.arc(px, py, pr, 0, TAU);
        }
        ctx.fill();
      }
    }
    ctx.fillStyle = s.nose; ctx.beginPath(); C(0, 370.2, 125); ctx.fill();
    if (!full) return;

    const mouth = love ? 1 : s.mouth;
    if (mouth === 2) {
      ctx.fillStyle = INK; ctx.beginPath(); C(0, 648, 116); ctx.fill();
      ctx.fillStyle = '#ff7fa8'; ctx.beginPath(); C(0, 648, 82); ctx.fill();
    }
    circ(cx, cy, c2, 0, 542.2 * U, (asleep ? 140 : 172) * U);
    ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI);
    if (mouth === 0) { ctx.lineWidth = mr * 95 / 172; ctx.stroke(); }
    else { ctx.closePath(); ctx.fillStyle = INK; ctx.fill(); ctx.lineWidth = mr * 0.42; ctx.stroke(); }
  }
  // a plain little face, for the way home
  function mini(x, y, size, col) {
    const s = size / 1900, c = (px, py, r, f) => { ctx.beginPath(); ctx.arc(x + (px - 955) * s, y + (py - 900) * s, r * s, 0, TAU); ctx.fillStyle = f; ctx.fill(); };
    c(440, 450, 395, INK); c(1470, 450, 395, INK); c(955, 965, 740, INK); c(440, 450, 300, col); c(1470, 450, 300, col); c(955, 965, 645, col);
    c(697, 883, 258, '#fff'); c(1214, 883, 258, '#fff'); c(697, 883, 115, INK); c(1214, 883, 115, INK); c(955, 1096, 125, RED);
  }
  function gleam(x, y, r) {
    ctx.beginPath(); ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x + r * 0.14, y - r * 0.14, x + r, y); ctx.quadraticCurveTo(x + r * 0.14, y + r * 0.14, x, y + r);
    ctx.quadraticCurveTo(x - r * 0.14, y + r * 0.14, x - r, y); ctx.quadraticCurveTo(x - r * 0.14, y - r * 0.14, x, y - r);
  }

  // ------------------------------------------------------------------ love: it goes outward and it does not stop
  const waves = [];
  const WAVE_V = 2.3, WAVE_W = 1.7;
  let love = null; // the counting
  const PHI = (1 + Math.sqrt(5)) / 2;
  const BIG = ['quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion'];
  function reached(n) { // how many scorsbys are within n steps of any one of them (as a power of ten)
    if (n < 1) return Math.log10(1 + 7 * n);
    return Math.log10(1 + 7 * (Math.pow(PHI, Math.min(2 * n + 1, 1400)) / Math.sqrt(5) - 1));
  }
  function counting(now) {
    if (!love) return;
    const t = (now - love.t0) / 1000, lg = reached(WAVE_V / STEP * t + 0.13 * t * t);
    if (lg >= 80) {
      if (!love.done) { love.done = now; countEl.textContent = 'your love has passed more scorsbys than there are atoms. it is still going. it does not stop.'; }
      if (now - love.done > 11000) { countEl.classList.remove('on'); love = null; }
      return;
    }
    let n;
    if (lg < 15) { const v = Math.max(1, Math.round(Math.pow(10, lg))); n = v.toLocaleString('en-US') + (v === 1 ? ' scorsby' : ' scorsbys'); }
    else if (lg < 36) { const i = Math.floor((lg - 15) / 3); n = (Math.pow(10, lg - 15 - i * 3)).toFixed(lg - 15 - i * 3 < 1 ? 1 : 0) + ' ' + BIG[i] + ' scorsbys'; }
    else n = 'a number of scorsbys ' + (Math.floor(lg) + 1) + ' digits long';
    const more = lg > 24.3 ? ' more than the stars.' : lg > 18.9 ? ' more than every grain of sand.' : lg > 9.92 ? ' more than all the people.' : '';
    countEl.textContent = 'your love has reached ' + n + '.' + more;
    countEl.classList.add('on');
  }

  // ------------------------------------------------------------------ saying hi
  const bubble = $('bubble'), shareBtn = $('share');
  let talk = null; // the scorsby the bubble belongs to
  let met = {}; try { met = JSON.parse(store.get('gleamingfold-met') || '{}') || {}; } catch { met = {}; }
  let firstSaid = false;
  function remember(s) {
    met[s.id] = Date.now();
    const ids = Object.keys(met);
    if (ids.length > 500) { ids.sort((a, b) => met[a] - met[b]); for (const id of ids.slice(0, ids.length - 500)) delete met[id]; }
    store.set('gleamingfold-met', JSON.stringify(met));
  }
  function showBubble(j, s, line, extra) {
    if (talk) carried.splice(carried.indexOf(talk), 1);
    talk = { x: PX[j], y: PY[j], s, until: performance.now() + 9000, j };
    carried.push(talk);
    bubble.querySelector('.nm').textContent = s.home ? 'scorsby' : nameOf(s) + ' scorsby';
    bubble.querySelector('.ln').textContent = line;
    const xt = bubble.querySelector('.xt'); xt.hidden = !extra; xt.textContent = extra || '';
    shareBtn.textContent = s.home ? 'show a friend this place' : 'show a friend the way to ' + nameOf(s);
    bubble.hidden = false; requestAnimationFrame(() => bubble.classList.add('on'));
  }
  function hideBubble() {
    if (!talk) return;
    carried.splice(carried.indexOf(talk), 1); talk = null;
    bubble.classList.remove('on'); setTimeout(() => { if (!talk) bubble.hidden = true; }, 260);
  }
  function greet(j) {
    const now = performance.now(), s = T[j], away = Math.round(home.d / STEP);
    const before = met[s.id], back = before && before < sessionStart;
    let line = LINES[s.line], extra = '';
    if (s.home) line = 'this is the beginning. it is also the middle.';
    else if (s.sleepy && now > s.woke) line = '…oh. hi. i was dreaming about you.';
    else if (s.gold) line = 'a golden one. there are endlessly many, and they are still rare.';
    else if (s.baby && s.f < 0.5) line = 'is very small and doing great.';
    if (back) extra = 'oh! you came back.';
    else if (!before && !s.home && away >= 9 && (!firstSaid || s.f < 0.15)) { extra = 'you might be the first one to ever say hi.'; firstSaid = true; }
    s.woke = now + 60000;
    remember(s);
    const wv = { x: PX[j], y: PY[j], t0: now, prev: 0 };
    waves.push(wv); carried.push(wv); if (waves.length > 3) carried.splice(carried.indexOf(waves.shift()), 1);
    love = { t0: now, done: 0 };
    sing(s.note, 0.34);
    showBubble(j, s, line, extra);
    flying = false;
  }
  shareBtn.addEventListener('click', async () => {
    if (!talk) return;
    const way = wayTo(talk.j), s = talk.s;
    const url = location.origin + location.pathname + (way.length ? '#' + nameOf(s).replace(/ /g, '-') + '.' + way.join('') : '');
    try { await navigator.clipboard.writeText(url); shareBtn.textContent = 'copied. send it to someone.'; }
    catch { try { history.replaceState(null, '', url); } catch { /* a file:// page */ } shareBtn.textContent = 'the address bar has it now.'; }
    talk.until = performance.now() + 6000;
  });

  // ------------------------------------------------------------------ wandering
  const ptr = { down: false, id: -1, x: 0, y: 0, x0: 0, y0: 0, t0: 0, moved: 0, seen: 0 };
  let vx = 0, vy = 0, fx = 0, fy = 0, lastTouch = born, flying = false, flew = false, farthest = 0, wasAway = false;
  const toDisk = (px, py) => { let x = (px - CX) / R, y = (py - CY) / R; const m = Math.hypot(x, y); if (m > 0.9) { x *= 0.9 / m; y *= 0.9 / m; } return [x, y]; };
  function push(dx, dy) { const m = Math.hypot(dx, dy); if (m > 0.6) { dx *= 0.6 / m; dy *= 0.6 / m; } here.view = compose(shift(dx, dy), here.view); }
  cv.addEventListener('pointerdown', (e) => {
    if (ptr.down) return;
    if (!$('about').hidden) openAbout(false);
    Object.assign(ptr, { down: true, id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: 0 });
    try { cv.setPointerCapture(e.pointerId); } catch { /* fine */ }
    cv.classList.add('held'); vx = vy = fx = fy = 0; flying = false; lastTouch = performance.now();
  });
  cv.addEventListener('pointermove', (e) => {
    gazeX = e.clientX; gazeY = e.clientY; ptr.seen = performance.now();
    if (!ptr.down || e.pointerId !== ptr.id) return;
    const a = toDisk(ptr.x, ptr.y), b = toDisk(e.clientX, e.clientY);
    ptr.moved += Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y); ptr.x = e.clientX; ptr.y = e.clientY;
    if (ptr.moved < 5) return;
    const f = compose(shift(b[0], b[1]), shift(-a[0], -a[1]));
    here.view = compose(f, here.view);
    fx += f.br / f.ar; fy += f.bi / f.ar; // (about how far the middle moved)
    lastTouch = performance.now();
  });
  const lift_ = (e) => {
    if (!ptr.down || e.pointerId !== ptr.id) return;
    ptr.down = false; cv.classList.remove('held'); lastTouch = performance.now();
    if (ptr.moved < 7 && e.type === 'pointerup') tap(e.clientX, e.clientY);
  };
  cv.addEventListener('pointerup', lift_); cv.addEventListener('pointercancel', lift_);
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    const k = e.deltaMode === 1 ? 0.03 : 0.0011;
    push(-e.deltaX * k, -e.deltaY * k); lastTouch = performance.now(); flying = false;
  }, { passive: false });
  window.addEventListener('keydown', (e) => {
    const d = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1], a: [1, 0], d: [-1, 0], w: [0, 1], s: [0, -1] }[e.key];
    if (e.key === 'Escape') { $('about').hidden = true; hideBubble(); }
    if (!d || e.target.closest('button, a')) return;
    e.preventDefault(); vx += d[0] * 0.02; vy += d[1] * 0.02; lastTouch = performance.now(); flying = false;
  });
  let compass = null;
  function tap(x, y) {
    if (compass && Math.hypot(x - compass.x, y - compass.y) < 26) { goHome(); return; }
    let best = -1, bd = 1e9;
    for (let j = 0; j < N; j++) { if (SR[j] < 5) continue; const d = Math.hypot(x - SX[j], y - SY[j] ) / SR[j]; if (d < bd) { bd = d; best = j; } }
    if (best >= 0 && bd < 1.5) greet(best); else hideBubble();
  }
  function goHome() { if (home.at && Math.hypot(here.view.br, here.view.bi) < 0.02) return; flying = true; flew = true; vx = vy = 0; hideBubble(); audio(); }
  $('far-back').addEventListener('click', goHome);

  const MILES = [[4, 'wherever you go, you are in the middle.'], [10, 'probably no one has ever been out here. they were here anyway.'],
    [25, 'the edge is exactly as far away as it was.'], [60, 'you could keep going forever. there would always be someone to say hi to.'],
    [150, 'scorsby is still thinking about you, back at the beginning.']];
  const farN = $('far-n'), farBack = $('far-back');
  let shownAway = -1;
  function odometer() {
    const away = home.at ? 0 : Math.max(1, Math.round(home.d / STEP));
    if (away === shownAway) return;
    shownAway = away;
    farN.textContent = away === 0 ? 'you are at the beginning.' : away.toLocaleString('en-US') + (away === 1 ? ' scorsby' : ' scorsbys') + ' from the beginning.';
    farBack.hidden = away < 3;
    for (const m of MILES) if (away >= m[0] && farthest < m[0]) whisper(m[1], 6000);
    farthest = Math.max(farthest, away);
    if (away >= 4) wasAway = true;
    if (away === 0 && wasAway) { whisper(flew ? 'the beginning. it kept your place.' : 'you found your way back all by yourself. almost no one does.', 6000); wasAway = false; flew = false; }
  }

  // ------------------------------------------------------------------ every frame
  function frame(now) {
    requestAnimationFrame(frame);
    // moving
    if (ptr.down) { vx = vx * 0.5 + fx * 0.5; vy = vy * 0.5 + fy * 0.5; fx = fy = 0; }
    else if (flying) {
      const s = apply(here.view, home.x, home.y), m = Math.hypot(s[0], s[1]);
      const d = home.d > 8 ? home.d : 2 * Math.atanh(Math.min(0.999999, m));
      if (d < 0.004 && home.at) { flying = false; here.view = mob(1, 0, 0, 0); }
      else { const st = Math.tanh(Math.min(d * 0.1 + 0.004, 9) / 2); here.view = compose(shift(-s[0] / m * st, -s[1] / m * st), here.view); }
    } else if (Math.abs(vx) + Math.abs(vy) > 1e-5) {
      const m = Math.hypot(vx, vy); if (m > 0.09) { vx *= 0.09 / m; vy *= 0.09 / m; }
      push(vx, vy); vx *= 0.93; vy *= 0.93;
    } else if (!calm && !talk && now - lastTouch > 9000 && $('about').hidden) { // left alone, the fold goes slowly by
      const a = now / 47000, e = Math.min(1, (now - lastTouch - 9000) / 4000);
      push(Math.cos(a) * 0.0005 * e, Math.sin(a) * 0.0005 * e);
    }
    if (settle()) dirty = true;
    if (dirty) { identify(); odometer(); }
    if (now - ptr.seen > 4000) { gazeX = CX + Math.cos(now / 2300) * R * 0.5; gazeY = CY + Math.sin(now / 1700) * R * 0.4; }

    // love
    let nw = 0;
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i]; w.r = WAVE_V * (now - w.t0) / 1000; w.q = 1 - w.x * w.x - w.y * w.y;
      if (w.r > 2 * DLIM + 4 || w.q <= 1e-13) { carried.splice(carried.indexOf(w), 1); waves.splice(i, 1); }
    }
    nw = waves.length;

    // drawing
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const v = here.view, ar = v.ar, ai = v.ai, br = v.br, bi = v.bi, intro = calm ? 1e9 : now - born;
    let sung = 0;
    for (let j = 0; j < N; j++) {
      const px = PX[j], py = PY[j];
      const nr = ar * px - ai * py + br, ni = ar * py + ai * px + bi, dr = br * px + bi * py + ar, di = br * py - bi * px - ai, q = 1 / (dr * dr + di * di);
      const zx = (nr * dr + ni * di) * q, zy = (ni * dr - nr * di) * q, sc = 1 - zx * zx - zy * zy;
      const s = T[j];
      let k = 1, loved = false;
      if (intro < 3200) { const e = (intro - 250 - PD[j] * 210) / 520; if (e <= 0) { SR[j] = 0; continue; } if (e < 1) k = 1 + (e - 1) * (e - 1) * (e - 1) * (1 + 2.2 * e); } // (a small overshoot as each one arrives)
      for (let i = 0; i < nw; i++) {
        const w = waves[i], dx = px - w.x, dy = py - w.y, d = Math.acosh(1 + 2 * (dx * dx + dy * dy) / (PQ[j] * w.q)), a = w.r - d;
        if (a > 0 && a < WAVE_W) { loved = true; k *= 1 + 0.16 * Math.sin(Math.PI * a / WAVE_W); }
        if (d < w.r && d >= w.prev && d > 0.1 && sung < 4 && HR0 * sc * R > 6) { sung++; sing(s.note, Math.min(0.2, 0.05 + HR0 * sc * R / 500)); }
      }
      const hr = HR0 * sc * R * k * s.sz, X = CX + zx * R, Y = CY + zy * R;
      SX[j] = X; SY[j] = Y + hr * 0.2; SR[j] = hr;
      if (hr < 1.1) { ctx.fillStyle = s.color; const d = Math.max(1, hr * 2.2); ctx.fillRect(X - d / 2, Y - d / 2, d, d); }
      else if (hr < 3.5) { ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(X, Y + hr * 0.3, hr * 1.2, 0, TAU); ctx.fill(); }
      else face(s, zx, zy, k, hr, now, loved);
    }
    for (let i = 0; i < nw; i++) waves[i].prev = waves[i].r;

    // small things gleam in the corners
    for (let i = 0; i < corners.length; i++) {
      const c = corners[i], a = c.t[0], b = c.t[1], d = c.t[2];
      if (a >= N || b >= N || d >= N) continue;
      const h = (T[a].seed ^ T[b].seed ^ T[d].seed) >>> 0;
      if (h % 5 > 1) continue;
      const z = apply(v, c.x, c.y), sc = 1 - z[0] * z[0] - z[1] * z[1], size = 0.034 * sc * R;
      if (size < 1.6) continue;
      if (intro < 3600 && intro < 900 + c.t.reduce((m, t) => Math.max(m, PD[t]), 0) * 210) continue;
      const tw = 0.62 + 0.38 * Math.sin(now / 640 + (h % 628) / 100), X = CX + z[0] * R, Y = CY + z[1] * R;
      if ((h >>> 8) % 3 === 0) { heartPath(X, Y, size * 0.5 * tw); ctx.fillStyle = '#ff5fae'; ctx.fill(); }
      else { gleam(X, Y, size * tw); ctx.fillStyle = GOLD; ctx.fill(); }
    }

    // the wobbly edge of time
    const t = now / 1000;
    for (const [lw, al, out] of [[7, 0.16, 1.012], [2, 0.95, 1.006]]) {
      ctx.beginPath();
      for (let i = 0; i <= 96; i++) {
        const a = i / 96 * TAU, rr = R * (out + 0.0042 * (Math.sin(3 * a + t * 0.9) + Math.sin(5 * a - t * 1.3) + 0.6 * Math.sin(9 * a + t * 0.6)));
        ctx.lineTo(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.globalAlpha = al; ctx.strokeStyle = GOLD; ctx.lineWidth = lw; ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // which way the beginning is
    compass = null;
    if (!home.at) {
      const s = apply(v, home.x, home.y), m = Math.hypot(s[0], s[1]);
      if (m > 0.93) {
        compass = { x: CX + s[0] / m * (R + 13), y: CY + s[1] / m * (R + 13) };
        mini(compass.x, compass.y - 2, 22 + 1.5 * Math.sin(now / 300), BLUE);
      }
    }

    // the one who is talking
    if (talk) {
      const s = apply(v, talk.x, talk.y), m2 = s[0] * s[0] + s[1] * s[1];
      if (now > talk.until || m2 > 0.72) hideBubble();
      else {
        const hr = HR0 * (1 - m2) * R * talk.s.sz;
        const bx = Math.max(bubble.offsetWidth / 2 + 6, Math.min(W - bubble.offsetWidth / 2 - 6, CX + s[0] * R));
        const by = Math.max(bubble.offsetHeight + 12, CY + s[1] * R - hr * 1.75 - 12);
        bubble.style.transform = `translate(${bx}px, ${by}px) translate(-50%, -100%)`;
      }
    }
    counting(now);
    words(now);
  }

  // ------------------------------------------------------------------ the little buttons
  const snd = $('snd'), what = $('what'), about = $('about');
  const sndLabel = () => { snd.textContent = soundOn ? 'sound on' : 'sound off'; snd.setAttribute('aria-pressed', String(soundOn)); };
  snd.addEventListener('click', () => { soundOn = !soundOn; store.set('gleamingfold-sound', soundOn ? 'on' : 'off'); sndLabel(); if (soundOn) sing(0, 0.25); else if (AC) AC.suspend(); });
  sndLabel();
  const openAbout = (open) => {
    about.hidden = !open; what.setAttribute('aria-expanded', String(open));
    const n = Object.keys(met).length;
    $('met').textContent = n ? 'you have said hi to ' + n.toLocaleString('en-US') + (n === 1 ? ' scorsby' : ' scorsbys') + ' so far. (only this device knows.)' : '';
    $('met').hidden = !n;
  };
  what.addEventListener('click', () => openAbout(about.hidden));
  about.querySelector('.x').addEventListener('click', () => openAbout(false));
  bubble.addEventListener('pointerenter', () => { if (talk) talk.until = performance.now() + 9000; });

  // ------------------------------------------------------------------ arriving
  window.addEventListener('resize', resize);
  resize();
  const way = (location.hash.split('.').pop() || '').match(/^[0-6]{1,30000}$/);
  if (way) {
    for (const ch of way[0]) { reroot(+ch); here.view = mob(1, 0, 0, 0); }
    identify();
    whisper('someone wanted you to meet ' + nameOf(T[0]) + '.', 6000);
    setTimeout(() => { if (!talk && T[0]) showBubble(0, T[0], LINES[T[0].line], ''); }, 2600);
    farthest = 1e9; // (no milestones on the way in: you were carried)
  } else {
    identify();
    whisper('you are now entering the gleamingfold. proceed with softness.', 5200);
    whisper('drag to wander. tap someone to say hi.', 6000);
  }
  odometer();
  requestAnimationFrame(frame);
})();
