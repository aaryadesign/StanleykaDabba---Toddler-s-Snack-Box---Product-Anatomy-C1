// The logo: three Snack Buddies peeking out of an app-blue snack box, next to
// a bouncy wordmark. Pure canvas 2D, so tools/make-logo-svg.mjs can reuse it.
import { C } from './themes.js';
import { drawBuddy } from './buddies.js';

export const FONT = '"Fredoka", "Baloo 2", ui-rounded, system-ui, sans-serif';
export const LOGO_W = 612;
export const LOGO_H = 212;
const INK = C.ink;

// 200 × 200 design space.
export function drawMark(ctx) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  drawBuddy(ctx, 'tri', 58, 82, 76, { rot: -0.28 });
  drawBuddy(ctx, 'cloud', 146, 86, 70, { rot: 0.2 });
  drawBuddy(ctx, 'egg', 101, 70, 72, { rot: 0.03 });
  // Box front.
  ctx.beginPath();
  ctx.roundRect(16, 104, 168, 84, 28);
  ctx.fillStyle = C.brand;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 8;
  ctx.stroke();
  // Rim.
  ctx.beginPath();
  ctx.roundRect(10, 98, 180, 22, 11);
  ctx.fillStyle = '#4C86F0';
  ctx.fill();
  ctx.stroke();
  // Little leaf badge: healthy.
  ctx.save();
  ctx.translate(100, 152);
  ctx.beginPath();
  ctx.moveTo(-18, 8);
  ctx.quadraticCurveTo(-16, -18, 18, -16);
  ctx.quadraticCurveTo(16, 10, -18, 8);
  ctx.closePath();
  ctx.fillStyle = C.go;
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-12, 4);
  ctx.quadraticCurveTo(0, -6, 12, -11);
  ctx.stroke();
  ctx.restore();
}

const WORD_COLORS = ['#F2645A', '#FFBE3D', '#5BC95B', '#4E98E4', '#8D79EC', null, '#EE6FD9', '#FFBE3D', '#5BC95B'];
const WORD_JIG = [[-3, -0.06], [3, 0.05], [-2, -0.03], [4, 0.06], [-2, -0.05], [0, 0], [-4, 0.05], [3, -0.05], [-2, 0.04]];

function outlinedText(ctx, text, x, y, fill, stroke, lw) {
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

export function drawWordmark(ctx, { tagline = true } = {}) {
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `600 50px ${FONT}`;
  ctx.fillStyle = INK;
  ctx.fillText("Toddlers'", 224, 84);

  ctx.font = `700 80px ${FONT}`;
  let x = 218;
  [...'Snack Box'].forEach((ch, i) => {
    const w = ctx.measureText(ch).width;
    if (ch === ' ') { x += w * 0.85; return; }
    const [dy, rot] = WORD_JIG[i];
    ctx.save();
    ctx.translate(x + w / 2, 162 + dy);
    ctx.rotate(rot);
    ctx.fillStyle = INK;
    ctx.fillText(ch, -w / 2 + 3, 5);
    outlinedText(ctx, ch, -w / 2, 0, WORD_COLORS[i], INK, 9);
    ctx.restore();
    x += w - 1;
  });

  if (tagline) {
    ctx.font = `600 20px ${FONT}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.6;
    ctx.fillText('NUTRITION, ON REPEAT', 226, 204);
    ctx.globalAlpha = 1;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
}

// Full lock-up with its top-left at (x, y), `h` px tall.
export function drawLogo(ctx, x, y, h, opts) {
  const s = h / LOGO_H;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  drawMark(ctx);
  drawWordmark(ctx, opts);
  ctx.restore();
  return LOGO_W * s;
}
