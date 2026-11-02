// Check if the screen is wider than a typical mobile device (e.g., 768px)
// and make sure it's not a touch-only device
const isMobile = window.matchMedia("(max-width: 768px)").matches ||
                 ('ontouchstart' in window);
const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Only start the effect if we aren't on mobile
if (!isMobile && !calm) rainbowCursor();

// the rainbow that follows the mouse: the same trail as the cursor-effects library's, but it draws only while it's
// moving, so a resting mouse costs nothing
function rainbowCursor() {
  const COLORS = ["#FE0000", "#FD8C00", "#FFE500", "#119F0B", "#0644B3", "#C22EDC"];
  const LENGTH = 20, SIZE = 3;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.id = "active-cursor-layer";
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    zIndex: '999999',
    pointerEvents: 'none',
    display: 'block'
  });
  document.body.appendChild(canvas);
  const fit = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  fit();

  const mouse = { x: 0, y: 0 };
  let trail = [], running = false;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.lineWidth = SIZE;
    let x = mouse.x, y = mouse.y, moved = false;
    trail.forEach((p, i) => {
      const next = trail[i + 1] || trail[0];
      if (Math.abs(p.x - x) + Math.abs(p.y - y) > .5) moved = true;
      p.x = x; p.y = y;
      x += .4 * (next.x - p.x);
      y += .4 * (next.y - p.y);
    });
    COLORS.forEach((color, i) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.moveTo(trail[0].x, trail[0].y + i * (SIZE - 1));
      trail.forEach((p, k) => { if (k) ctx.lineTo(p.x, p.y + i * SIZE); });
      ctx.stroke();
    });
    if (moved) requestAnimationFrame(draw);
    else running = false;
  }

  function wake() {
    if (trail.length && !running) { running = true; requestAnimationFrame(draw); }
  }
  document.body.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (!trail.length) trail = Array.from({ length: LENGTH }, () => ({ x: mouse.x, y: mouse.y }));
    wake();
  });
  window.addEventListener('resize', () => { fit(); wake(); });
}


import renderMathInElement from 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.mjs';

// This will scan the entire body for LaTeX delimiters
renderMathInElement(document.body, {
    delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
    ],
    throwOnError : false
});
