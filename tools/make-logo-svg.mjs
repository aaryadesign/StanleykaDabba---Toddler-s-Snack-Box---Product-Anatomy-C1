// Regenerates logo.svg from the same canvas code the app uses (src/brand.js).
// The mark is recorded through a tiny canvas-to-SVG shim; the wordmark is
// written as live text in Fredoka. Run: node snack-box/tools/make-logo-svg.mjs
import { writeFileSync } from 'node:fs';
import { drawMark, LOGO_W, LOGO_H } from '../src/brand.js';

function svgCtx() {
  const out = [];
  let m = [1, 0, 0, 1, 0, 0];
  const stack = [];
  let path = [];
  let cur = [0, 0];
  const st = { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1, lineCap: 'butt', lineJoin: 'miter' };
  const T = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const scale = () => Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
  const mul = (a, b, c, d, e, f) => {
    m = [m[0] * a + m[2] * b, m[1] * a + m[3] * b, m[0] * c + m[2] * d, m[1] * c + m[3] * d, m[0] * e + m[2] * f + m[4], m[1] * e + m[3] * f + m[5]];
  };
  const pt = (x, y) => { const p = T(x, y); path.push(p); cur = [x, y]; };
  const sub = () => { if (path.length) path.push(null); };
  const d = () => {
    let s = '';
    let start = true;
    for (const p of path) {
      if (p === null) { s += 'Z'; start = true; continue; }
      s += `${start ? 'M' : 'L'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
      start = false;
    }
    return s;
  };
  const alpha = () => (ctx.globalAlpha < 1 ? ` opacity="${ctx.globalAlpha}"` : '');
  const ctx = {
    ...st,
    save() { stack.push({ m: [...m], st: { ...st, fillStyle: ctx.fillStyle, strokeStyle: ctx.strokeStyle, lineWidth: ctx.lineWidth, globalAlpha: ctx.globalAlpha } }); },
    restore() { const s = stack.pop(); m = s.m; Object.assign(ctx, s.st); },
    translate(x, y) { mul(1, 0, 0, 1, x, y); },
    rotate(a) { mul(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0); },
    scale(x, y) { mul(x, 0, 0, y, 0, 0); },
    beginPath() { path = []; },
    moveTo(x, y) { sub(); pt(x, y); },
    lineTo(x, y) { pt(x, y); },
    closePath() { path.push(null); },
    arc(x, y, r, a0, a1, ccw) { this.ellipse(x, y, r, r, 0, a0, a1, ccw); },
    ellipse(x, y, rx, ry, rot, a0, a1, ccw) {
      let sweep = a1 - a0;
      if (!ccw && sweep < 0) sweep += Math.PI * 2;
      if (ccw && sweep > 0) sweep -= Math.PI * 2;
      if (Math.abs(a1 - a0) >= Math.PI * 2) sweep = ccw ? -Math.PI * 2 : Math.PI * 2;
      const n = Math.max(12, Math.ceil(Math.abs(sweep) * 16));
      for (let i = 0; i <= n; i++) {
        const a = a0 + (sweep * i) / n;
        const ex = rx * Math.cos(a);
        const ey = ry * Math.sin(a);
        pt(x + ex * Math.cos(rot) - ey * Math.sin(rot), y + ex * Math.sin(rot) + ey * Math.cos(rot));
      }
    },
    quadraticCurveTo(cx, cy, x, y) {
      const [x0, y0] = cur;
      for (let i = 1; i <= 16; i++) { const t = i / 16; const u = 1 - t; pt(u * u * x0 + 2 * u * t * cx + t * t * x, u * u * y0 + 2 * u * t * cy + t * t * y); }
    },
    bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
      const [x0, y0] = cur;
      for (let i = 1; i <= 20; i++) {
        const t = i / 20; const u = 1 - t;
        pt(u ** 3 * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t ** 3 * x, u ** 3 * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t ** 3 * y);
      }
    },
    roundRect(x, y, w, h, r) {
      sub();
      this.ellipse(x + w - r, y + r, r, r, 0, -Math.PI / 2, 0);
      this.ellipse(x + w - r, y + h - r, r, r, 0, 0, Math.PI / 2);
      this.ellipse(x + r, y + h - r, r, r, 0, Math.PI / 2, Math.PI);
      this.ellipse(x + r, y + r, r, r, 0, Math.PI, Math.PI * 1.5);
      path.push(null);
    },
    fill() { out.push(`<path d="${d()}" fill="${ctx.fillStyle}"${alpha()}/>`); },
    stroke() {
      out.push(`<path d="${d()}" fill="none" stroke="${ctx.strokeStyle}" stroke-width="${(ctx.lineWidth * scale()).toFixed(2)}" stroke-linecap="${ctx.lineCap}" stroke-linejoin="${ctx.lineJoin}"${alpha()}/>`);
    },
    clip() {},
  };
  return { ctx, out };
}

const { ctx, out } = svgCtx();
drawMark(ctx);

const letters = [
  ['S', '#F2645A', 0], ['n', '#FFBE3D', 6], ['a', '#5BC95B', -5], ['c', '#4E98E4', 6], ['k', '#8D79EC', -6],
  [' ', null, 0], ['B', '#EE6FD9', 2], ['o', '#FFBE3D', 7], ['x', '#5BC95B', -5],
];
const spans = (withFill) => letters.map(([ch, col, dy]) => (ch === ' ' ? ' ' : `<tspan dy="${dy}"${withFill ? ` fill="${col}"` : ''}>${ch}</tspan>`)).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOGO_W} ${LOGO_H}" width="${LOGO_W * 2}" height="${LOGO_H * 2}">
  <title>Toddlers' Snack Box</title>
  <defs><style>@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&amp;display=swap');
    .w { font-family: Fredoka, "Baloo 2", ui-rounded, sans-serif; }</style></defs>
  <!-- Mark: Snack Buddies peeking out of the box (generated from src/brand.js) -->
  <g>
    ${out.join('\n    ')}
  </g>
  <!-- Wordmark -->
  <text class="w" x="224" y="84" font-size="50" font-weight="600" fill="#1F2A44">Toddlers'</text>
  <g class="w" font-size="80" font-weight="700" stroke-linejoin="round">
    <text x="221" y="167" fill="#1F2A44">${spans(false)}</text>
    <text x="218" y="162" stroke="#1F2A44" stroke-width="9" paint-order="stroke">${spans(true)}</text>
  </g>
  <text class="w" x="226" y="204" font-size="20" font-weight="600" letter-spacing="3" fill="#1F2A44" opacity=".6">NUTRITION, ON REPEAT</text>
</svg>
`;
writeFileSync(new URL('../logo.svg', import.meta.url), svg);
console.log(`logo.svg written (${out.length} shapes in the mark)`);
