// Everything printed on the box is drawn here with canvas 2D: the picture
// wheel, the name sticker, the menu card and the panels on each face.
import * as THREE from 'three';
import { C, POPS, BEADS, DAYS, DAILY } from './themes.js';
import { drawBuddy, drawFace } from './buddies.js';
import { FONT, LOGO_W, LOGO_H, drawLogo, drawMark } from './brand.js';

export { FONT, LOGO_W, LOGO_H, drawLogo, drawMark };
export const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const INK = C.ink;

let maxAniso = 8;
export const setMaxAniso = (n) => { maxAniso = n; };

// A canvas-backed texture that can be redrawn in place (e.g. when the day changes).
export function canvasTex(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  const redraw = (...args) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h, ...args);
    tex.needsUpdate = true;
  };
  return { canvas, ctx, tex, redraw };
}

// Deterministic randomness so a day's print never reshuffles between redraws.
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (str) => [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

function fitFont(ctx, text, weight, size, maxW) {
  let s = size;
  ctx.font = `${weight} ${s}px ${FONT}`;
  while (ctx.measureText(text).width > maxW && s > 10) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${FONT}`;
  }
  return s;
}

function outlinedText(ctx, text, x, y, fill, stroke, lw) {
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function star(ctx, x, y, r, points = 5, inner = 0.48, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 ? r * inner : r;
    const a = rot + (i * Math.PI) / points;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

function heart(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.25, y + s * 0.05, x - s * 0.75, y - s * 0.95, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.75, y - s * 0.95, x + s * 1.25, y + s * 0.05, x, y + s * 0.9);
  ctx.closePath();
}

// Sprinkles of tiny stars and dots, kept out of the areas that carry information.
function confetti(ctx, w, h, { seed, n, colors, avoid = [], size = [6, 14], alpha = 0.9 }) {
  const r = rng(seed);
  let placed = 0;
  for (let tries = 0; placed < n && tries < n * 30; tries++) {
    const x = r() * w;
    const y = r() * h;
    if (avoid.some(([ax, ay, aw, ah]) => x > ax && x < ax + aw && y > ay && y < ay + ah)) continue;
    const s = size[0] + r() * (size[1] - size[0]);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colors[Math.floor(r() * colors.length)];
    const k = r();
    if (k < 0.4) star(ctx, x, y, s, 5, 0.5, r() * 6);
    else if (k < 0.8) { ctx.beginPath(); ctx.arc(x, y, s * 0.55, 0, Math.PI * 2); }
    else { ctx.beginPath(); ctx.roundRect(x - s, y - s * 0.28, s * 2, s * 0.56, s * 0.28); }
    ctx.fill();
    placed++;
  }
  ctx.globalAlpha = 1;
}

/* -------------------------------------------------------- picture wheel -- */

// Disc under the dial cover. Item i sits at 90° + i·60° so that after i
// clockwise clicks it shows upright in the window at the top.
export const DIAL_R = 0.34;
export const DIAL_PIC_R = 0.222;
export const DIAL_WORD_R = 0.112;

export function drawDial(ctx, w, h, theme) {
  const cx = w / 2;
  const cy = h / 2;
  const px = w / 2 / DIAL_R; // px per world unit
  const tints = ['#FFE3DF', '#FFF1C7', '#D9F6E8', '#DCEEFF', '#ECE3FF', '#FFE2F0'];
  ctx.fillStyle = C.cream;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 - (i * Math.PI) / 3; // canvas angle of item i (y down)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, w / 2, a - Math.PI / 6, a + Math.PI / 6);
    ctx.closePath();
    ctx.fillStyle = tints[i];
    ctx.fill();
  }
  theme.items.forEach((item, i) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((-i * Math.PI) / 3);
    const py = -DIAL_PIC_R * px;
    const size = 0.13 * px;
    drawItemPicture(ctx, item, 0, py, size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitFont(ctx, item.word, 700, 0.05 * px, 0.235 * px);
    ctx.fillStyle = INK;
    ctx.fillText(item.word, 0, -DIAL_WORD_R * px);
    ctx.restore();
  });
}

export function drawItemPicture(ctx, item, x, y, size) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (item.kind === 'emoji') {
    ctx.font = `${Math.round(size)}px ${EMOJI}`;
    ctx.fillText(item.pic, x, y + size * 0.06);
    return;
  }
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = size * 0.07;
  const s = size * 0.5;
  if (item.kind === 'shape') {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    if (item.shape === 'circle') ctx.arc(x, y, s * 0.9, 0, Math.PI * 2);
    else if (item.shape === 'square') ctx.roundRect(x - s * 0.82, y - s * 0.82, s * 1.64, s * 1.64, s * 0.12);
    else if (item.shape === 'triangle') { ctx.moveTo(x, y - s); ctx.lineTo(x + s, y + s * 0.78); ctx.lineTo(x - s, y + s * 0.78); ctx.closePath(); }
    else if (item.shape === 'star') star(ctx, x, y + s * 0.06, s * 1.02, 5, 0.46);
    else if (item.shape === 'heart') heart(ctx, x, y, s * 0.95);
    else if (item.shape === 'oval') ctx.ellipse(x, y, s * 0.68, s * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (item.kind === 'number') {
    ctx.font = `700 ${Math.round(size * 0.78)}px ${FONT}`;
    outlinedText(ctx, String(item.n), x - s * 0.42, y + s * 0.02, ['#FF4D4D', '#FF9A3C', '#FFD23F', '#2FC37A', '#3D8BFF', '#9B6BFF'][item.n - 1], INK, size * 0.08);
    const dotR = s * 0.13;
    for (let k = 0; k < item.n; k++) {
      const col = k % 2;
      const row = Math.floor(k / 2);
      ctx.beginPath();
      ctx.arc(x + s * 0.45 + col * dotR * 2.6, y - s * 0.62 + row * dotR * 2.6, dotR, 0, Math.PI * 2);
      ctx.fillStyle = C.coral;
      ctx.fill();
      ctx.lineWidth = size * 0.035;
      ctx.stroke();
    }
  } else if (item.kind === 'color') {
    // A paint splat.
    const r = rng(hash(item.word));
    ctx.beginPath();
    const n = 11;
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI * 2;
      const rr = s * (0.72 + r() * 0.28);
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - s * 0.28, y - s * 0.28, s * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
  }
}

// Print on the fixed cover plate: rotation arrows around the rim.
// The cover's UVs are its shape coords (±COVER_R), remapped via texture repeat/offset.
export function drawDialCover(ctx, w, h, theme) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const R = w * 0.43;
  ctx.lineCap = 'round';
  ctx.lineWidth = w * 0.028;
  ctx.strokeStyle = theme.accent;
  ctx.fillStyle = theme.accent;
  // Two clockwise arrows down the sides, clear of the window at the top.
  for (const [a0, a1] of [[-0.22 * Math.PI, 0.3 * Math.PI], [0.7 * Math.PI, 1.22 * Math.PI]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, R, a0, a1 - 0.08);
    ctx.stroke();
    const ax = cx + Math.cos(a1) * R;
    const ay = cy + Math.sin(a1) * R;
    const tang = a1 + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(ax + Math.cos(tang) * w * 0.05, ay + Math.sin(tang) * w * 0.05);
    ctx.lineTo(ax + Math.cos(tang + 2.5) * w * 0.045, ay + Math.sin(tang + 2.5) * w * 0.045);
    ctx.lineTo(ax + Math.cos(tang - 2.5) * w * 0.045, ay + Math.sin(tang - 2.5) * w * 0.045);
    ctx.closePath();
    ctx.fill();
  }
  // Dotted ring.
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * w * 0.475, cy + Math.sin(a) * w * 0.475, w * 0.008, 0, Math.PI * 2);
    ctx.fillStyle = '#E3DCCF';
    ctx.fill();
  }
}

/* ---------------------------------------------------------- name sticker -- */

export const STICKER_W = 0.94;
export const STICKER_H = 0.46;

export function drawSticker(ctx, w, h, { name, theme }) {
  const r = h * 0.2;
  // Die-cut white edge.
  ctx.beginPath();
  ctx.roundRect(4, 4, w - 8, h - 8, r);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(20, 20, w - 40, h - 40, r - 14);
  ctx.fillStyle = '#FFF2C2';
  ctx.fill();
  ctx.save();
  ctx.clip();
  confetti(ctx, w, h, { seed: 11, n: 26, colors: ['#FFD86B', '#FFC4B8', '#BDEBD4'], size: [8, 16], alpha: 1, avoid: [[w * 0.36, h * 0.12, w * 0.6, h * 0.76]] });
  ctx.restore();

  // Avatar.
  const ax = h * 0.5;
  const ay = h * 0.5;
  const ar = h * 0.33;
  ctx.beginPath();
  ctx.arc(ax, ay, ar, 0, Math.PI * 2);
  ctx.fillStyle = theme.accent;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.arc(ax, ay, ar - 4, 0, Math.PI * 2);
  ctx.clip();
  // face
  ctx.beginPath();
  ctx.arc(ax, ay + ar * 0.18, ar * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = '#E9B48A';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.stroke();
  // ears
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(ax + sx * ar * 0.62, ay + ar * 0.22, ar * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = '#E9B48A';
    ctx.fill();
    ctx.stroke();
  }
  // hair
  ctx.beginPath();
  ctx.ellipse(ax, ay - ar * 0.18, ar * 0.64, ar * 0.42, 0, Math.PI, 0);
  ctx.quadraticCurveTo(ax + ar * 0.2, ay - ar * 0.05, ax - ar * 0.1, ay - ar * 0.2);
  ctx.quadraticCurveTo(ax - ar * 0.4, ay - ar * 0.02, ax - ar * 0.64, ay - ar * 0.18);
  ctx.fillStyle = '#2A1E17';
  ctx.fill();
  // eyes + smile + cheeks
  ctx.fillStyle = INK;
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(ax + sx * ar * 0.24, ay + ar * 0.15, ar * 0.07, 0, Math.PI * 2); ctx.fill(); }
  ctx.beginPath();
  ctx.arc(ax, ay + ar * 0.3, ar * 0.2, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.fillStyle = C.pink;
  ctx.globalAlpha = 0.8;
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(ax + sx * ar * 0.38, ay + ar * 0.38, ar * 0.1, ar * 0.065, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Text.
  const tx = h * 0.94;
  const maxW = w - tx - 40;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `600 38px ${FONT}`;
  ctx.fillStyle = INK;
  ctx.fillText("Hello, I'm", tx, h * 0.32);
  const size = fitFont(ctx, name, 700, 124, maxW);
  ctx.fillStyle = INK;
  ctx.fillText(name, tx + 4, h * 0.66 + 6);
  outlinedText(ctx, name, tx, h * 0.66, C.coral, INK, 10);
  ctx.font = `600 28px ${FONT}`;
  const pill = 'Age 2 · Standard box';
  const pw = ctx.measureText(pill).width + 36;
  ctx.beginPath();
  ctx.roundRect(tx, h * 0.73, pw, 46, 23);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(pill, tx + 18, h * 0.73 + 33);
  return size;
}

export function drawStickerMask(ctx, w, h) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.roundRect(4, 4, w - 8, h - 8, h * 0.2);
  ctx.fillStyle = '#fff';
  ctx.fill();
}

/* ----------------------------------------------------------- face prints -- */
// `px` is px per world unit. Side panels: x from the panel centre, y up from the
// box floor. Lid: x and z from the lid centre.

export function drawLidTop(ctx, w, h, { theme, px, pops }) {
  const X = (x) => w / 2 + x * px;
  const Y = (z) => h / 2 + z * px;
  const tint = 'rgba(255,255,255,0.55)';
  confetti(ctx, w, h, {
    seed: hash(theme.key + 'lid'), n: 30, colors: [tint, theme.accent], size: [8, 16], alpha: 0.85,
    avoid: [[X(-0.9), Y(-0.74), 1.8 * px, 0.84 * px], [X(-1.0), Y(0.0), 2.0 * px, 0.8 * px]],
  });
  // Buddies peeking over the back edge of the lid.
  drawBuddy(ctx, 'wavy', X(-1.02), Y(-0.66), 0.26 * px, { rot: -0.25 });
  drawBuddy(ctx, 'bloop', X(1.02), Y(-0.64), 0.26 * px, { rot: 0.25 });

  // Logo on a printed white badge.
  const logoH = 0.48 * px;
  const logoW = (LOGO_W / LOGO_H) * logoH;
  const bw = logoW + 0.14 * px;
  const bh = logoH + 0.1 * px;
  const bx = X(0) - bw / 2;
  const by = Y(-0.35) - bh / 2;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, bh * 0.28);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 0.012 * px;
  ctx.strokeStyle = INK;
  ctx.stroke();
  drawLogo(ctx, bx + 0.07 * px, by + 0.05 * px, logoH);

  // Day / theme ribbon.
  const label = `${theme.day.toUpperCase()}  ·  ${theme.theme.toUpperCase()}`;
  ctx.font = `700 ${Math.round(0.07 * px)}px ${FONT}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(0.008 * px)}px`;
  const lw = ctx.measureText(label).width + 0.12 * px;
  const lh = 0.12 * px;
  ctx.beginPath();
  ctx.roundRect(X(0) - lw / 2, Y(0.08) - lh / 2, lw, lh, lh / 2);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, X(0), Y(0.08) + 0.004 * px);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  // Plates behind the buddy buttons + colour words (English + Hindi).
  pops.forEach((p, i) => {
    const x = X(p.x);
    const y = Y(p.z);
    ctx.beginPath();
    ctx.arc(x, y, 0.2 * px, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 0.01 * px;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = `700 ${Math.round(0.07 * px)}px ${FONT}`;
    ctx.fillText(POPS[i].word, x, y + 0.27 * px);
    ctx.font = `600 ${Math.round(0.05 * px)}px ${FONT}`;
    ctx.globalAlpha = 0.75;
    ctx.fillText(POPS[i].hindi, x, y + 0.35 * px);
    ctx.globalAlpha = 1;
  });
}

// The inside of the lid: "Meet today's food", with Yum / Hmm faces that feed
// the parent's swap list (PRD §4.3).
export const LID_UNDER = { w: 2.2, h: 1.4, px: 500 };
export const YUM_BOX = [540, 548, 236, 116];
export const HMM_BOX = [792, 548, 222, 116];

export function drawLidUnder(ctx, w, h, { theme, name }) {
  const hero = theme.hero;
  ctx.beginPath();
  ctx.roundRect(8, 8, w - 16, h - 16, 56);
  ctx.fillStyle = '#FFFDF8';
  ctx.fill();
  ctx.setLineDash([22, 16]);
  ctx.lineWidth = 8;
  ctx.strokeStyle = theme.accent;
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK;
  ctx.font = `700 60px ${FONT}`;
  ctx.fillText("Meet today's food!", 70, 110);
  drawBuddy(ctx, theme.buddy, w - 120, 96, 130, { rot: 0.12 });

  // Big food portrait.
  ctx.beginPath();
  ctx.arc(290, 330, 170, 0, Math.PI * 2);
  ctx.fillStyle = theme.lid;
  ctx.globalAlpha = 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `230px ${EMOJI}`;
  ctx.fillText(hero.pic, 290, 345);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK;
  fitFont(ctx, hero.name, 700, 84, w - 560 - 60);
  ctx.fillText(hero.name, 560, 240);
  const icons = ['👀', '✋', '🌱'];
  hero.facts.forEach((f, i) => {
    const y = 300 + i * 70;
    ctx.font = `500 36px ${FONT}`;
    const tw = ctx.measureText(f).width;
    ctx.beginPath();
    ctx.roundRect(560, y - 4, tw + 100, 58, 29);
    ctx.fillStyle = '#F3EEE4';
    ctx.fill();
    ctx.font = `40px ${EMOJI}`;
    ctx.fillText(icons[i], 574, y + 42);
    ctx.fillStyle = INK;
    ctx.font = `500 36px ${FONT}`;
    ctx.fillText(f, 630, y + 38);
  });

  // Yum / Hmm.
  ctx.font = `600 38px ${FONT}`;
  ctx.fillStyle = INK;
  ctx.fillText(`Did ${name} like it?`, 70, 590);
  ctx.font = `500 26px ${FONT}`;
  ctx.fillStyle = 'rgba(31,42,68,0.7)';
  ctx.fillText('Tap a face. We’ll swap', 70, 634);
  ctx.fillText('what they don’t like.', 70, 668);
  ctx.globalAlpha = 1;
  const pill = ([x, y, bw, bh], label, buddy, color) => {
    ctx.beginPath();
    ctx.roundRect(x, y, bw, bh, bh / 2);
    ctx.fillStyle = color;
    ctx.fill();
    drawBuddy(ctx, buddy, x + bh / 2 + 6, y + bh / 2, bh * 0.78);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 40px ${FONT}`;
    ctx.fillText(label, x + bh + 2, y + bh / 2 + 14);
  };
  pill(YUM_BOX, 'Yum!', 'egg', C.go);
  pill(HMM_BOX, 'Hmm', 'bloop', '#8A93A8');
}

export function drawFront(ctx, w, h, { theme, px, dial, sticker }) {
  const X = (x) => w / 2 + x * px;
  const Y = (y) => h - y * px; // y measured up from the box floor
  const pc = theme.print;
  confetti(ctx, w, h, {
    seed: hash(theme.key + 'front'), n: 26, colors: [pc], size: [7, 13], alpha: 0.5,
    avoid: [
      [X(dial.x - 0.42), Y(dial.y + 0.42), 0.84 * px, 0.84 * px],
      [X(sticker.x - 0.5), Y(sticker.y + 0.27), 1.0 * px, 0.54 * px],
      [X(-0.3), Y(0.82), 0.6 * px, 0.3 * px],
      [X(-0.3), Y(0.46), 0.42 * px, 0.34 * px],
    ],
  });
  // "Spin!" with a curly arrow pointing at the wheel.
  const ax = X(-0.1);
  const ay = Y(0.3);
  ctx.strokeStyle = pc;
  ctx.fillStyle = pc;
  ctx.lineWidth = 0.018 * px;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ax + 0.08 * px, ay - 0.02 * px);
  ctx.bezierCurveTo(ax + 0.06 * px, ay + 0.12 * px, ax - 0.08 * px, ay + 0.12 * px, ax - 0.12 * px, ay + 0.02 * px);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ax - 0.155 * px, ay + 0.0 * px);
  ctx.lineTo(ax - 0.1 * px, ay - 0.03 * px);
  ctx.lineTo(ax - 0.1 * px, ay + 0.06 * px);
  ctx.closePath();
  ctx.fill();
  ctx.font = `700 ${Math.round(0.075 * px)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Spin!', ax, ay - 0.1 * px);
  // A buddy peeking up from the bottom edge.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, Y(0.02));
  ctx.clip();
  drawBuddy(ctx, theme.buddy, X(-0.12), Y(-0.03), 0.2 * px, { rot: 0.08 });
  ctx.restore();
}

// Permanent print on the back, around the clear card pocket.
export const POCKET = { w: 1.94, h: 0.66, y: 0.44 };
export function drawBack(ctx, w, h, { theme, px }) {
  const X = (x) => w / 2 + x * px;
  const Y = (y) => h - y * px;
  ctx.fillStyle = theme.print;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.round(0.034 * px)}px ${FONT}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText('Food-grade PP  ·  BPA-free  ·  Dishwasher-safe insert  ·  Fresh menu card inside the pocket every day', X(0), Y(0.055));
  ctx.globalAlpha = 1;
}

// The day's menu + nutrition card that slides into the back pocket.
export function drawNutritionCard(ctx, w, h, { theme, name }) {
  const m = theme.meal;
  const n = m.n;
  const s = w / 1330; // design px → canvas px
  ctx.save();
  ctx.scale(s, s);
  const W = 1330;
  const H = h / s;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 28);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = theme.body;
  ctx.fillRect(0, 0, 16, H);
  ctx.restore();

  // Left: menu.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 22px ${FONT}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
  ctx.fillStyle = theme.print === INK ? INK : theme.body;
  ctx.fillText(`TODAY'S MENU  ·  ${theme.day.toUpperCase()}`, 44, 56);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.fillStyle = INK;
  const lines = wrap(ctx, m.name, `700 46px ${FONT}`, 500);
  lines.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, 44, 112 + i * 52));
  let y = 112 + Math.min(lines.length, 2) * 52 + 2;
  ctx.fillStyle = 'rgba(31,42,68,0.66)';
  wrap(ctx, m.desc, `500 22px ${FONT}`, 500).slice(0, 2).forEach((ln, i) => ctx.fillText(ln, 44, y + i * 28));
  y += 2 * 28 + 18;
  // ingredient chips
  ctx.font = `500 20px ${FONT}`;
  let x = 44;
  m.ingredients.forEach((ing) => {
    const cw = ctx.measureText(ing).width + 28;
    if (x + cw > 560) { x = 44; y += 40; }
    ctx.beginPath();
    ctx.roundRect(x, y, cw, 32, 16);
    ctx.fillStyle = '#F2F4F8';
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.fillText(ing, x + 14, y + 23);
    x += cw + 8;
  });
  y += 52;
  ctx.font = `600 20px ${FONT}`;
  ctx.fillStyle = C.go;
  ctx.fillText(`✓ Free from: ${m.free.join(' · ')}`, 44, Math.min(y + 8, H - 26));

  // Right: nutrition grid.
  const gx = 600;
  ctx.fillStyle = INK;
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText(`What ${name} gets from this box`, gx, 56);
  const pct = (v, d) => Math.round((v / d) * 100);
  const cells = [
    ['Calories', `${n.kcal} kcal`, pct(n.kcal, DAILY.kcal), 'of daily energy', C.tangerine],
    ['Protein', `${n.protein}g`, pct(n.protein, DAILY.protein), 'of daily need', C.brand],
    ['Healthy fats', `${n.fat}g`, pct(n.fat, DAILY.fat), 'from ghee, seeds, dairy', C.sun],
    ['Carbs', `${n.carbs}g`, pct(n.carbs, DAILY.carbs), 'slow energy from grains', C.mint],
    ['Iron', `${n.iron}mg`, pct(n.iron, DAILY.iron), 'for growth and focus', C.coral],
    ['Calcium', `${n.calcium}mg`, pct(n.calcium, DAILY.calcium), 'for bones and teeth', C.grape],
    ['Sugar', `${n.sugar}g natural`, null, '0g added', C.go],
    ['Salt', '0mg added', null, 'kept out on purpose', C.go],
  ];
  const cw = 350;
  const ch = (H - 88) / 4;
  cells.forEach(([label, val, p, note, col], i) => {
    const cx = gx + (i % 2) * (cw + 14);
    const cy = 76 + Math.floor(i / 2) * ch;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch - 10, 16);
    ctx.fillStyle = '#F6F7FA';
    ctx.fill();
    ctx.fillStyle = 'rgba(31,42,68,0.7)';
    ctx.font = `500 19px ${FONT}`;
    ctx.fillText(label, cx + 16, cy + 28);
    ctx.fillStyle = INK;
    ctx.font = `700 26px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(val, cx + cw - 16, cy + 30);
    ctx.textAlign = 'left';
    if (p !== null) {
      ctx.beginPath();
      ctx.roundRect(cx + 16, cy + 44, cw - 32, 10, 5);
      ctx.fillStyle = '#E3E6EE';
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(cx + 16, cy + 44, Math.max(10, (cw - 32) * Math.min(p, 100) / 100), 10, 5);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.fillStyle = 'rgba(31,42,68,0.6)';
      ctx.font = `500 16px ${FONT}`;
      ctx.fillText(`${p}% ${note}`, cx + 16, cy + ch - 20);
    } else {
      ctx.fillStyle = col;
      ctx.font = `600 18px ${FONT}`;
      ctx.fillText(`✓ ${note}`, cx + 16, cy + ch - 24);
    }
  });
  ctx.restore();
}

function wrap(ctx, text, font, maxW) {
  ctx.font = font;
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  words.forEach((wd) => {
    const t = cur ? `${cur} ${wd}` : wd;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t;
  });
  if (cur) lines.push(cur);
  return lines;
}

// Left side: the week's sticker chart. Every box that comes back earns that
// day's buddy sticker, which nudges the return habit the deposit model needs.
export function drawLeft(ctx, w, h, { theme, px }) {
  const X = (x) => w / 2 + x * px;
  const Y = (y) => h - y * px;
  const pc = theme.print;
  const today = DAYS.indexOf(theme);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = pc;
  ctx.font = `700 ${Math.round(0.075 * px)}px ${FONT}`;
  ctx.fillText('My snack week', X(0), Y(0.735));

  ctx.beginPath();
  ctx.roundRect(X(-0.63), Y(0.66), 1.26 * px, 0.36 * px, 0.06 * px);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  DAYS.forEach((d, i) => {
    const cx = X(-0.51 + i * 0.17);
    const cy = Y(0.52);
    const r = 0.068 * px;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (i < today) {
      ctx.fillStyle = '#F4F1EA';
      ctx.fill();
      drawBuddy(ctx, d.buddy, cx, cy, r * 1.7, { rot: (i % 2 ? 0.15 : -0.15) });
      // check badge
      ctx.beginPath();
      ctx.arc(cx + r * 0.72, cy - r * 0.72, r * 0.34, 0, Math.PI * 2);
      ctx.fillStyle = C.go;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = r * 0.1;
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.58, cy - r * 0.72);
      ctx.lineTo(cx + r * 0.7, cy - r * 0.6);
      ctx.lineTo(cx + r * 0.88, cy - r * 0.86);
      ctx.stroke();
    } else {
      ctx.setLineDash([r * 0.22, r * 0.18]);
      ctx.lineWidth = r * 0.09;
      ctx.strokeStyle = i === today ? theme.body : '#C9CCD5';
      ctx.stroke();
      ctx.setLineDash([]);
      if (i === today) {
        ctx.globalAlpha = 0.35;
        drawBuddy(ctx, d.buddy, cx, cy, r * 1.5, { face: true });
        ctx.globalAlpha = 1;
      }
    }
    ctx.fillStyle = i === today ? INK : 'rgba(31,42,68,0.55)';
    ctx.font = `${i === today ? 700 : 600} ${Math.round(0.036 * px)}px ${FONT}`;
    ctx.fillText(d.short, cx, Y(0.385));
  });

  // Return prompt.
  const rx = X(-0.52);
  const ry = Y(0.17);
  const R = 0.07 * px;
  ctx.strokeStyle = pc;
  ctx.fillStyle = pc;
  ctx.lineWidth = 0.016 * px;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const a0 = (i * 2 * Math.PI) / 3 - Math.PI / 2 + 0.25;
    const a1 = a0 + (2 * Math.PI) / 3 - 0.55;
    ctx.beginPath();
    ctx.arc(rx, ry, R, a0, a1);
    ctx.stroke();
    const t = a1 + Math.PI / 2;
    const hx = rx + Math.cos(a1) * R;
    const hy = ry + Math.sin(a1) * R;
    ctx.beginPath();
    ctx.moveTo(hx + Math.cos(t) * 0.03 * px, hy + Math.sin(t) * 0.03 * px);
    ctx.lineTo(hx + Math.cos(a1) * 0.026 * px, hy + Math.sin(a1) * 0.026 * px);
    ctx.lineTo(hx - Math.cos(a1) * 0.026 * px, hy - Math.sin(a1) * 0.026 * px);
    ctx.closePath();
    ctx.fill();
  }
  ctx.textAlign = 'left';
  ctx.font = `700 ${Math.round(0.052 * px)}px ${FONT}`;
  ctx.fillText('Return me, earn a sticker!', X(-0.42), Y(0.2));
  ctx.font = `500 ${Math.round(0.034 * px)}px ${FONT}`;
  ctx.fillText('Rinse, click my lid shut, leave me at the door.', X(-0.42), Y(0.12));
}

export function drawRight(ctx, w, h, { theme, px }) {
  const X = (x) => w / 2 + x * px;
  const Y = (y) => h - y * px;
  const game = BEADS[theme.beads];
  ctx.fillStyle = theme.print;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.round(0.08 * px)}px ${FONT}`;
  ctx.fillText(game.heading, X(0.06), Y(0.7));
  drawBuddy(ctx, theme.buddy, X(-0.56), Y(0.7), 0.15 * px, { rot: -0.15 });
  confetti(ctx, w, h, {
    seed: hash(theme.key + 'right'), n: 14, colors: [theme.print], size: [6, 12], alpha: 0.5,
    avoid: [[X(-0.7), Y(0.8), 1.4 * px, 0.74 * px]],
  });
}

// Strip on the bead track: what each counted slot means today.
export function drawTrack(ctx, w, h, { slots, len, game }) {
  const px = w / len;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  slots.forEach((z, i) => {
    const x = w / 2 - z * px;
    if (game.colourMode) {
      ctx.font = `700 ${Math.round(h * 0.15)}px ${FONT}`;
      outlinedText(ctx, ['Red', 'Orange', 'Yellow', 'Green', 'Blue'][i], x, h * 0.84, game.colors[i], INK, h * 0.025);
    } else {
      ctx.font = `700 ${Math.round(h * 0.26)}px ${FONT}`;
      outlinedText(ctx, String(i + 1), x, h * 0.83, game.colors[i] === '#2B2F3A' ? C.sun : game.colors[i], INK, h * 0.035);
    }
  });
  // Start pocket label on the waiting side.
  ctx.font = `600 ${Math.round(h * 0.11)}px ${FONT}`;
  ctx.fillStyle = INK;
  ctx.globalAlpha = 0.45;
  ctx.fillText('start here', w * 0.8, h * 0.86);
  ctx.globalAlpha = 1;
}

// Latch face: the bloop buddy going "O!"
export function drawLatch(ctx, w, h) {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(h * 0.46, h * 0.46);
  drawFace(ctx, 'bloop');
  ctx.restore();
}

// Face-only print for the squishy buddy buttons on the lid.
export function drawBuddyFace(ctx, w, h, kind) {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(w / 2, h / 2);
  drawFace(ctx, kind);
  ctx.restore();
}

// Round foil label for the spread tub.
export function drawTubLabel(ctx, w, h, spread) {
  const cx = w / 2;
  const cy = h / 2;
  ctx.fillStyle = '#E9ECF0';
  ctx.fillRect(0, 0, w, h);
  const r = rng(5);
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 120; i++) {
    ctx.strokeStyle = r() > 0.5 ? '#ffffff' : '#98a0ab';
    ctx.lineWidth = 1 + r() * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r() * w * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.43, 0, Math.PI * 2);
  ctx.fillStyle = spread.color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  // tiny mark
  ctx.save();
  ctx.translate(cx - w * 0.1, cy - h * 0.29);
  ctx.scale(w / 1000, w / 1000);
  drawMark(ctx);
  ctx.restore();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = spread.name.split(' ');
  const mid = Math.ceil(words.length / 2);
  const lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].filter(Boolean);
  lines.forEach((ln, i) => {
    fitFont(ctx, ln, 700, Math.round(w * 0.085), w * 0.6);
    ctx.fillText(ln, cx, cy + w * 0.03 + i * w * 0.095);
  });
  ctx.font = `600 ${Math.round(w * 0.04)}px ${FONT}`;
  ctx.globalAlpha = 0.6;
  ctx.fillText('PEEL HERE ▸', cx, cy + w * 0.25);
  ctx.globalAlpha = 1;
}

// Soft blurred rounded-rect used as a contact shadow under the box.
export function drawContactShadow(ctx, w, h) {
  ctx.shadowColor = 'rgba(40, 24, 10, 1)';
  ctx.shadowBlur = w * 0.05;
  ctx.shadowOffsetX = w * 2;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.roundRect(w * 0.12 - w * 2, h * 0.14, w * 0.76, h * 0.72, h * 0.14);
  ctx.fill();
}

export function grainTexture() {
  const { tex, redraw } = canvasTex(256, 256, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    const r = rng(99);
    for (let i = 0; i < w * h; i++) {
      const v = 215 + r() * 40;
      img.data.set([v, v, v, 255], i * 4);
    }
    ctx.putImageData(img, 0, 0);
  });
  redraw();
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
