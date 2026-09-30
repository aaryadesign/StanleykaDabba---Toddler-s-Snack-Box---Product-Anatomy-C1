// The returnable snack box: a food-grade PP tub with a hinged, latched lid,
// a cream insert with compartments, and four play/learn features:
//   front  – picture wheel (spin to reveal today's theme) + name sticker
//   lid    – four squishy Snack Buddy buttons (colour + shape, English + Hindi)
//   right  – a bead game that changes every day
//   inside – a five-part bento, packed full + a spread tub
//   back   – a clear pocket holding the day's menu + nutrition card
//   left   – the week's sticker chart
//   inside the lid – "meet today's food" with Yum / Hmm faces
// Units: 1 = 10 cm. The box is 26 × 18 × ~10.6 cm with the lid on.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from './textures.js';
import { POPS, BEADS, FOODS, SPREADS, DAILY } from './themes.js';
import { outline } from './buddies.js';

export const W = 2.6;
export const D = 1.8;
export const H = 0.82;
const R = 0.22;
const LID_W = W + 0.04;
const LID_D = D + 0.04;
const LID_H = 0.24;
const FACE_W = W - 2 * R;
const SIDE_W = D - 2 * R;
const FLOOR_Y = 0.145;
const PX = 600; // print resolution, px per unit

const DIAL = { x: -0.64, y: 0.41 };
const STICKER = { x: 0.56, y: 0.33 };
const POP_POS = [-0.72, -0.24, 0.24, 0.72].map((x) => ({ x, z: 0.4 }));
const ROD = { x: W / 2 + 0.16, y: 0.44, len: 1.26 };
const SLOT = 0.125;
// Seen from the right-hand side, +z is the viewer's left: counted beads line up
// 1→5 from the left, waiting beads rest on the right.
const slotRight = (i) => 0.56 - i * SLOT; // counted
const slotLeft = (i) => -0.56 + (4 - i) * SLOT; // waiting

const LID_OPEN = -1.95;

/* --------------------------------------------------------------- helpers -- */

function rr(w, h, r, p = new THREE.Shape()) {
  const x = -w / 2;
  const y = -h / 2;
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y);
  p.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  p.lineTo(x + w, y + h - r);
  p.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  p.lineTo(x + r, y + h);
  p.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  p.lineTo(x, y + r);
  p.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return p;
}

// Extrude a footprint upwards; the bevel rounds the top and bottom edges while
// keeping the outline at its nominal size. Bottom sits at y = 0.
function extrudeUp(shape, height, bevel, segs = 4) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: height - 2 * bevel,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: segs,
    curveSegments: 20,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bevel, 0);
  return g;
}

class Spring {
  constructor(x = 0, k = 120, c = 14) {
    this.x = x;
    this.t = x;
    this.v = 0;
    this.k = k;
    this.c = c;
  }
  step(dt) {
    const n = Math.max(3, Math.ceil(dt / 0.008));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      this.v += ((this.t - this.x) * this.k - this.v * this.c) * h;
      this.x += this.v * h;
    }
  }
}

// Pile food into a compartment like it was poured in: each piece tries a few
// spots and settles in the lowest one (with a slight pull to the middle so the
// pile mounds), stopping at the compartment's fill line.
function heap(k, { x: [x0, x1], z: [z0, z1] }, seed) {
  const r = T.rng(seed);
  const cell = 0.02;
  const nx = Math.ceil((x1 - x0) / cell);
  const nz = Math.ceil((z1 - z0) / cell);
  const hf = new Float32Array(nx * nz);
  const area = (x1 - x0) * (z1 - z0);
  const n = Math.round((k.fill * area) / (Math.PI * k.foot * k.foot));
  const m = k.foot * 0.85;
  const maxH = k.maxH ?? 0.3;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const span = Math.max(x1 - x0, z1 - z0) / 2;

  const footprint = (x, z, fr, fn) => {
    const ci = Math.floor((x - x0) / cell);
    const cj = Math.floor((z - z0) / cell);
    const rc = Math.ceil(fr / cell);
    for (let a = -rc; a <= rc; a++) {
      for (let b = -rc; b <= rc; b++) {
        const u = ci + a;
        const v = cj + b;
        if (u < 0 || v < 0 || u >= nx || v >= nz || a * a + b * b > rc * rc) continue;
        fn(v * nx + u);
      }
    }
  };

  const out = [];
  for (let i = 0, fails = 0; i < n && fails < 60; ) {
    const s = k.scale[0] + r() * (k.scale[1] - k.scale[0]);
    const fr = k.foot * s * 0.8;
    const t = k.thick * s;
    let best = null;
    for (let c = 0; c < 6; c++) {
      const x = x0 + m + (x1 - x0 - 2 * m) * r();
      const z = z0 + m + (z1 - z0 - 2 * m) * r();
      let base = 0;
      footprint(x, z, fr, (idx) => { base = Math.max(base, hf[idx]); });
      const score = base + (Math.hypot(x - cx, z - cz) / span) * 0.05;
      if (!best || score < best.score) best = { x, z, base, score };
    }
    if (best.base + t > maxH) { fails++; continue; }
    const top = best.base + t * 0.8;
    footprint(best.x, best.z, fr, (idx) => { hf[idx] = Math.max(hf[idx], top); });
    out.push({ x: best.x, z: best.z, y: best.base + t / 2, s, r: r(), r2: r(), r3: r() });
    i++;
  }
  return out;
}

/* ------------------------------------------------------------ the box -- */

export function createBox({ theme, name, say, sfx, onLidChange }) {
  const root = new THREE.Group();
  const pickables = [];
  const grain = T.grainTexture();

  const plastic = (color, extra = {}) =>
    new THREE.MeshPhysicalMaterial({
      color, roughness: 0.34, clearcoat: 0.55, clearcoatRoughness: 0.28, roughnessMap: grain, ...extra,
    });
  const bodyMat = plastic(theme.body);
  const lidMat = plastic(theme.lid);
  const accentMat = plastic(theme.accent);
  const insertMat = plastic('#FFF7EC', { roughness: 0.42, clearcoat: 0.25 });
  const whiteMat = plastic('#FFFFFF', { roughness: 0.3 });
  const gasketMat = new THREE.MeshStandardMaterial({ color: '#C9CED6', roughness: 0.8 });
  const steelMat = new THREE.MeshStandardMaterial({ color: '#E7EAEE', metalness: 0.7, roughness: 0.28 });

  const decalMat = (map) =>
    new THREE.MeshPhysicalMaterial({
      map, transparent: true, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    });

  function add(parent, geo, mat, { action, pick = true, cast = true, receive = true } = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = receive;
    if (action) m.userData.action = action;
    parent.add(m);
    if (pick) pickables.push(m);
    return m;
  }

  /* ---- tub ---- */
  const body = new THREE.Group();
  root.add(body);

  add(body, extrudeUp(rr(W, D, R), 0.14, 0.05, 6), bodyMat);
  const wallShape = rr(W, D, R);
  wallShape.holes.push(rr(W - 0.1, D - 0.1, R - 0.05, new THREE.Path()));
  add(body, extrudeUp(wallShape, H - 0.07, 0.02, 3), bodyMat).position.y = 0.07;

  // Cream insert tray with its own rim, floor and dividers.
  const insShape = rr(W - 0.1, D - 0.1, R - 0.05);
  insShape.holes.push(rr(W - 0.15, D - 0.15, R - 0.075, new THREE.Path()));
  add(body, extrudeUp(insShape, H - 0.21, 0.008, 2), insertMat).position.y = 0.14;
  const insFloor = new THREE.ShapeGeometry(rr(W - 0.14, D - 0.14, R - 0.07), 16);
  insFloor.rotateX(-Math.PI / 2);
  add(body, insFloor, insertMat, { cast: false }).position.y = FLOOR_Y;
  // Bento dividers: main | fruit / veg | extra / spread.
  for (const x of [-0.15, 0.55]) {
    add(body, new RoundedBoxGeometry(0.035, 0.42, D - 0.16, 3, 0.014), insertMat).position.set(x, FLOOR_Y + 0.21, 0);
  }
  const zDivW = W / 2 - 0.075 + 0.15;
  add(body, new RoundedBoxGeometry(zDivW, 0.42, 0.035, 3, 0.014), insertMat).position.set(-0.15 + zDivW / 2, FLOOR_Y + 0.21, 0);

  // Hinge knuckles on the back and the catch the latch hooks onto.
  const knuckle = (len) => new THREE.CylinderGeometry(0.045, 0.045, len, 24).rotateZ(Math.PI / 2);
  for (const x of [-0.66, 0.66]) add(body, knuckle(0.4), bodyMat).position.set(x, H, -D / 2 - 0.02);
  add(body, new RoundedBoxGeometry(0.3, 0.05, 0.035, 2, 0.012), bodyMat).position.set(0, H - 0.14, D / 2 + 0.012);

  /* ---- printed faces ---- */
  const prints = {};
  function face(key, w, draw, place, parent = body, h = H) {
    const t = T.canvasTex(Math.round(w * PX), Math.round(h * PX), draw);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), decalMat(t.tex));
    m.receiveShadow = true;
    place(m);
    parent.add(m);
    prints[key] = t;
  }
  face('front', FACE_W, T.drawFront, (m) => m.position.set(0, H / 2, D / 2 + 0.002));
  face('back', FACE_W, T.drawBack, (m) => { m.position.set(0, H / 2, -D / 2 - 0.002); m.rotation.y = Math.PI; });
  face('left', SIDE_W, T.drawLeft, (m) => { m.position.set(-W / 2 - 0.002, H / 2, 0); m.rotation.y = -Math.PI / 2; });
  face('right', SIDE_W, T.drawRight, (m) => { m.position.set(W / 2 + 0.002, H / 2, 0); m.rotation.y = Math.PI / 2; });

  /* ---- picture wheel ---- */
  const dialAction = { type: 'dial' };
  const dial = new THREE.Group();
  dial.position.set(DIAL.x, DIAL.y, D / 2);
  body.add(dial);
  add(dial, new THREE.CylinderGeometry(0.385, 0.385, 0.03, 72).rotateX(Math.PI / 2), whiteMat, { action: dialAction }).position.z = 0.015;
  const spinner = new THREE.Group();
  spinner.position.z = 0.031;
  dial.add(spinner);
  const dialTex = T.canvasTex(1024, 1024, T.drawDial);
  add(spinner, new THREE.CircleGeometry(T.DIAL_R, 96), new THREE.MeshStandardMaterial({ map: dialTex.tex, roughness: 0.5 }), {
    action: dialAction, cast: false,
  });
  const flower = new THREE.Shape();
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const r = 0.068 * (0.8 + 0.2 * Math.cos(6 * a));
    if (i === 0) flower.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else flower.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const knobGeo = new THREE.ExtrudeGeometry(flower, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.01, bevelOffset: -0.01, bevelSegments: 4 });
  add(spinner, knobGeo, accentMat, { action: dialAction }).position.z = 0.03;

  const COVER_R = 0.36;
  const cover = new THREE.Shape();
  cover.absarc(0, 0, COVER_R, 0, Math.PI * 2, false);
  const winPts = rr(0.26, 0.22, 0.05, new THREE.Path()).getPoints(12).map((p) => new THREE.Vector2(p.x, p.y + 0.19));
  cover.holes.push(new THREE.Path(winPts));
  const knobHole = new THREE.Path();
  knobHole.absarc(0, 0, 0.078, 0, Math.PI * 2, true);
  cover.holes.push(knobHole);
  const coverGeo = new THREE.ExtrudeGeometry(cover, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelOffset: -0.008, bevelSegments: 3, curveSegments: 48 });
  const coverTex = T.canvasTex(512, 512, T.drawDialCover);
  coverTex.tex.repeat.set(1 / (2 * COVER_R), 1 / (2 * COVER_R));
  coverTex.tex.offset.set(0.5, 0.5);
  add(dial, coverGeo, new THREE.MeshPhysicalMaterial({ map: coverTex.tex, roughness: 0.3, clearcoat: 0.6 }), { action: dialAction }).position.z = 0.036;
  const glassGeo = new THREE.ShapeGeometry(new THREE.Shape(winPts));
  add(dial, glassGeo, new THREE.MeshPhysicalMaterial({
    color: '#ffffff', transparent: true, opacity: 0.14, roughness: 0.04, clearcoat: 1, depthWrite: false,
  }), { action: dialAction, cast: false }).position.z = 0.05;

  /* ---- name sticker ---- */
  const stickerTex = T.canvasTex(940, 460, T.drawSticker);
  const maskTex = T.canvasTex(940, 460, T.drawStickerMask);
  maskTex.redraw();
  maskTex.tex.colorSpace = THREE.NoColorSpace;
  const sGeo = new THREE.PlaneGeometry(T.STICKER_W, T.STICKER_H, 32, 16);
  {
    // Peel the top-right corner up a little, like a real hand-applied sticker.
    const p = sGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getX(i) / (T.STICKER_W / 2) + p.getY(i) / (T.STICKER_H / 2) - 1.62) / 0.38;
      if (t > 0) p.setZ(i, t * t * 0.045);
    }
    sGeo.computeVertexNormals();
  }
  const sticker = new THREE.Group();
  sticker.position.set(STICKER.x, STICKER.y, D / 2 + 0.004);
  body.add(sticker);
  const stickerAction = { type: 'sticker' };
  add(sticker, sGeo, new THREE.MeshPhysicalMaterial({
    map: stickerTex.tex, alphaTest: 0.5, roughness: 0.5, clearcoat: 0.8, clearcoatRoughness: 0.18,
  }), { action: stickerAction, cast: false });
  add(sticker, sGeo, new THREE.MeshStandardMaterial({
    color: '#EFEAE0', alphaMap: maskTex.tex, alphaTest: 0.5, side: THREE.BackSide, roughness: 0.8,
  }), { action: stickerAction, cast: false });

  /* ---- counting abacus ---- */
  const ab = new THREE.Group();
  body.add(ab);
  add(ab, new RoundedBoxGeometry(0.04, 0.36, 1.32, 3, 0.015), insertMat).position.set(W / 2 + 0.02, 0.42, 0);
  const slotsR = [0, 1, 2, 3, 4].map(slotRight);
  const trackTex = T.canvasTex(Math.round(1.32 * PX), Math.round(0.36 * PX), T.drawTrack);
  const trackM = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 0.36), decalMat(trackTex.tex));
  trackM.position.set(W / 2 + 0.041, 0.42, 0);
  trackM.rotation.y = Math.PI / 2;
  ab.add(trackM);
  for (const z of [-0.64, 0.64]) {
    add(ab, new THREE.CylinderGeometry(0.03, 0.034, 0.13, 20).rotateZ(Math.PI / 2), accentMat).position.set(W / 2 + 0.1, ROD.y, z);
    add(ab, new THREE.SphereGeometry(0.036, 20, 12), accentMat).position.set(ROD.x, ROD.y, z);
  }
  add(ab, new THREE.CylinderGeometry(0.016, 0.016, ROD.len, 16).rotateX(Math.PI / 2), steelMat).position.set(ROD.x, ROD.y, 0);
  const beadParts = makeBeadParts(grain);
  let beads = [];
  let game = BEADS.numbers;

  function buildBeads(th) {
    beads.forEach((b) => {
      ab.remove(b.g);
      b.g.traverse((o) => { const k = pickables.indexOf(o); if (k >= 0) pickables.splice(k, 1); });
    });
    game = BEADS[th.beads];
    trackTex.redraw({ slots: slotsR, len: 1.32, game });
    counted = 0;
    beads = game.colors.map((color, i) => {
      const g = beadParts.build(game.kind, color, i);
      g.position.set(ROD.x, ROD.y, slotLeft(i));
      g.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true;
        o.userData.action = { type: 'bead', i };
        pickables.push(o);
      });
      ab.add(g);
      return { g, s: new Spring(slotLeft(i), 190, 17) };
    });
  }
  let counted = 0;

  /* ---- food ---- */
  const foodGroup = new THREE.Group();
  body.add(foodGroup);
  const foodKinds = makeFoodKinds(grain);
  const tub = makeTub();
  tub.group.position.set(0.885, FLOOR_Y, 0.41);
  body.add(tub.group);
  tub.meshes.forEach((m) => { m.userData.action = { type: 'spread' }; pickables.push(m); });

  // main | fruit | veg | extra, matching meal.food order.
  const REGIONS = [
    { x: [-1.2, -0.17], z: [-0.8, 0.8] },
    { x: [-0.13, 0.53], z: [-0.8, -0.02] },
    { x: [-0.13, 0.53], z: [0.02, 0.8] },
    { x: [0.57, 1.2], z: [-0.8, -0.02] },
  ];

  function buildFood(th) {
    for (const m of [...foodGroup.children]) {
      foodGroup.remove(m);
      m.dispose();
      const i = pickables.indexOf(m);
      if (i >= 0) pickables.splice(i, 1);
    }
    th.meal.food.forEach((key, idx) => {
      const k = foodKinds[key];
      const pts = heap(k, REGIONS[idx], 101 + idx * 37 + key.length * 7);
      const mesh = new THREE.InstancedMesh(k.geo, k.mat, pts.length);
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const eul = new THREE.Euler();
      const sc = new THREE.Vector3();
      const pos = new THREE.Vector3();
      pts.forEach((p, i) => {
        eul.set((p.r2 - 0.5) * k.tilt, p.r * Math.PI * 2, (p.r3 - 0.5) * k.tilt);
        q.setFromEuler(eul);
        sc.setScalar(p.s);
        pos.set(p.x, FLOOR_Y + p.y, p.z);
        mesh.setMatrixAt(i, m4.compose(pos, q, sc));
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.action = { type: 'food', key };
      foodGroup.add(mesh);
      pickables.push(mesh);
    });
    tub.setSpread(SPREADS[th.meal.spread]);
  }

  /* ---- back pocket: today's menu + nutrition card ---- */
  const pocket = new THREE.Group();
  pocket.position.set(0, T.POCKET.y, -D / 2);
  pocket.rotation.y = Math.PI;
  body.add(pocket);
  const cardW = T.POCKET.w - 0.04;
  const cardH = T.POCKET.h - 0.04;
  const cardTex = T.canvasTex(1330, Math.round((1330 * cardH) / cardW), T.drawNutritionCard);
  add(pocket, new THREE.PlaneGeometry(cardW, cardH), new THREE.MeshStandardMaterial({ map: cardTex.tex, roughness: 0.75 }), {
    action: { type: 'menu' }, cast: false,
  }).position.z = 0.006;
  const sleeve = rr(T.POCKET.w, T.POCKET.h, 0.06);
  sleeve.holes.push(rr(T.POCKET.w - 0.05, T.POCKET.h - 0.05, 0.04, new THREE.Path()));
  add(pocket, new THREE.ExtrudeGeometry(sleeve, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelOffset: -0.004, bevelSegments: 2 }),
    new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.25, clearcoat: 0.8, transparent: true, opacity: 0.9 }),
    { action: { type: 'menu' } }).position.z = 0.002;
  add(pocket, new THREE.PlaneGeometry(T.POCKET.w - 0.05, T.POCKET.h - 0.05), new THREE.MeshPhysicalMaterial({
    color: '#FFFFFF', transparent: true, opacity: 0.1, roughness: 0.05, clearcoat: 1, depthWrite: false,
  }), { action: { type: 'menu' }, cast: false }).position.z = 0.012;

  /* ---- lid ---- */
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, H, -D / 2 - 0.02);
  root.add(lidPivot);
  const lid = new THREE.Group();
  lid.position.set(0, 0, D / 2 + 0.02);
  lidPivot.add(lid);
  const lidAction = { type: 'lid' };
  add(lid, extrudeUp(rr(LID_W, LID_D, R + 0.02), LID_H, 0.05, 6), lidMat, { action: lidAction });
  const gShape = rr(W - 0.12, D - 0.12, R - 0.06);
  gShape.holes.push(rr(W - 0.2, D - 0.2, R - 0.1, new THREE.Path()));
  add(lid, extrudeUp(gShape, 0.03, 0), gasketMat, { action: lidAction }).position.y = -0.03;
  add(lidPivot, knuckle(0.8), lidMat, { action: lidAction });
  face('lid', 2.4, T.drawLidTop, (m) => { m.rotation.x = -Math.PI / 2; m.position.set(0, LID_H + 0.002, 0); }, lid, 1.6);

  // Squishy Snack Buddy buttons.
  const BUD = 0.15;
  const pops = POPS.map((p, i) => {
    const g = new THREE.Group();
    g.position.set(POP_POS[i].x, LID_H, POP_POS[i].z);
    lid.add(g);
    const squish = new THREE.Group();
    g.add(squish);
    const shape = new THREE.Shape(outline(p.buddy).map(([x, y]) => new THREE.Vector2(x * BUD, -y * BUD)));
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.02, bevelEnabled: true, bevelThickness: 0.032, bevelSize: 0.026, bevelOffset: -0.026, bevelSegments: 6,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0.032, 0);
    add(squish, geo, new THREE.MeshPhysicalMaterial({
      color: p.color, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.35, sheen: 0.4, sheenColor: new THREE.Color('#ffffff'),
    }), { action: { type: 'pop', i } });
    const faceTex = T.canvasTex(256, 256, T.drawBuddyFace);
    faceTex.redraw(p.buddy);
    const faceM = new THREE.Mesh(new THREE.PlaneGeometry(BUD * 2, BUD * 2).rotateX(-Math.PI / 2), decalMat(faceTex.tex));
    faceM.position.y = 0.0845;
    faceM.userData.action = { type: 'pop', i };
    pickables.push(faceM);
    squish.add(faceM);
    return { squish, s: new Spring(0, 420, 13) };
  });

  // Inside of the lid: today's food + Yum / Hmm.
  const U = T.LID_UNDER;
  const underTex = T.canvasTex(Math.round(U.w * U.px), Math.round(U.h * U.px), T.drawLidUnder);
  add(lid, new THREE.PlaneGeometry(U.w, U.h).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ map: underTex.tex, roughness: 0.55 }), {
    action: { type: 'lidUnder' }, cast: false,
  }).position.y = -0.003;

  const latchPivot = new THREE.Group();
  latchPivot.position.set(0, 0.1, LID_D / 2 + 0.03);
  lid.add(latchPivot);
  const latchAction = { type: 'latch' };
  add(latchPivot, new RoundedBoxGeometry(0.5, 0.34, 0.05, 4, 0.022).translate(0, -0.17, 0), accentMat, { action: latchAction });
  const latchTex = T.canvasTex(240, 160, T.drawLatch);
  latchTex.redraw();
  const latchPrint = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), decalMat(latchTex.tex));
  latchPrint.position.set(0, -0.2, 0.026);
  latchPivot.add(latchPrint);

  /* ---- state ---- */
  const lidS = new Spring(0, 38, 10);
  const latchS = new Spring(0, 140, 15);
  const dialS = new Spring(0, 70, 9);
  const stickerS = new Spring(0, 160, 7);
  const squash = new Spring(1, 260, 11);
  let lidOpen = false;
  let lidPhase = null;
  let lidPhaseT = 0;
  let dialIndex = 0;
  let current = theme;
  let childName = name;
  let hop = null;

  function redrawPrints(th) {
    prints.front.redraw({ theme: th, px: PX, dial: DIAL, sticker: STICKER });
    prints.back.redraw({ theme: th, px: PX });
    cardTex.redraw({ theme: th, name: childName });
    underTex.redraw({ theme: th, name: childName });
    prints.left.redraw({ theme: th, px: PX });
    prints.right.redraw({ theme: th, px: PX });
    prints.lid.redraw({ theme: th, px: PX, pops: POP_POS });
    dialTex.redraw(th);
    coverTex.redraw(th);
    stickerTex.redraw({ name: childName, theme: th });
  }

  function applyTheme(th) {
    current = th;
    // The tray takes a pale tint of the day's colour so pale foods stand out.
    insertMat.color.set('#FFFFFF').lerp(new THREE.Color(th.body), 0.3);
    redrawPrints(th);
    buildFood(th);
    buildBeads(th);
  }

  applyTheme(theme);

  function setLid(open) {
    if (open === lidOpen) return;
    lidOpen = open;
    if (open) {
      latchS.t = -1.35;
      lidPhase = 'unlatch';
      lidPhaseT = 0.16;
      sfx.click();
    } else {
      lidS.t = 0;
      lidPhase = 'closing';
    }
    onLidChange?.(open);
  }

  function setTheme(th) {
    if (th === current) return;
    const from = [bodyMat, lidMat, accentMat].map((m) => m.color.clone());
    const to = [th.body, th.lid, th.accent].map((c) => new THREE.Color(c));
    hop = { t: 0, from, to, th, swapped: false };
    dialS.t = Math.round(dialS.t / (Math.PI * 2)) * Math.PI * 2 - Math.PI * 2; // one full spin back to item 0
    dialIndex = 0;
    sfx.whoosh();
  }

  function tap(action, hit) {
    const meal = current.meal;
    switch (action.type) {
      case 'dial': {
        dialIndex = (dialIndex + 1) % 6;
        dialS.t -= Math.PI / 3;
        sfx.ratchet();
        const item = current.items[dialIndex];
        say({ speak: item.say, title: item.word, body: item.say.replace(/^[^!]*!\s*/, ''), item });
        break;
      }
      case 'bead': {
        counted = action.i >= counted ? action.i + 1 : action.i;
        beads.forEach((b, j) => { b.s.t = j < counted ? slotRight(j) : slotLeft(j); });
        sfx.clack();
        const text = game.say(counted, action.i);
        if (game.colourMode) say({ speak: text, title: text.replace('!', ''), body: 'Slide them all and say each colour.', color: game.colors[action.i] });
        else say({ speak: text, title: String(counted), body: text.replace(/^[^!]*!\s*/, '') || game.heading, count: counted });
        break;
      }
      case 'pop': {
        const p = POPS[action.i];
        pops[action.i].s.v = 16;
        sfx.pop(p.freq);
        say({ speak: `${p.word}! A ${p.word.toLowerCase()} ${p.shape}.`, title: `${p.word} ${p.shape}`, body: `${p.hindi} · squish them all!`, color: p.color });
        break;
      }
      case 'lid':
      case 'latch':
        setLid(!lidOpen);
        break;
      case 'sticker':
        stickerS.v = 5;
        sfx.pop(880);
        say({ speak: `Hi ${childName}! This box is just for you.`, title: `Hi ${childName}!`, body: 'This box is just for you.', icon: '👋' });
        break;
      case 'food': {
        const f = FOODS[action.key];
        sfx.crunch();
        say({ speak: f.name, title: f.name, body: f.note, icon: f.icon });
        break;
      }
      case 'spread': {
        const s = SPREADS[meal.spread];
        sfx.pop(420);
        say({ speak: s.name, title: s.name, body: 'Every box has a dip: dunk, dab and lick!', icon: '🥣' });
        break;
      }
      case 'menu': {
        const pct = Math.round((meal.n.protein / DAILY.protein) * 100);
        sfx.click();
        say({
          speak: `${meal.name}. ${meal.n.protein} grams of protein, that's ${pct} percent of ${childName}'s day. No added sugar or salt.`,
          title: meal.name, body: `${meal.n.kcal} kcal · ${meal.n.protein}g protein (${pct}% of the day) · 0 added sugar or salt`, icon: '📋',
        });
        break;
      }
      case 'lidUnder': {
        const hero = current.hero;
        const px = (hit?.uv?.x ?? 0) * U.w * U.px;
        const py = (1 - (hit?.uv?.y ?? 0)) * U.h * U.px;
        const inBox = ([x, y, w, h]) => px >= x && px <= x + w && py >= y && py <= y + h;
        if (inBox(T.YUM_BOX)) {
          sfx.pop(988);
          say({ speak: `Yum! ${childName} loves ${hero.name.toLowerCase()}!`, title: 'Yum!', body: `Noted: ${childName} loves ${hero.name.toLowerCase()}. We'll pack it again.`, icon: '😋' });
        } else if (inBox(T.HMM_BOX)) {
          sfx.pop(330);
          say({ speak: `Hmm, not today? That's okay!`, title: 'Hmm, not today', body: `We'll offer a swap for ${hero.name.toLowerCase()} in ${childName}'s next box.`, icon: '🤔' });
        } else {
          say({ speak: hero.say, title: hero.name, body: hero.facts.join(' · '), icon: hero.pic });
        }
        break;
      }
      default:
    }
  }

  function hoverLabel(action) {
    switch (action.type) {
      case 'dial': return 'Spin the picture wheel';
      case 'bead': return game.heading;
      case 'pop': return `Squish the ${POPS[action.i].word.toLowerCase()} ${POPS[action.i].shape}`;
      case 'lid':
      case 'latch': return lidOpen ? 'Close the lid' : 'Open the lid';
      case 'sticker': return `${childName}'s name sticker`;
      case 'food': return FOODS[action.key].name;
      case 'spread': return SPREADS[current.meal.spread].name;
      case 'menu': return "Today's menu & nutrition";
      case 'lidUnder': return "Meet today's food";
      default: return null;
    }
  }

  function update(dt) {
    if (lidPhase === 'unlatch') {
      lidPhaseT -= dt;
      if (lidPhaseT <= 0) {
        lidS.t = LID_OPEN;
        lidPhase = null;
        sfx.lid(true);
      }
    } else if (lidPhase === 'closing' && lidS.x > -0.1) {
      latchS.t = 0;
      lidPhase = null;
      sfx.lid(false);
      squash.v = -0.6;
    }
    lidS.step(dt);
    latchS.step(dt);
    dialS.step(dt);
    stickerS.step(dt);
    squash.step(dt);
    lidPivot.rotation.x = Math.max(lidS.x, LID_OPEN - 0.08);
    latchPivot.rotation.x = latchS.x;
    spinner.rotation.z = dialS.x;
    sticker.rotation.z = stickerS.x * 0.06;
    beads.forEach((b) => { b.s.step(dt); b.g.position.z = b.s.x; });
    pops.forEach((p) => {
      p.s.step(dt);
      const c = THREE.MathUtils.clamp(p.s.x, -0.25, 0.8);
      p.squish.scale.set(1 + c * 0.14, 1 - c * 0.6, 1 + c * 0.14);
    });

    // Day change: the old box hops out and the new one lands.
    let y = 0;
    if (hop) {
      hop.t += dt;
      const T1 = 0.62;
      const k = Math.min(hop.t / T1, 1);
      y = 4 * 0.42 * k * (1 - k);
      const ck = THREE.MathUtils.smoothstep(k, 0.2, 0.6);
      [bodyMat, lidMat, accentMat].forEach((m, i) => m.color.copy(hop.from[i]).lerp(hop.to[i], ck));
      if (!hop.swapped && k >= 0.42) {
        hop.swapped = true;
        applyTheme(hop.th);
      }
      if (k >= 1) {
        hop = null;
        squash.v = -1.4;
        sfx.lid(false);
      }
    }
    root.position.y = y;
    const sq = squash.x;
    root.scale.set(1 + (1 - sq) * 0.5, sq, 1 + (1 - sq) * 0.5);
    return y;
  }

  return {
    root,
    pickables,
    tap,
    hoverLabel,
    update,
    setTheme,
    setLid,
    get lidOpen() { return lidOpen; },
    get theme() { return current; },
    setName(n) {
      childName = n || 'Aarav';
      stickerTex.redraw({ name: childName, theme: current });
      cardTex.redraw({ theme: current, name: childName });
      underTex.redraw({ theme: current, name: childName });
    },
  };
}

/* ------------------------------------------------------------------ food -- */

function makeFoodKinds(grain) {
  const bumpy = (color, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.88, bumpMap: grain, bumpScale: 1.2, ...extra });
  const juicy = (color, emissive) =>
    new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.3, emissive, emissiveIntensity: 0.08 });

  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.048 : 0.095;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const starGeo = new THREE.ExtrudeGeometry(starShape, {
    depth: 0.022, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.014, bevelOffset: -0.004, bevelSegments: 3,
  });
  starGeo.rotateX(-Math.PI / 2);
  starGeo.center();

  // Makhana: lumpy puffs with toasty brown patches (vertex colours).
  const mkGeo = new THREE.IcosahedronGeometry(0.058, 3);
  {
    const p = mkGeo.attributes.position;
    const col = new Float32Array(p.count * 3);
    const cream = new THREE.Color('#F3EAD8');
    const brown = new THREE.Color('#B07A48');
    const v = new THREE.Vector3();
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = Math.sin(v.x * 71) * Math.sin(v.y * 63 + 1.3) * Math.sin(v.z * 83 + 2.1);
      v.multiplyScalar(1 + 0.13 * n);
      v.y *= 0.86;
      p.setXYZ(i, v.x, v.y, v.z);
      const spot = THREE.MathUtils.smoothstep(Math.sin(v.x * 40 + 3) * Math.cos(v.z * 37) + Math.sin(v.y * 45), 0.9, 1.6);
      c.copy(cream).lerp(brown, spot * 0.85);
      col.set([c.r, c.g, c.b], i * 3);
    }
    mkGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    mkGeo.computeVertexNormals();
  }

  const squashed = (r, sy, w = 32, h = 16) => new THREE.SphereGeometry(r, w, h).scale(1, sy, 1);
  // Pancake: a disc with soft rounded rims.
  const pancakeGeo = new THREE.LatheGeometry(
    [[0, -0.015], [0.066, -0.015], [0.075, -0.008], [0.077, 0.002], [0.072, 0.012], [0.06, 0.016], [0, 0.017]].map(([x, y]) => new THREE.Vector2(x, y)),
    40,
  );
  pancakeGeo.computeVertexNormals();

  // Banana coin: pale flesh faces with a seedy centre.
  const coinTex = T.canvasTex(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#E9D9A0');
    g.addColorStop(0.35, '#F7EDC4');
    g.addColorStop(0.92, '#F4E3A6');
    g.addColorStop(1, '#D8C27A');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#9C8350';
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(w / 2 + Math.cos(a) * 10, h / 2 + Math.sin(a) * 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  coinTex.redraw();
  const coinFace = new THREE.MeshStandardMaterial({ map: coinTex.tex, roughness: 0.55 });
  const coinSide = new THREE.MeshStandardMaterial({ color: '#EFE0A8', roughness: 0.6 });

  // Cucumber finger: dark skin on top, pale seedy flesh elsewhere.
  const skin = new THREE.MeshStandardMaterial({ color: '#3E7A2C', roughness: 0.45 });
  const flesh = new THREE.MeshStandardMaterial({ color: '#D9EDB4', roughness: 0.5 });

  const cube = (s, r = 0.018) => new RoundedBoxGeometry(s, s * 0.9, s, 3, r);

  return {
    idli: { geo: squashed(0.1, 0.5, 40, 20), mat: bumpy('#EFE6D0', { bumpScale: 2.2, roughness: 0.9 }), foot: 0.1, thick: 0.1, fill: 3.4, tilt: 0.3, scale: [0.9, 1.05] },
    paneer: { geo: new RoundedBoxGeometry(0.095, 0.08, 0.095, 2, 0.012), mat: bumpy('#FFF1D2', { bumpScale: 0.8, roughness: 0.75 }), foot: 0.062, thick: 0.08, fill: 4.2, tilt: 0.7, scale: [0.9, 1.1] },
    pancakeRagi: { geo: pancakeGeo, mat: bumpy('#7C4B31'), foot: 0.075, thick: 0.032, fill: 6, tilt: 0.35, scale: [0.9, 1.1] },
    pancakeOat: { geo: pancakeGeo, mat: bumpy('#D9A15A'), foot: 0.075, thick: 0.032, fill: 6, tilt: 0.35, scale: [0.9, 1.1] },
    chilla: { geo: new THREE.CapsuleGeometry(0.036, 0.12, 6, 16).rotateZ(Math.PI / 2), mat: bumpy('#E2BE4A'), foot: 0.08, thick: 0.072, fill: 3.8, tilt: 0.2, scale: [0.9, 1.1] },
    sweetPotato: { geo: cube(0.085), mat: bumpy('#EC8A3B', { roughness: 0.6, bumpScale: 0.6 }), foot: 0.056, thick: 0.08, fill: 4.4, tilt: 0.8, scale: [0.85, 1.1] },
    mango: { geo: cube(0.095, 0.022), mat: juicy('#FFB21A', '#FF7A00'), foot: 0.06, thick: 0.085, fill: 4.4, tilt: 0.8, scale: [0.85, 1.1] },
    papaya: { geo: cube(0.09, 0.02), mat: juicy('#FF8544', '#FF5A00'), foot: 0.058, thick: 0.08, fill: 4.4, tilt: 0.8, scale: [0.85, 1.1] },
    apple: { geo: cube(0.08, 0.018), mat: juicy('#F1DFA6', '#C9A040'), foot: 0.052, thick: 0.072, fill: 4.6, tilt: 0.8, scale: [0.85, 1.1] },
    beetroot: { geo: cube(0.08, 0.02), mat: juicy('#8E1D46', '#5A0020'), foot: 0.052, thick: 0.072, fill: 4.4, tilt: 0.8, scale: [0.85, 1.1] },
    banana: { geo: new THREE.CylinderGeometry(0.055, 0.055, 0.024, 28), mat: [coinSide, coinFace, coinFace], foot: 0.056, thick: 0.026, fill: 6.5, tilt: 0.7, scale: [0.9, 1.08] },
    carrot: { geo: new THREE.BoxGeometry(0.009, 0.006, 0.075), mat: juicy('#FF7A1A', '#FF4A00'), foot: 0.03, thick: 0.011, fill: 16, tilt: 0.6, scale: [0.8, 1.2], maxH: 0.26 },
    cucumber: { geo: new THREE.BoxGeometry(0.034, 0.034, 0.15), mat: [flesh, flesh, skin, flesh, flesh, flesh], foot: 0.065, thick: 0.036, fill: 4.8, tilt: 0.25, scale: [0.9, 1.1] },
    makhana: { geo: mkGeo, mat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }), foot: 0.055, thick: 0.09, fill: 4.8, tilt: 3, scale: [0.8, 1.15] },
    ragiStars: { geo: starGeo, mat: bumpy('#8A5233'), foot: 0.09, thick: 0.046, fill: 5.5, tilt: 0.5, scale: [0.9, 1.1] },
    bananaBites: { geo: squashed(0.068, 0.44), mat: bumpy('#D4A05E'), foot: 0.068, thick: 0.06, fill: 4.8, tilt: 0.4, scale: [0.9, 1.1] },
  };
}

// Beads for each day's game. Every bead sits on the rod (z axis) and faces +x.
function makeBeadParts(grain) {
  const gloss = (color) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
  const black = new THREE.MeshStandardMaterial({ color: '#1E1E24', roughness: 0.3 });
  const white = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.3 });
  const sphere = new THREE.SphereGeometry(0.075, 32, 20);
  const bead = new THREE.SphereGeometry(0.085, 36, 24).scale(1, 1, 0.72);
  const beak = new THREE.ConeGeometry(0.026, 0.05, 16).rotateZ(-Math.PI / 2);
  const eyeW = new THREE.SphereGeometry(0.019, 12, 8);
  const eyeB = new THREE.SphereGeometry(0.01, 10, 6);
  const leaf = new THREE.SphereGeometry(0.03, 12, 8).scale(1.4, 0.35, 0.7);
  const cube = new RoundedBoxGeometry(0.115, 0.115, 0.115, 3, 0.024);
  const tyre = new THREE.TorusGeometry(0.056, 0.028, 16, 36);
  const hub = new THREE.CylinderGeometry(0.036, 0.036, 0.03, 20).rotateX(Math.PI / 2);
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.034 : 0.078;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const star = new THREE.ExtrudeGeometry(starShape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelOffset: -0.004, bevelSegments: 3 });
  star.center();
  star.rotateY(Math.PI / 2);
  const orangeMat = new THREE.MeshPhysicalMaterial({ color: '#FF9A2E', roughness: 0.55, bumpMap: grain, bumpScale: 2, clearcoat: 0.3 });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#3DAA4A', roughness: 0.5 });
  const hubMat = gloss('#FFD23F');

  const mesh = (g, geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };

  return {
    build(kind, color, i) {
      const g = new THREE.Group();
      switch (kind) {
        case 'duck':
          mesh(g, sphere, gloss(color));
          mesh(g, beak, gloss('#FF8A1F'), 0.085, -0.008, 0);
          for (const z of [-0.028, 0.028]) {
            mesh(g, eyeW, white, 0.062, 0.028, z);
            mesh(g, eyeB, black, 0.078, 0.03, z);
          }
          break;
        case 'orange':
          mesh(g, sphere, orangeMat);
          mesh(g, leaf, leafMat, 0.01, 0.075, 0.012).rotation.z = 0.3;
          break;
        case 'cube':
          mesh(g, cube, gloss(color));
          break;
        case 'wheel':
          mesh(g, tyre, new THREE.MeshStandardMaterial({ color, roughness: 0.75 }));
          mesh(g, hub, hubMat);
          break;
        case 'star':
          mesh(g, star, gloss(color)).rotation.x = i * 0.35;
          break;
        default:
          mesh(g, bead, gloss(color));
      }
      return g;
    },
  };
}

function makeTub() {
  const group = new THREE.Group();
  const pts = [
    [0, 0], [0.235, 0], [0.248, 0.012], [0.272, 0.19], [0.292, 0.198], [0.292, 0.214], [0.27, 0.214], [0.25, 0.03], [0, 0.03],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const cupMat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.28, clearcoat: 0.5 });
  const bandMat = new THREE.MeshPhysicalMaterial({ color: '#C98F4E', roughness: 0.35, clearcoat: 0.5 });
  const cup = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), cupMat);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.267, 0.257, 0.07, 64, 1, true), bandMat);
  band.position.y = 0.1;
  const labelTex = T.canvasTex(512, 512, T.drawTubLabel);
  const foil = new THREE.Mesh(
    new THREE.CircleGeometry(0.292, 64).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: labelTex.tex, metalness: 0.35, roughness: 0.38 }),
  );
  foil.position.y = 0.2155;
  const tab = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.006, 0.07, 2, 0.003), new THREE.MeshStandardMaterial({ color: '#D9DDE3', metalness: 0.5, roughness: 0.35 }));
  tab.position.set(0.3, 0.216, 0.05);
  tab.rotation.y = -0.3;
  const meshes = [cup, band, foil, tab];
  meshes.forEach((m) => { m.castShadow = true; m.receiveShadow = true; group.add(m); });
  return {
    group,
    meshes,
    setSpread(s) {
      bandMat.color.set(s.color);
      labelTex.redraw(s);
    },
  };
}
