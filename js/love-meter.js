// the love meter: a heart monitor for the whole world, at the top of the love page. it isn't explained.
// the heart beats faster while more of the world is awake (worked out from the clock and roughly where
// people live), the number is everyone loving right now (the sleepers count a little, they dream), and
// when someone shares love on the planet it comes through as pink hearts and a +n.
// every pixel is a real, chunky pixel: it's all drawn small on a canvas and blown up with no smoothing.
// and it's a little silly: some beats are hearts, the monitor raises alarms about grandmas waving, the
// units change their mind, now and then the line says hi or dances, a tiny scorsby walks along it, and
// in the world's quietest hour the line sometimes smiles.
(function () {
  const box = document.getElementById('love-meter');
  if (!box) return;

  // ---- the world ----
  // roughly how many people live at each utc offset, in millions
  const PEOPLE = [[-10, 2], [-9, 1], [-8, 55], [-7, 30], [-6, 160], [-5, 250], [-4, 90], [-3, 300], [-1, 1], [0, 330],
    [1, 600], [2, 400], [3, 500], [3.5, 90], [4, 50], [4.5, 40], [5, 290], [5.5, 1440], [5.75, 30], [6, 190], [6.5, 55],
    [7, 470], [8, 1700], [9, 200], [9.5, 2], [10, 30], [11, 5], [12, 6], [13, 1]];
  const ALL = PEOPLE.reduce((s, [, p]) => s + p, 0), WORLD = 8.2e9;
  const awake = (h) => Math.min(1, Math.max(0.05, 0.5 + 0.6 * Math.cos(((h - 15) / 24) * 2 * Math.PI)));
  function worldAt(ms) {
    const utc = ms / 3.6e6 % 24;
    let up = 0;
    for (const [off, p] of PEOPLE) up += p * awake((utc + off + 24) % 24);
    up /= ALL; // the share of the world that's awake
    return { up, loving: WORLD * (0.25 + 0.75 * up) };
  }
  // the sleepiest the world gets in a day (its quietest hour is when the line might smile)
  const DAY_MIN = (() => { let m = 1; const t = Date.now(); for (let i = 0; i < 144; i++) m = Math.min(m, worldAt(t + i * 6e5).up); return m; })();

  // ---- the silliness ----
  const ALARMS = ['love levels elevated', '4 grandmas waving', 'someone sat under a tree', 'dog very happy (ohio)',
    'cat on a lap in finland', 'surplus of sweetness', 'a stranger smiled back', '12 dandelions wished on',
    'too many hugs to count', 'glimbo detected', 'love overflow. its ok', 'somebodys mom called',
    'birds singing in sync', 'tea made for someone', 'check for butterflies', 'moon looked at fondly',
    'a baby laughed at a sock', 'heart grew 3 sizes', 'forehead kiss in peru', 'two old friends met up',
    'casserole delivered', 'note left in a lunchbox', 'love still rising', 'nothing wrong. just love'];
  const UNITS = ['hearts', 'hugs/sec', 'warm fuzzies', 'smooches', 'glimbos', 'heartbeats', 'sweethearts', 'butterflies', 'cuddles'];

  // ---- a tiny 3x5 font, and little pictures ('#' is lit) ----
  const FONT = {
    0: '###/#.#/#.#/#.#/###', 1: '.#./##./.#./.#./###', 2: '###/..#/###/#../###', 3: '###/..#/.##/..#/###', 4: '#.#/#.#/###/..#/..#',
    5: '###/#../###/..#/###', 6: '###/#../###/#.#/###', 7: '###/..#/.#./.#./.#.', 8: '###/#.#/###/#.#/###', 9: '###/#.#/###/..#/###',
    a: '.#./#.#/###/#.#/#.#', b: '##./#.#/##./#.#/##.', c: '.##/#../#../#../.##', d: '##./#.#/#.#/#.#/##.', e: '###/#../##./#../###',
    f: '###/#../##./#../#..', g: '.##/#../#.#/#.#/.##', h: '#.#/#.#/###/#.#/#.#', i: '###/.#./.#./.#./###', j: '..#/..#/..#/#.#/.#.',
    k: '#.#/#.#/##./#.#/#.#', l: '#../#../#../#../###', m: '#.#/###/###/#.#/#.#', n: '##./#.#/#.#/#.#/#.#', o: '.#./#.#/#.#/#.#/.#.',
    p: '##./#.#/##./#../#..', q: '.#./#.#/#.#/##./.##', r: '##./#.#/##./#.#/#.#', s: '.##/#../.#./..#/##.', t: '###/.#./.#./.#./.#.',
    u: '#.#/#.#/#.#/#.#/###', v: '#.#/#.#/#.#/#.#/.#.', w: '#.#/#.#/###/###/#.#', x: '#.#/#.#/.#./#.#/#.#', y: '#.#/#.#/.#./.#./.#.',
    z: '###/..#/.#./#../###', ' ': '../../../../..', '!': '#/#/#/./#', '.': './././././#'.slice(2), ',': '../../../.#/#.',
    '+': '.../.#./###/.#./...', '-': '.../.../###/.../...', '/': '..#/..#/.#./#../#..', '?': '##./..#/.#./.../.#.',
    '(': '.#/#./#./#./.#', ')': '#./.#/.#/.#/#.',
  };
  const pic = (s) => s.split('/');
  const HEART_S = pic('.##.##./#######/#######/.#####./..###../...#...');
  const HEART_L = pic('.###.###./#########/#########/#########/.#######./..#####../...###.../....#....');
  // the beat that's a heart: its point sits on the line
  const HEART_BEAT = pic('...##...##.../..#..#.#..#../.#....#....#./#...........#/#...........#/#...........#/' +
    '.#.........#./..#.......#../...#.....#.../....#...#..../.....#.#...../......#......');
  // the beat that says hi, joined up, sitting on the line
  const HI = pic('....##........./...#..#.....#../...#..#......../...#.#........./...##........../' +
    '..##.###...#.../.#.#....#..#.../#..#....#..#.../#..#.....##.###');
  // a tiny scorsby (B blue, W white, K black, R red nose), and its two steps
  const BEAR = pic('.BB...BB./BBBBBBBBB/BWWBBBWWB/BWKBBBWKB/BBBBRBBBB/BKBBBBBKB/BBKKKKKBB/.BBBBBBB.');
  const STEPS = ['..B...B..', '...B.B...'];
  // (every colour here is one of the amstrad cpc's 27)
  const BEAR_INK = { B: '#00B4FF', W: '#FFFFFF', K: '#000000', R: '#FF0000' };
  const PINK_INK = { B: '#FF80FF', W: '#FFFFFF', K: '#000000', R: '#FF0000' };
  // a loop-de-loop the line ties in itself
  // infinity, which the line runs into on the left and out of on the right (its middle row sits on the line)
  const INFINITY = pic('..###.....###../.#...#...#...#./#.....#.#.....#/#......#......#/#.....#.#.....#/.#...#...#...#./..###.....###..');
  const LOOP = pic('.....###.../....#...#../...#.....#./...#.....#./....#...#../.....#.#.../......#..../.....#.#.../#####...###');

  // two screens: day (white, like the site, and the one you get first) and night (the glowing green one)
  const THEMES = {
    // (GREEN is scorsby blue now, the colour of the site's top bar; the name stayed)
    day: { GREEN: '#00B4FF', DIM: '#8080A0', BRIGHT: '#0088CC', PINK: '#FF40B0', AMBER: '#FF4000', BG: '#FFFFFF', DOTS: '#DCDCE8' },
    // (night's line is a rainbow, in bands that drift slowly along with it)
    night: { RAINBOW: true, GREEN: '#00B4FF', DIM: '#0070A8', BRIGHT: '#A8E6FF', PINK: '#FF80FF', AMBER: '#FFFFFF', BG: '#000000', DOTS: '#000080' },
  };
  let GREEN, DIM, BRIGHT, PINK, AMBER, BG, DOTS, THEME;
  function theme(name) {
    THEME = THEMES[name] ? name : 'day';
    ({ GREEN, DIM, BRIGHT, PINK, AMBER, BG, DOTS } = THEMES[THEME]);
    box.style.background = BG;
  }
  let saved = null;
  try { saved = localStorage.getItem('love-meter-theme'); } catch {}
  theme(saved || 'day');
  // framed like the site's buttons: a thin dark line, barely rounded corners, a hard little shadow
  const css = document.createElement('style');
  css.textContent = `
#love-meter { max-width: 760px; box-sizing: border-box; margin: 56px auto 0; border: 1px solid #05060a; border-radius: 3px; box-shadow: 3px 3px 0 #05060a;
  line-height: 0; user-select: none; overflow: hidden; }
#love-meter canvas { display: block; image-rendering: pixelated; image-rendering: crisp-edges; }`;
  document.head.appendChild(css);
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', 'a heart monitor for the love in the world');
  const cv = document.createElement('canvas');
  box.appendChild(cv);
  const cx = cv.getContext('2d');

  const H = 40, BASE = 30, K = 18, TX = 2, RW = 50, GAP = 8;
  let W = 0, TW = 0, SPEED = 40, ys = new Float32Array(0), pinks = new Uint8Array(0), hidden = new Uint8Array(0), head = 0, stamps = [];

  function px(x, y, w = 1, h = 1) { cx.fillRect(x, y, w, h); }
  function sprite(rows, x, y, ink) {
    for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) {
      const ch = rows[r][c];
      if (ch === '.') continue;
      cx.fillStyle = typeof ink === 'string' ? ink : ink[ch];
      px(x + c, y + r);
    }
  }
  // (each letter is unpacked once and kept, not every time it's drawn)
  const GLYPHS = {};
  const glyph = (ch) => GLYPHS[ch] || (GLYPHS[ch] = pic(FONT[ch] || FONT['?']));
  const textW = (s, k = 1) => [...s].reduce((n, ch) => n + (glyph(ch)[0].length + 1) * k, -k);
  function text(s, x, y, ink, k = 1) {
    cx.fillStyle = ink;
    for (const ch of s) {
      const g = glyph(ch);
      for (let r = 0; r < 5; r++) for (let c = 0; c < g[r].length; c++) if (g[r][c] === '#') px(x + c * k, y + r * k, k, k);
      x += (g[0].length + 1) * k;
    }
  }

  // ---- the heartbeat ----
  const gs = (t, c, w) => Math.exp(-((t - c) * (t - c)) / (2 * w * w));
  function shape(kind, t) {
    const p = 0.12 * gs(t, 0.1, 0.025), tw = 0.3 * gs(t, 0.45, 0.05);
    if (kind === 'heart' || kind === 'xo') return p + tw;
    if (kind === 'hi' || kind === 'loop' || kind === 'infinity') return 0;
    // up to infinity (off the top), back from minus infinity (off the bottom), and home again
    if (kind === 'asymptote') {
      if (t <= 0.15 || t >= 0.65) return 0;
      const y = 0.035 / (0.4 - t) * Math.sin(Math.PI * (t - 0.15) / 0.5);
      return Math.max(-2.6, Math.min(2.6, y));
    }
    if (kind === 'boing') return t > 0.1 && t < 0.8 ? 0.65 * Math.exp(-4 * (t - 0.1)) * Math.abs(Math.sin(Math.PI * 5 * (t - 0.1) / 0.7)) : 0;
    if (kind === 'sine') return t > 0.05 && t < 0.95 ? 0.32 * Math.sin(2 * Math.PI * 3 * (t - 0.05) / 0.9) : 0;
    if (kind === 'achoo') return 0.1 * gs(t, 0.12, 0.03) + 0.16 * gs(t, 0.2, 0.03) - 0.1 * gs(t, 0.27, 0.01) + 2.6 * gs(t, 0.3, 0.008);
    if (kind === 'hiccup') return 0.45 * (gs(t, 0.2, 0.012) + gs(t, 0.3, 0.012) + gs(t, 0.4, 0.012));
    if (kind === 'stairs') return t > 0.1 && t < 0.6 ? 0.12 * Math.ceil((t - 0.1) / 0.1) : 0;
    if (kind === 'dance') return t > 0.08 && t < 0.78 ? 0.32 * Math.sin((t - 0.08) * 2 * Math.PI * 7) * Math.sin((t - 0.08) / 0.7 * Math.PI) : 0;
    if (kind === 'smile') return t > 0.2 && t < 0.8 ? -0.3 * (1 - ((t - 0.5) / 0.3) ** 2) : 0;
    return p - 0.12 * gs(t, 0.2, 0.012) + gs(t, 0.225, 0.014) - 0.3 * gs(t, 0.25, 0.014) + tw;
  }

  let phase = 0.6, bpm = 70, amp = 1, pink = 0, kind = 'normal', pending = 0, w = worldAt(Date.now());
  // the jk: waits for the line to start again at the left, flatlines all the way across, then says jk at the end
  // (it says jk 80% of the way across, then stays flat a little past the jk, so no beat is drawn over it)
  let jkWaiting = false, flat = false, filling = false, jkEnd = null, lastSpecial = '', jkDone = -Infinity;
  // the wander: for a while the line forgets it's a heartbeat and goes wherever it likes, then ambles back home
  let wander = null;
  let loving = 0, thumpUntil = 0, thumpPink = false, extra = 0, todaySeen = null, plus = '', plusUntil = 0;
  function nextBeat() {
    w = worldAt(Date.now());
    // a calm, resting heart: about 60 while the world sleeps, never much past 70 when it's all awake
    bpm = Math.round(Math.min(72, Math.max(58, 60 + 10 * (w.up - 0.35) / 0.35)) + (Math.random() - 0.5) * 1.6);
    loving = Math.round(w.loving + extra + (Math.random() - 0.5) * 40000);
    const last = kind, r = Math.random(), quiet = w.up <= DAY_MIN + 0.03;
    amp = 1; pink = 0; kind = 'normal';
    if (flat || jkWaiting || wander) return; // (nothing else while a flatline or a wander is coming or going on)
    if (pending > 0) { pending--; pink = 1; kind = 'heart'; } // love from the planet comes in as pink hearts
    else if (last === 'normal') {
      if (r < (quiet ? 0.2 : 0.012)) kind = 'smile';
      else if (r < 0.11) kind = 'heart';
      else if (r < 0.14) kind = 'dance';
      else if (r < 0.165) kind = 'hi';
      else if (r < 0.19) kind = 'loop';
      else if (r < 0.21) kind = 'xo';
      else if (r < 0.24) kind = 'hiccup';
      else if (r < 0.265) kind = 'stairs';
      else if (r < 0.285) kind = 'asymptote';
      else if (r < 0.3) kind = 'infinity';
      else if (r < 0.32) kind = 'boing';
      else if (r < 0.335) { if (!filling && lastSpecial !== 'jk' && performance.now() - jkDone > 30000) jkWaiting = true; } // (never two jks in a row, nor close together)
      else if (r < 0.35) kind = 'achoo';
      else if (r < 0.37) kind = 'sine';
      else if (r < 0.38 && !filling) wander = { left: 0, total: Math.round(TW * (0.5 + Math.random() * 0.5)), y: 0, v: 0 };
    }
    // remember the last special one (so a jk can't follow a jk)
    if (jkWaiting) lastSpecial = 'jk';
    else if (wander) lastSpecial = 'wander';
    else if (kind !== 'normal') lastSpecial = kind;
  }
  // a little picture drawn into the line; hide: the line itself goes quiet underneath, so the picture is the line
  function stamp(rows, lift = 0, hide = false) { stamps.push({ rows, x: (head + 1) % TW, age: 0, lift, pink, hide }); }
  const words = (s) => [0, 1, 2, 3, 4].map((r) => [...s].map((ch) => glyph(ch)[r]).join('.'));
  const cpb = () => SPEED * 60 / bpm; // columns per beat
  function eyes() { const g = Math.max(4, Math.round(cpb() * 0.28)); const row = '#' + '.'.repeat(g) + '#'; return [row, row]; }

  // write n more columns of trace (quiet: no thumps, for filling the screen at the start)
  function write(n, quiet) {
    for (let i = 0; i < n; i++) {
      let before = phase;
      phase += bpm / 60 / SPEED;
      if (phase >= 1) { phase -= 1; before = 0; nextBeat(); }
      const at = (c) => before < c && phase >= c;
      if (!quiet && !flat && !wander && at(0.225)) { thumpUntil = performance.now() + 130; thumpPink = !!pink; }
      if (kind === 'heart' && at(0.12)) stamp(HEART_BEAT);
      if (kind === 'hi' && at(0.1)) stamp(HI, 0, true);
      if (kind === 'loop' && at(0.15)) stamp(LOOP, 0, true);
      if (kind === 'xo' && at(0.22)) stamp(words('xo'), 3);
      if (kind === 'infinity' && at(0.15)) stamp(INFINITY, -3, true);
      // the asymptote itself: a dashed line top to bottom, like in a maths book
      if (kind === 'asymptote' && at(0.4)) stamp(Array.from({ length: H - 7 }, (_, i) => (i % 3 === 2 ? '.' : '#')), BASE - H + 1);
      if (kind === 'smile' && at(0.36)) stamp(eyes(), 6);
      // the strongest point in this column, so thin spikes never fall between pixels
      let v = 0;
      for (let s = 1; s <= 4; s++) { const y = shape(kind, before + (phase - before) * s / 4); if (Math.abs(y) > Math.abs(v)) v = y; }
      head = (head + 1) % TW;
      if (jkWaiting && head === 0) { jkWaiting = false; flat = true; jkEnd = null; }
      if (flat && jkEnd === null && head === Math.round(TW * 0.8)) { stamp(words('jk'), 3); jkEnd = Math.min(TW - 1, head + 13); }
      // and then a fresh beat straight away, so the heart comes back up just after the jk
      if (flat && jkEnd !== null && head >= jkEnd) { flat = false; jkEnd = null; jkDone = performance.now(); phase = 0.05; kind = 'normal'; pink = 0; amp = 1; }
      if (wander) {
        // a wobbly drift with a bit of momentum, kept on the screen; for its last stretch it heads home to the line
        const wd = wander;
        wd.v = (wd.v + (Math.random() - 0.5) * 0.012) * 0.985;
        wd.y += wd.v;
        if (wd.y > 1.05 || wd.y < -0.4) { wd.y = Math.max(-0.4, Math.min(1.05, wd.y)); wd.v *= -0.6; }
        if (++wd.left > wd.total * 0.7) { wd.y *= 0.94; wd.v *= 0.9; }
        if ((wd.left >= wd.total && Math.abs(wd.y) < 0.02) || wd.left > wd.total * 1.5) wander = null;
        v = wd.y; amp = 1;
      }
      ys[head] = flat ? 0 : v * amp;
      pinks[head] = pink;
      hidden[head] = 0;
      for (const s of stamps) { s.age++; if (s.hide && s.age <= s.rows[0].length) hidden[head] = 1; }
    }
    if (stamps.length) stamps = stamps.filter((s) => s.age - s.rows[0].length < TW - GAP);
  }

  // ---- the size: whole device pixels only, so every pixel is the same size ----
  let dpr = 1, dev = 3;
  function size() {
    dpr = window.devicePixelRatio || 1;
    const cw = box.clientWidth;
    dev = Math.max(1, Math.round((cw >= 480 ? 2 : 1.5) * dpr)); // how many device pixels one of ours is
    const w = Math.floor(cw * dpr / dev);
    if (w === W) return;
    W = w; TW = Math.max(20, W - RW - TX - 6);
    cv.width = W; cv.height = H;
    cv.style.width = (W * dev / dpr) + 'px'; cv.style.height = (H * dev / dpr) + 'px';
    SPEED = 115 * dpr / dev; // about 115 screen pixels a second, however big ours are
    ys = new Float32Array(TW); pinks = new Uint8Array(TW); hidden = new Uint8Array(TW); head = 0; stamps = []; walkers = []; hearts = [];
    backdrop();
    if (started) fill();
  }
  function fill() { filling = true; write(TW, true); filling = false; } // the screen starts full, as if it had been beating all along

  // the plain screen and its grid of dots, drawn once (per size and per screen) and then just copied in
  const bg = document.createElement('canvas'), bgx = bg.getContext('2d');
  function backdrop() {
    if (!W) return;
    bg.width = W; bg.height = H;
    bgx.fillStyle = BG; bgx.fillRect(0, 0, W, H);
    bgx.fillStyle = DOTS;
    for (let x = TX + 2; x < TX + TW; x += 6) for (let y = 3; y < H; y += 6) bgx.fillRect(x, y, 1, 1);
  }

  // ---- alarms, units, and little walkers ----
  // sometimes one blue scorsby strolls across. more often two come from either side, a blue one and a pink one:
  // both hop the gap where the line is being rewritten, they meet in the middle,
  // smooch (hearts float up), and then the pink one hops over the blue one and they both go on their way.
  // alarms type themselves out, a letter at a time, with a block cursor after them (it says ready first, of course)
  // (an alarm's ink is a name, so it changes with the screen)
  let alarm = { text: 'ready', ink: 'AMBER', t0: performance.now() + 400, until: performance.now() + 5000 };
  let nextAlarm = performance.now() + 9000 + Math.random() * 12000;
  let walkers = [], hearts = [], smooch = null, nextWalk = performance.now() + 12000 + Math.random() * 14000;
  const WALK = 13; // columns a second
  const inGap = (c) => { if (c < 0 || c >= TW) return false; const a = (c - head + TW) % TW; return a > 0 && a <= GAP; };
  const ground = (wk) => { const col = Math.min(TW - 1, Math.max(0, Math.floor(wk.x) + 4)); return Math.max(8, Math.min(BASE - 9, Math.round(BASE - ys[col] * K) - 9)); };
  function hop(wk, now, dur, h) { wk.hop = { t0: now, dur, h }; }
  const fit = (s) => { while (s.length > 3 && textW(s) > TW - 2) s = s.slice(0, -1); return s; };
  function raise(msg, ink, ms) { const t = performance.now(); alarm = { text: fit('! ' + msg), ink, t0: t, until: t + ms }; }

  function tick(now, dt) {
    if (now > nextAlarm && !alarm) { raise(ALARMS[Math.floor(Math.random() * ALARMS.length)], 'AMBER', 7000); nextAlarm = now + 25000 + Math.random() * 35000; }
    if (alarm && now > alarm.until) alarm = null;
    if (!walkers.length && now > nextWalk) {
      walkers.push({ x: -9, y: BASE - 9, dir: 1, ink: BEAR_INK });
      if (Math.random() < 0.65) walkers.push({ x: TW, y: BASE - 9, dir: -1, ink: PINK_INK });
      smooch = null;
    }
    const [a, b] = walkers;
    // nose to nose: stop and smooch
    if (b && !smooch && b.x - (a.x + 9) <= 0) {
      smooch = { until: now + 2600 };
      const mx = Math.round((a.x + b.x + 9) / 2) - 3;
      hearts.push({ x: mx, y: Math.round(Math.min(a.y, b.y)) - 4, t0: now }, { x: mx + 1, y: Math.round(Math.min(a.y, b.y)) - 4, t0: now + 800 });
      raise('smooch detected', 'PINK', 3200);
    }
    const kissing = smooch && now < smooch.until;
    if (smooch && !kissing && !smooch.over) { smooch.over = true; hop(b, now, 1.1, 12); } // then over the top and on
    for (const wk of walkers) {
      if (!kissing) wk.x += WALK * dt * wk.dir;
      if (!wk.hop) for (let c = Math.floor(wk.x) - 6; c <= Math.floor(wk.x) + 10; c++) if (inGap(c)) { hop(wk, now, 0.45, 6); break; }
      wk.y += (ground(wk) - wk.y) * Math.min(1, dt * 14);
      wk.lift = 0;
      if (wk.hop) {
        const p = (now - wk.hop.t0) / 1000 / wk.hop.dur;
        if (p >= 1) wk.hop = null;
        else wk.lift = Math.round(Math.sin(Math.PI * p) * wk.hop.h);
      }
    }
    hearts = hearts.filter((h) => now - h.t0 < 1900);
    walkers = walkers.filter((wk) => wk.dir > 0 ? wk.x < TW : wk.x > -9);
    if (!walkers.length && (a || b)) nextWalk = now + 50000 + Math.random() * 70000;
  }

  // the line's colour at column x: the theme's colour, or a band of the rainbow (twelve bands, drifting the same
  // way the line is written)
  const BANDS = Array.from({ length: 12 }, (_, i) => `hsl(${i * 30}, 100%, 56%)`);
  function lineInk(x, now) {
    if (!THEMES[THEME].RAINBOW) return GREEN;
    return BANDS[Math.floor(((x / 14 - now / 900) % 12 + 12) % 12)];
  }

  function draw(now) {
    cx.drawImage(bg, 0, 0);
    // the trace: each column joined to the one before it with a straight up-and-down run, like old screens did
    let prev = null;
    for (let x = 0; x < TW; x++) {
      const ahead = (x - head + TW) % TW;
      if ((ahead > 0 && ahead <= GAP) || hidden[x]) { prev = null; continue; }
      const y = Math.round(BASE - ys[x] * K);
      if (prev !== null && Math.abs(y - prev) > H) prev = null; // (infinity to minus infinity isn't joined up)
      const top = prev === null ? y : Math.min(prev, y), bot = prev === null ? y : Math.max(prev, y);
      cx.fillStyle = pinks[x] ? PINK : lineInk(x, now);
      px(TX + x, top, 1, bot - top + 1);
      prev = y;
    }
    // hearts, his and eyes, drawn in as the line reaches them
    for (const s of stamps) {
      const top = BASE - s.lift - (s.rows.length - 1);
      for (let c = 0; c < s.rows[0].length && c < s.age; c++) {
        const x = (s.x + c) % TW, ahead = (x - head + TW) % TW;
        if (ahead > 0 && ahead <= GAP) continue;
        cx.fillStyle = s.pink ? PINK : lineInk(x, now);
        for (let r = 0; r < s.rows.length; r++) if (s.rows[r][c] === '#') px(TX + x, top + r);
      }
    }
    // the bright point writing it
    cx.fillStyle = BRIGHT;
    px(TX + head, Math.round(BASE - ys[head] * K) - 1, 2, 2);
    // the walkers stay on the screen part (they come and go behind its edges)
    cx.save(); cx.beginPath(); cx.rect(TX, 0, TW, H); cx.clip();
    const still_ = smooch && now < smooch.until;
    for (const wk of walkers) {
      const x = TX + Math.round(wk.x), y = Math.max(0, Math.round(wk.y) - (wk.lift || 0));
      sprite(BEAR, x, y, wk.ink);
      sprite([STEPS[still_ || wk.hop ? 0 : Math.floor(now / 180) % 2]], x, y + 8, wk.ink);
    }
    for (const h of hearts) {
      const t = now - h.t0;
      if (t < 0 || (t > 1500 && t % 200 < 100)) continue;
      sprite(HEART_S, TX + h.x, Math.max(7, h.y - Math.floor(t / 280)), PINK);
    }
    cx.restore();
    if (alarm && now >= alarm.t0) {
      const shown = alarm.text.slice(0, Math.floor((now - alarm.t0) / 55) + 1);
      const ink = THEMES[THEME][alarm.ink];
      text(shown, TX + 1, 1, ink);
      if (now % 1000 < 600) { cx.fillStyle = ink; px(TX + 1 + textW(shown) + 2, 1, 3, 5); }
    }

    // the readout
    const R = W - 3, b = flat ? '--' : wander ? '??' : String(bpm), bw = textW(b, 2);
    text(b, R - bw, 6, GREEN, 2);
    const big = now < thumpUntil, hs = big ? HEART_L : HEART_S;
    sprite(hs, R - bw - 3 - hs[0].length, big ? 7 : 8, big && thumpPink ? PINK : GREEN);
    const n = loving.toLocaleString('en-US');
    text(n, R - textW(n), 22, GREEN);
    const u = now < plusUntil ? plus : UNITS[Math.floor(Date.now() / 10000) % UNITS.length];
    text(u, R - textW(u), 30, now < plusUntil ? PINK : DIM);
  }

  // ---- a tap switches between the day screen and the night screen (and it remembers) ----
  box.style.cursor = 'pointer';
  box.addEventListener('click', () => {
    theme(THEME === 'day' ? 'night' : 'day');
    backdrop();
    try { localStorage.setItem('love-meter-theme', THEME); } catch {}
    if (started) draw(performance.now());
  });

  // ---- go: the page first ----
  // the meter takes its space straight away (so nothing below it jumps), but it only wakes up once the page has
  // finished loading and the browser has a quiet moment, and it only runs while it's on screen. it draws at most
  // 30 times a second, which is plenty for chunky pixels.
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let started = false, ready = false, seen = false, running = false, last = 0, lastDraw = 0, carry = 0;
  new ResizeObserver(() => { size(); if (started) draw(performance.now()); }).observe(box);
  size();
  function frame(now) {
    if (!seen || !started) { running = false; return; }
    if (now - lastDraw >= 33) {
      const dt = Math.min(0.5, (now - last) / 1000); last = now; lastDraw = now;
      carry += dt * SPEED; const n = Math.floor(carry); carry -= n;
      write(n, false); tick(now, dt); draw(now);
    }
    requestAnimationFrame(frame);
  }
  function wake() {
    if (!ready || !seen) return;
    if (!started) {
      started = true; fill();
      // (its little routine counts from when it wakes: ready first, then the alarms and walkers in their time)
      const t = performance.now();
      alarm = { text: 'ready', ink: 'AMBER', t0: t + 400, until: t + 5000 };
      nextAlarm = t + 9000 + Math.random() * 12000;
      nextWalk = t + 12000 + Math.random() * 14000;
      listen(); setInterval(() => { if (!document.hidden && seen) listen(); }, 20000);
    }
    if (still) { draw(performance.now()); return; }
    if (!running) { running = true; last = lastDraw = performance.now(); requestAnimationFrame(frame); }
  }
  // (it starts a little before it scrolls into view, so it's already beating when you get there)
  new IntersectionObserver((es) => { seen = es[0].isIntersecting; wake(); }, { rootMargin: '200px 0px' }).observe(box);
  const idle = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 2000 }) : (f) => setTimeout(f, 300);
  const loaded = () => idle(() => { ready = true; wake(); });
  if (document.readyState === 'complete') loaded(); else window.addEventListener('load', loaded, { once: true });

  // ---- love shared on the planet, read from the hearth (never joined; just the day's count) ----
  const STATUS = typeof HEARTH_STATUS === 'string' ? HEARTH_STATUS
    : (['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://127.0.0.1:8787/status' : 'https://scorsby-hearth.samrobertsbaca.workers.dev/status');
  async function listen() {
    try {
      const st = await (await fetch(STATUS, { cache: 'no-store' })).json();
      if (st && typeof st.today === 'number') {
        if (todaySeen !== null && st.today > todaySeen) {
          const more = st.today - todaySeen;
          pending = Math.min(4, pending + Math.ceil(Math.log2(more + 1)));
          plus = '+' + more.toLocaleString('en-US') + ' love';
          plusUntil = performance.now() + 4000;
          if (!still) raise('incoming love', 'PINK', 4500);
        }
        todaySeen = st.today; extra = st.today;
      }
    } catch {}
  }
})();
