// The Snack Buddies: the app's characters. One set of outlines drives the
// printed art, the squishy 3D lid buttons and the logo.
// Outlines are in unit space: roughly [-1, 1] on both axes, y pointing down.

export const BUDDIES = {
  tri: { fill: '#F2645A', edge: '#E0433D' },
  egg: { fill: '#FFCB5C', edge: '#F9B530' },
  cloud: { fill: '#86DB82', edge: '#5BBE5B' },
  wavy: { fill: '#F99BE8', edge: '#EE6FD9' },
  roof: { fill: '#79B6F2', edge: '#4E98E4' },
  bloop: { fill: '#8D98F5', edge: '#6D79EC' },
};
export const BUDDY_KEYS = Object.keys(BUDDIES);

const TAU = Math.PI * 2;
const PINK = '#FF6F6F';
const PUPIL = '#23232B';

function roundedPoly(pts, r, seg = 10) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const a = pts[(i - 1 + pts.length) % pts.length];
    const b = pts[(i + 1) % pts.length];
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const ra = Math.min(r, la / 2);
    const rb = Math.min(r, lb / 2);
    const A = [p[0] + ((a[0] - p[0]) / la) * ra, p[1] + ((a[1] - p[1]) / la) * ra];
    const B = [p[0] + ((b[0] - p[0]) / lb) * rb, p[1] + ((b[1] - p[1]) / lb) * rb];
    for (let k = 0; k <= seg; k++) {
      const t = k / seg;
      const u = 1 - t;
      out.push([u * u * A[0] + 2 * u * t * p[0] + t * t * B[0], u * u * A[1] + 2 * u * t * p[1] + t * t * B[1]]);
    }
  }
  return out;
}

const arc = (cx, cy, r, a0, a1, n = 16) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });

const cache = {};
export function outline(kind) {
  if (cache[kind]) return cache[kind];
  let pts;
  switch (kind) {
    case 'tri':
      pts = roundedPoly([[0, -0.96], [0.98, 0.8], [-0.98, 0.8]], 0.3);
      break;
    case 'egg':
      pts = Array.from({ length: 96 }, (_, i) => {
        const t = (i / 96) * TAU;
        return [0.8 * Math.cos(t) * (1 + 0.1 * Math.sin(t)), 0.96 * Math.sin(t) + 0.02];
      });
      break;
    case 'cloud':
      pts = Array.from({ length: 120 }, (_, i) => {
        const a = (i / 120) * TAU;
        const r = 0.82 + 0.13 * Math.cos(5 * (a + Math.PI / 2));
        return [Math.cos(a) * r, Math.sin(a) * r];
      });
      break;
    case 'wavy': {
      pts = [];
      for (let i = 0; i <= 60; i++) {
        const x = -0.9 + (1.8 * i) / 60;
        const p = ((x + 0.9) / 1.8) * 3;
        pts.push([x, -0.58 - 0.3 * Math.abs(Math.sin(Math.PI * p))]);
      }
      pts.push(...arc(0.66, 0.66, 0.24, 0, Math.PI / 2), ...arc(-0.66, 0.66, 0.24, Math.PI / 2, Math.PI));
      break;
    }
    case 'roof':
      pts = roundedPoly([[0, -0.98], [0.96, -0.16], [0.88, 0.9], [-0.88, 0.9], [-0.96, -0.16]], 0.22);
      break;
    case 'bloop':
      pts = [...arc(0, -0.08, 0.9, Math.PI, TAU, 32), ...arc(0.68, 0.7, 0.22, 0, Math.PI / 2), ...arc(-0.68, 0.7, 0.22, Math.PI / 2, Math.PI)];
      break;
    default:
      throw new Error(`Unknown buddy ${kind}`);
  }
  cache[kind] = pts;
  return pts;
}

/* ------------------------------------------------------------ drawing -- */

function eye(ctx, x, y, r, px = 0.1, py = 0.18, pr = 0.55) {
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = PUPIL;
  ctx.beginPath();
  ctx.arc(x + px * r, y + py * r, r * pr, 0, TAU);
  ctx.fill();
}

// Sideways almond eye (the cloud and wavy buddies' sleepy look).
function almond(ctx, x, y, w, h, tilt, pupilX, pupilR, lid = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.beginPath();
  ctx.moveTo(-w, 0);
  ctx.quadraticCurveTo(0, -h * 2, w, 0);
  ctx.quadraticCurveTo(0, h * 2 * (1 - lid) * 0.5, -w, 0);
  ctx.closePath();
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = PUPIL;
  ctx.beginPath();
  ctx.arc(pupilX * w, -h * 0.35, pupilR, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function cheek(ctx, x, y, rx, ry, rot = 0) {
  ctx.fillStyle = PINK;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  ctx.fill();
}

function smile(ctx, x, y, r, lw, a0 = 0.15, a1 = 0.85) {
  ctx.strokeStyle = PUPIL;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r, a0 * Math.PI, a1 * Math.PI);
  ctx.stroke();
}

// Face only, in unit space (ctx already translated/scaled so 1 = half size).
export function drawFace(ctx, kind) {
  switch (kind) {
    case 'tri':
      ctx.fillStyle = '#FFC23D';
      ctx.beginPath(); ctx.ellipse(-0.47, 0.12, 0.17, 0.08, -0.35, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0.47, 0.26, 0.17, 0.08, 0.35, 0, TAU); ctx.fill();
      eye(ctx, -0.2, 0.08, 0.23, 0.08, 0.2);
      eye(ctx, 0.2, 0.16, 0.23, 0.08, 0.2);
      ctx.fillStyle = PUPIL;
      ctx.beginPath();
      ctx.moveTo(-0.16, 0.44);
      ctx.quadraticCurveTo(0.02, 0.34, 0.14, 0.42);
      ctx.quadraticCurveTo(-0.04, 0.5, -0.06, 0.66);
      ctx.quadraticCurveTo(-0.14, 0.52, -0.16, 0.44);
      ctx.fill();
      break;
    case 'egg':
      cheek(ctx, -0.52, 0.1, 0.15, 0.09);
      cheek(ctx, 0.54, 0.0, 0.15, 0.09);
      eye(ctx, -0.22, -0.16, 0.21, 0.1, 0.22);
      eye(ctx, 0.2, -0.22, 0.22, 0.1, 0.22);
      ctx.fillStyle = PUPIL;
      ctx.beginPath();
      ctx.arc(0.02, 0.16, 0.12, 0.05 * Math.PI, 0.95 * Math.PI);
      ctx.closePath();
      ctx.fill();
      break;
    case 'cloud':
      cheek(ctx, -0.5, 0.2, 0.15, 0.09);
      cheek(ctx, 0.38, 0.3, 0.15, 0.09);
      almond(ctx, -0.3, -0.02, 0.26, 0.14, 0.12, 0.45, 0.1);
      almond(ctx, 0.28, 0.02, 0.24, 0.13, 0.05, 0.45, 0.09);
      smile(ctx, -0.02, 0.1, 0.16, 0.05, 0.25, 0.7);
      break;
    case 'wavy':
      cheek(ctx, -0.56, 0.32, 0.16, 0.1, -0.2);
      cheek(ctx, 0.58, 0.02, 0.16, 0.1, -0.2);
      almond(ctx, -0.3, 0.02, 0.26, 0.12, -0.15, 0.1, 0.12);
      almond(ctx, 0.28, -0.16, 0.26, 0.14, -0.15, 0.25, 0.12);
      smile(ctx, 0.02, 0.12, 0.22, 0.055, 0.12, 0.8);
      ctx.fillStyle = '#F2475E';
      ctx.beginPath();
      ctx.ellipse(0.2, 0.36, 0.06, 0.09, -0.4, 0, TAU);
      ctx.fill();
      break;
    case 'roof':
      ctx.fillStyle = '#FFC23D';
      ctx.beginPath(); ctx.ellipse(-0.44, 0.08, 0.18, 0.08, 0.15, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0.46, 0.08, 0.18, 0.08, -0.15, 0, TAU); ctx.fill();
      eye(ctx, -0.18, 0.0, 0.22, 0.05, 0.2);
      eye(ctx, 0.22, 0.0, 0.22, 0.05, 0.2);
      ctx.fillStyle = PUPIL;
      ctx.beginPath();
      ctx.arc(0.02, 0.3, 0.2, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      break;
    case 'bloop':
      cheek(ctx, -0.6, 0.2, 0.17, 0.1);
      cheek(ctx, 0.6, 0.2, 0.17, 0.1);
      eye(ctx, -0.3, -0.18, 0.27, 0.05, 0.12);
      eye(ctx, 0.3, -0.18, 0.27, 0.05, 0.12);
      ctx.fillStyle = PUPIL;
      ctx.beginPath();
      ctx.ellipse(0, 0.3, 0.07, 0.11, 0, 0, TAU);
      ctx.fill();
      break;
    default:
  }
}

export function tracePath(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

// Full buddy centred on (x, y), `size` px across.
export function drawBuddy(ctx, kind, x, y, size, { rot = 0, face = true, body = true, edge = true, fill } = {}) {
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  if (body) {
    tracePath(ctx, outline(kind));
    ctx.fillStyle = fill || BUDDIES[kind].fill;
    ctx.fill();
    if (edge) {
      ctx.strokeStyle = BUDDIES[kind].edge;
      ctx.lineWidth = 0.07;
      ctx.stroke();
    }
  }
  if (face) drawFace(ctx, kind);
  ctx.restore();
}
