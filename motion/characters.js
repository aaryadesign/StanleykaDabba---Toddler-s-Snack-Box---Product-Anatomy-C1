// Brings the onboarding characters to life using their existing Figma parts
// (body, eyes, cheeks, mouth). At rest each character is exactly the original
// art; motion is layered on top, driven by a few springs.
//
//   breathing    – the whole character swells a little, every ~3.6 s
//   blinking     – random, sometimes a double blink
//   looking      – pupils (and the face, a touch) follow the finger or the field
//                  being typed in; idle glances when nothing is happening
//   reactions    – squish when tapped, happy hop, head shake, blush, chatter
//   expressions  – the face changes: smile, grin, "o" of surprise, sad frown
//                  with droopy lids, happy ^ ^ eyes, a yum tongue, sleepy lids.
//                  Drawn in the art's own line and colours; every part is a
//                  spring, so one face melts into the next.

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';
const INK = '#241E20';

export class Spring {
  constructor(x = 0, k = 170, c = 16) { this.x = x; this.t = x; this.v = 0; this.k = k; this.c = c; }
  step(dt) {
    const n = Math.max(2, Math.ceil(dt / 0.008));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      this.v += ((this.t - this.x) * this.k - this.v * this.c) * h;
      this.x += this.v * h;
    }
    return this.x;
  }
}

// mouth: where the drawn mouth sits (its centre), how big, and its tilt.
// skin: body colour, used for the eyelids.
const SPECS = {
  child: { root: '.child-art', eyes: ['.child-eye.left', '.child-eye.right'], cheeks: ['.child-cheek.left', '.child-cheek.right'], mouth: '.child-mouth-position', look: [14, 7], skin: '#FD9BEB', face: { s: 1, rot: -8 } },
  location: { root: '.location-art', eyes: ['.location-eye.left', '.location-eye.right'], cheeks: ['.location-cheek.left', '.location-cheek.right'], mouth: '.location-mouth', look: [15, 12], skin: '#8296F5', face: { s: 0.78, rot: 0 } },
  meal: { root: '.meal-character', eyes: ['.meal-eye.left', '.meal-eye.right'], cheeks: ['.meal-cheek.left', '.meal-cheek.right'], mouth: '.meal-mouth-position', look: [11, 9], skin: '#7EBDF1', face: { s: 0.82, rot: 0 } },
  plan: { root: '.plan-character', eyes: ['.plan-eye.left', '.plan-eye.right'], cheeks: ['.plan-cheek.left', '.plan-cheek.right'], mouth: '.plan-mouth-position', look: [14, 7], skin: '#85E087', face: { s: 1, rot: -8 } },
};

// Faces. mouth: null keeps the original drawn mouth.
//   w half-width · u / l how far the upper / lower lip bow down (negative = up)
//   k roundness · tg tongue (1 inside, >1 poking out)
// eyes: joy = ^ ^ · wide = eyes pop · drop / tilt = upper lids (tilt droops the outer corners)
const M = {
  smile: { w: 26, u: 15, l: 15, k: 0.55, tg: 0 },
  grin: { w: 29, u: 7, l: 44, k: 0.8, tg: 1 },
  o: { w: 11, u: -15, l: 15, k: 1.25, tg: 0 },
  small: { w: 8, u: -8, l: 9, k: 1.2, tg: 0 },
  frown: { w: 19, u: -11, l: -11, k: 0.6, tg: 0 },
  yum: { w: 22, u: 9, l: 28, k: 0.75, tg: 1.55 },
  flat: { w: 12, u: 1, l: 1, k: 0.5, tg: 0 },
};
const E0 = { joy: 0, wide: 0, drop: 0, tilt: 0 };
export const FACES = {
  neutral: { mouth: null, eyes: E0 },
  curious: { mouth: M.small, eyes: { ...E0, wide: 0.35 } },
  happy: { mouth: M.smile, eyes: E0, blush: 0.5 },
  delighted: { mouth: M.grin, eyes: { ...E0, joy: 1 }, blush: 1 },
  surprised: { mouth: M.o, eyes: { ...E0, wide: 1 } },
  sad: { mouth: M.frown, eyes: { ...E0, drop: 0.36, tilt: 0.32 } },
  yum: { mouth: M.yum, eyes: { ...E0, joy: 1 }, blush: 0.7 },
  sleepy: { mouth: M.flat, eyes: { ...E0, drop: 0.58 } },
  focused: { mouth: M.flat, eyes: { ...E0, drop: 0.16, tilt: -0.12 } },
};

const svgCache = new Map();
async function loadSvg(url) {
  if (!svgCache.has(url)) svgCache.set(url, fetch(url).then((r) => r.text()));
  return svgCache.get(url);
}

const el = (name, attrs = {}) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

let uid = 0;
// Swap an <img> eye for its inline SVG so the pupil can move inside the white,
// clipped to the eye shape. Adds, unseen at rest: an upper lid in the body
// colour (for sad / sleepy) and a ^ arc (for happy).
async function inlineEye(img, skin, side) {
  const text = await loadSvg(img.getAttribute('src'));
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = document.importNode(doc.documentElement, true);
  const shapes = [...svg.querySelectorAll('path, ellipse, circle')];
  const [white, pupil] = shapes;
  const vb = svg.viewBox.baseVal;
  const w = vb.width;
  const h = vb.height;
  const id = `eye-clip-${++uid}`;
  const defs = el('defs');
  const clip = el('clipPath', { id });
  clip.append(white.cloneNode());
  defs.append(clip);

  // ball = everything that blinks; arc = the ^ shown instead when happy.
  const ball = el('g');
  const clipG = el('g', { 'clip-path': `url(#${id})` });
  const move = el('g');
  const lid = el('rect', { x: -w, y: -h * 2, width: w * 3, height: h * 2, fill: skin });
  pupil.replaceWith(clipG);
  move.append(pupil);
  clipG.append(move, lid);
  [...svg.childNodes].forEach((n) => ball.append(n));
  const arc = el('path', {
    d: `M${w * 0.16} ${h * 0.64} Q${w * 0.5} ${h * 0.02} ${w * 0.84} ${h * 0.64}`,
    fill: 'none', stroke: INK, 'stroke-width': Math.min(w, h) * 0.13 + 2, 'stroke-linecap': 'round', opacity: 0,
  });
  svg.append(defs, ball, arc);

  svg.setAttribute('class', img.getAttribute('class'));
  svg.setAttribute('aria-hidden', 'true');
  svg.removeAttribute('style');
  Object.assign(svg.style, { position: 'absolute', display: 'block', overflow: 'visible' });
  img.replaceWith(svg);
  return { el: svg, ball, pupil: move, shape: pupil, lid, arc, w, h, side, pc: null };
}

// A mouth drawn from a few numbers, so any face can spring into any other.
function makeMouth(root, anchor, face) {
  const svg = el('svg', { viewBox: '-80 -60 160 120', width: 160, height: 120, 'aria-hidden': 'true' });
  Object.assign(svg.style, { position: 'absolute', overflow: 'visible', pointerEvents: 'none', opacity: 0 });
  const g = el('g');
  const inside = el('path', { fill: '#4A1519' });
  const tongue = el('ellipse', { fill: '#FB2326' });
  const tongueLine = el('path', { fill: 'none', stroke: '#940D10', 'stroke-width': 2.6, 'stroke-linecap': 'round' });
  const lips = el('path', { fill: 'none', stroke: INK, 'stroke-width': 5.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  g.append(inside, lips, tongue, tongueLine);
  svg.append(g);
  root.append(svg);
  let placed = false;
  return {
    svg,
    // Centre the drawing on the original mouth once the screen has been laid out.
    place() {
      if (placed || !anchor.offsetWidth) return;
      placed = true;
      const cx = anchor.offsetLeft + anchor.offsetWidth / 2;
      const cy = anchor.offsetTop + anchor.offsetHeight / 2;
      svg.style.left = `${cx - 80}px`;
      svg.style.top = `${cy - 60}px`;
    },
    draw({ w, u, l, k, tg }, show, sx, sy, fx, fy) {
      const c = w * k;
      const d = `M${-w} 0C${-c} ${u * 1.33} ${c} ${u * 1.33} ${w} 0C${c} ${l * 1.33} ${-c} ${l * 1.33} ${-w} 0Z`;
      inside.setAttribute('d', d);
      lips.setAttribute('d', d);
      // Tongue: rests on the lower lip; tg > 1 pokes it out.
      const low = Math.max(u, l);
      const open = Math.max(0, l - u);
      const t = Math.max(0, tg);
      const rx = w * 0.42 * Math.min(1, t);
      const ry = Math.min(open * 0.3, 11) * Math.min(1, t) + (t > 1 ? (t - 1) * 10 : 0);
      const ty = t > 1 ? low - ry * 0.35 + (t - 1) * 14 : low - ry - 2;
      tongue.setAttribute('rx', Math.max(0, rx));
      tongue.setAttribute('ry', Math.max(0, ry));
      tongue.setAttribute('cx', w * 0.12);
      tongue.setAttribute('cy', ty);
      tongueLine.setAttribute('d', ry > 3 ? `M${w * 0.12} ${ty - ry * 0.55}L${w * 0.12} ${ty + ry * 0.35}` : '');
      svg.style.opacity = show;
      g.setAttribute('transform', `translate(${fx} ${fy}) rotate(${face.rot}) scale(${face.s * sx} ${face.s * sy})`);
    },
  };
}

export class Character {
  constructor(screen, kind) {
    const s = SPECS[kind];
    this.kind = kind;
    this.screen = screen;
    this.spec = s;
    this.root = screen.querySelector(s.root);
    this.cheeks = s.cheeks.map((q) => screen.querySelector(q));
    this.mouth = screen.querySelector(s.mouth);
    this.drawn = makeMouth(this.root, this.mouth, s.face);
    this.eyes = [];
    this.ready = Promise.all(s.eyes.map((q, i) => inlineEye(screen.querySelector(q), s.skin, i ? 1 : -1))).then((eyes) => { this.eyes = eyes; });

    this.t = Math.random() * 10;
    this.enter = new Spring(0, 90, 11); // 0 = in place; starts off-screen when played
    this.sx = new Spring(1, 320, 13);
    this.sy = new Spring(1, 320, 13);
    this.shake = new Spring(0, 520, 9);
    this.lookX = new Spring(0, 140, 17);
    this.lookY = new Spring(0, 140, 17);
    this.lid = new Spring(1, 900, 40);
    this.blush = new Spring(0, 60, 10);
    this.blushBase = 0;
    this.mouthS = new Spring(1, 420, 12);

    // Expression springs. Mouth shape settles with a little wobble; eyes are snappier.
    this.m = Object.fromEntries(Object.entries(M.smile).map(([k, v]) => [k, new Spring(v, 300, 17)]));
    this.show = new Spring(0, 520, 30); // 0 = original mouth, 1 = drawn mouth
    this.e = Object.fromEntries(Object.keys(E0).map((k) => [k, new Spring(0, 360, 24)]));
    this.base = 'neutral';
    this.face = 'neutral';
    this.faceUntil = 0;
    this.queue = [];

    this.target = null; // {x, y} in client px, or null for idle
    this.nextBlink = 1.5 + Math.random() * 2;
    this.nextGlance = 2;
    this.glance = { x: 0, y: 0 };
    this.lastPointer = -99;
    this.lastActive = this.t;
    this.bias = null; // idle glances lean toward this element (e.g. the meal card)
  }

  /* ---- expressions ---- */

  // Show a face. With `hold`, go back to the base face afterwards; extra
  // [face, hold] pairs play in turn (e.g. surprised, then a giggle).
  express(name, hold = 0, ...then) {
    this.lastActive = this.t;
    this.queue = [];
    for (let i = 0; i < then.length; i += 2) this.queue.push([then[i], then[i + 1] || 0]);
    this.setFace(name, hold);
  }

  // The face to return to when nothing else is going on.
  setBase(name) {
    this.base = name;
    if (!this.faceUntil && !this.queue.length) this.setFace(name);
  }

  setFace(name, hold = 0) {
    const f = FACES[name] || FACES.neutral;
    const was = this.face;
    this.face = name;
    this.faceUntil = hold ? this.t + hold : 0;
    if (f.mouth) Object.entries(f.mouth).forEach(([k, v]) => { this.m[k].t = v; });
    // Swapping from the drawn mouth to the original (or back) gets a quick squash, like a cartoon pop.
    const drawn = f.mouth ? 1 : 0;
    if (drawn !== this.show.t || (was !== name && f.mouth)) this.mouthS.v -= 3.5;
    this.show.t = drawn;
    Object.entries(f.eyes).forEach(([k, v]) => { this.e[k].t = v; });
    this.blush.t = Math.max(this.blushBase, f.blush || 0);
  }

  // Entrance: rise from below with a squash on landing, eyes open late, then a hello smile.
  play() {
    this.lastActive = this.t;
    if (REDUCED) return;
    this.enter.x = 1; this.enter.v = 0; this.enter.t = 0;
    this.lid.x = 0.06; this.lid.t = 0.06;
    this.openAt = this.t + 0.42;
    this.sx.x = 0.9; this.sy.x = 1.12;
    this.base = 'neutral';
    this.queue = [];
    this.setFace('neutral');
    this.greetAt = this.t + 0.75;
  }

  squish() { this.sx.v += 2.4; this.sy.v -= 3.2; this.mouthS.v += 6; this.express('surprised', 0.4, 'delighted', 1); }
  hop() { this.sy.v += 2.6; this.sx.v -= 1.6; this.blush.t = 1; this.mouthS.v += 5; this.express('delighted', 1.4); }
  nod() { this.sy.v -= 1.4; this.blush.t = Math.max(this.blush.t, 0.7); }
  shakeHead() { this.shake.v += 26; }
  // Mouth pops open for a moment, like talking along.
  chatter() {
    this.lastActive = this.t;
    this.mouthS.v += 5;
    if (this.show.t) this.m.l.v += 260;
  }
  setBlush(v) { this.blushBase = v; this.blush.t = Math.max(this.blush.t, v); }

  // `fn` returns a client-px point to watch (e.g. the caret), or null.
  watch(fn) { this.focus = fn; this.lastActive = this.t; }

  pointer(x, y) {
    this.target = { x, y };
    this.lastPointer = this.t;
    // Woken up.
    if (this.face === 'sleepy') { this.lastActive = this.t; this.express('surprised', 0.45); }
  }

  blink() {
    this.lid.t = 0.08;
    this.reopen = this.t + 0.085;
    if (Math.random() < 0.22) this.second = this.t + 0.26;
  }

  update(dt) {
    this.t += dt;
    const t = this.t;
    if (!this.eyes.length) return;
    this.drawn.place();

    // Face timeline.
    if (this.greetAt && t > this.greetAt) {
      this.greetAt = 0;
      this.express(this.kind === 'meal' ? 'yum' : this.kind === 'location' ? 'curious' : 'happy', 1.1);
    }
    if (this.faceUntil && t > this.faceUntil) {
      const next = this.queue.shift();
      if (next) this.setFace(next[0], next[1]);
      else this.setFace(this.base);
    }
    // Left alone a while: dozes off. Any pointer movement wakes it.
    const idle = t - Math.max(this.lastActive, this.lastPointer);
    if (!REDUCED && !this.focus && idle > 14 && this.face === this.base && this.base === 'neutral') this.setFace('sleepy');

    // Blinks (slow and heavy when sleepy).
    const sleepy = this.face === 'sleepy';
    if (this.openAt && t > this.openAt) { this.lid.t = 1; this.openAt = 0; }
    if (this.reopen && t > this.reopen) { this.lid.t = 1; this.reopen = 0; }
    if (this.second && t > this.second) { this.second = 0; this.lid.t = 0.08; this.reopen = t + (sleepy ? 0.6 : 0.085); }
    if (!REDUCED && t > this.nextBlink) {
      this.blink();
      if (sleepy) this.reopen = t + 0.7;
      this.nextBlink = t + 2.2 + Math.random() * 3.8;
    }

    // Where to look.
    let lx = 0;
    let ly = 0;
    // A focused field wins; otherwise the finger, until it has been still a while.
    const pt = this.focus?.() || (t - this.lastPointer < 2.6 ? this.target : null);
    if (pt) {
      this.target = pt;
      const r = this.root.getBoundingClientRect();
      const e0 = this.eyes[0].el.getBoundingClientRect();
      const e1 = this.eyes[1].el.getBoundingClientRect();
      const cx = (e0.left + e1.right) / 2;
      const cy = (e0.top + e0.bottom) / 2;
      const dx = this.target.x - cx;
      const dy = this.target.y - cy;
      const scale = r.width / 400 || 1;
      lx = dx / (Math.abs(dx) + 120 * scale);
      ly = dy / (Math.abs(dy) + 120 * scale);
    } else if (sleepy) {
      ly = 0.5;
    } else if (!REDUCED) {
      if (t > this.nextGlance) {
        this.nextGlance = t + 1.6 + Math.random() * 2.6;
        const r = Math.random();
        if (this.bias && r < 0.5) {
          this.glance = { x: -0.25 + Math.random() * 0.2, y: 0.95 };
          // Looking at the food sometimes earns a lick of the lips.
          if (Math.random() < 0.45 && this.face === this.base) this.express('yum', 1.1);
        } else if (r < 0.7) this.glance = { x: (Math.random() - 0.5) * 1.6, y: (Math.random() - 0.4) * 0.9 };
        else this.glance = { x: 0, y: 0 };
      }
      lx = this.glance.x;
      ly = this.glance.y;
    }
    this.lookX.t = lx;
    this.lookY.t = ly;

    const k = [this.enter, this.sx, this.sy, this.shake, this.lookX, this.lookY, this.lid, this.blush, this.mouthS, this.show,
      ...Object.values(this.m), ...Object.values(this.e)];
    k.forEach((s) => s.step(dt));
    this.blush.t = this.blushBase + (this.blush.t - this.blushBase) * Math.pow(0.3, dt); // extra blush fades on its own

    // Body: breathing + squash, anchored at the bottom so the face rides on top. Sleepy = slower, deeper breaths.
    const breath = REDUCED ? 0 : Math.sin(t * (sleepy ? 1.1 : 1.75)) * (sleepy ? 1.8 : 1);
    const sy = this.sy.x * (1 + 0.009 * breath);
    const sx = this.sx.x * (1 - 0.004 * breath);
    const ty = this.enter.x * 420;
    const rot = this.shake.x * 0.25;
    this.root.style.transformOrigin = '50% 100%';
    this.root.style.transform = `translate(${this.shake.x * 1.2}px, ${ty}px) rotate(${rot}deg) scale(${sx}, ${sy})`;

    // Face turns a little toward the look target (cheap head turn).
    const fx = this.lookX.x * 7;
    const fy = this.lookY.x * 4;
    const [mx, my] = this.spec.look;
    const { joy, wide, drop, tilt } = this.e;
    const j = Math.min(1, Math.max(0, joy.x));
    this.eyes.forEach((e) => {
      const grow = 1 + wide.x * 0.14;
      e.el.style.transformOrigin = '50% 55%';
      e.el.style.transform = `translate(${fx}px, ${fy}px) scale(${grow})`;
      // Blink and happy-squint close the eye; the ^ arc takes its place.
      const cy = e.h * 0.55;
      e.ball.setAttribute('transform', `translate(0 ${cy}) scale(1 ${Math.max(0.04, this.lid.x * (1 - j))}) translate(0 ${-cy})`);
      e.ball.setAttribute('opacity', Math.min(1, Math.max(0, (0.92 - j) / 0.35)));
      const shrink = 1 - wide.x * 0.18;
      // Pupil centre (measured once it's on screen), so it shrinks in place when surprised.
      if (!e.pc) { const b = e.shape.getBBox(); e.pc = b.width ? [b.x + b.width / 2, b.y + b.height / 2] : null; }
      const [pcx, pcy] = e.pc || [e.w / 2, e.h / 2];
      e.pupil.setAttribute('transform', `translate(${this.lookX.x * mx} ${this.lookY.x * my}) translate(${pcx} ${pcy}) scale(${shrink}) translate(${-pcx} ${-pcy})`);
      // Upper lid: slides down, and tilts so the outer corners droop (sad) or lift (focused).
      e.lid.setAttribute('transform', `translate(0 ${Math.max(0, drop.x) * e.h * 1.02}) rotate(${e.side * tilt.x * 57.3} ${e.w / 2} 0)`);
      e.arc.setAttribute('opacity', j);
      e.arc.setAttribute('transform', `translate(0 ${(1 - j) * e.h * 0.2})`);
    });
    const blush = Math.min(1, this.blush.x);
    this.cheeks.forEach((c) => {
      c.style.transform = `translate(${fx * 0.8}px, ${fy * 0.8}px) scale(${1 + blush * 0.22 + (REDUCED ? 0 : 0.02 * breath)})`;
      c.style.filter = `saturate(${1 + blush * 0.6})`;
    });
    const m = this.mouthS.x;
    const show = Math.min(1, Math.max(0, this.show.x));
    this.mouth.style.opacity = 1 - show;
    this.mouth.style.transform = `translate(${fx * 0.9}px, ${fy * 0.9}px) scale(${1 + (m - 1) * 0.35}, ${m})`;
    const shape = Object.fromEntries(Object.entries(this.m).map(([key, s]) => [key, s.x]));
    this.drawn.draw(shape, show, 1 + (m - 1) * 0.35, m, fx * 0.9, fy * 0.9);
  }
}
