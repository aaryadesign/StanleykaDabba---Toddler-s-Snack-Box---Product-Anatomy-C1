// The real 3D box, dropped into the hero of the app's "Box for tomorrow"
// screen in place of the food photo.
//
//   1. It falls in from above and bounces to a stop.
//   2. Closed, it waits: every couple of seconds it shakes and the lid rattles,
//      like something inside wants out. A bubble says "Tap to open".
//   3. Tapped: it unlatches, the lid swings up with a burst of confetti, the
//      camera leans in to look inside, and each compartment pops to life in
//      turn with its count tag.
//   4. Tap a tag (or the food itself) to glide into that compartment. A card
//      shows how much is in it and which ingredients it's made from.
//
// Drag to turn, pinch or scroll (once touched) to zoom, two fingers to move.
// It stays wherever you leave it so you can read; only if it ends up out of
// the frame does it glide back.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createBox } from '../src/box.js';
import { DAYS } from '../src/themes.js';
import * as T from '../src/textures.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const quiet = new Proxy({}, { get: () => () => {} }); // no sounds inside the app screen

export async function mountBoxStage({ hero, stage, canvas, tags, cta, card, reset, hint, portions, order, ingredients }) {
  await Promise.race([
    Promise.all(['500', '600', '700'].map((w) => document.fonts.load(`${w} 40px Fredoka`))),
    new Promise((r) => setTimeout(r, 2500)),
  ]);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  T.setMaxAniso(renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.8;
  pmrem.dispose();

  const key = new THREE.DirectionalLight('#FFF6EA', 2.1);
  key.position.set(-3.2, 6.5, 4.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 16 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.015;
  key.shadow.radius = 5;
  scene.add(key);
  scene.add(new THREE.HemisphereLight('#FFFFFF', '#BFD9F0', 0.55));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ color: '#0C426E', opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const contactTex = T.canvasTex(512, 384, T.drawContactShadow);
  contactTex.redraw();
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(3.9, 2.9),
    new THREE.MeshBasicMaterial({ map: contactTex.tex, transparent: true, opacity: 0.45, depthWrite: false, color: '#9FC4E6' }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.002;
  scene.add(contact);

  const theme = DAYS.find((d) => d.key === 'tue');
  const box = createBox({
    theme,
    name: 'Aarav',
    sfx: quiet,
    portions,
    openTub: true,
    say: () => {},
    onFoodTap: (k) => focus(k),
  });
  const rig = new THREE.Group(); // drop, bounce, shakes and landing squash live here
  rig.add(box.root);
  scene.add(rig);

  /* ---- confetti, for the moment the lid pops ---- */
  const CONF = 44;
  const confetti = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.075, 0.012, 0.045),
    new THREE.MeshStandardMaterial({ roughness: 0.5 }),
    CONF,
  );
  confetti.frustumCulled = false;
  confetti.visible = false;
  scene.add(confetti);
  const bits = Array.from({ length: CONF }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3() }));
  const confColors = ['#FF6A00', '#FFD864', '#0058D1', '#FD9BEB', '#85E087', '#7EBDF1', '#FF5951'];
  const cc = new THREE.Color();
  bits.forEach((_, i) => confetti.setColorAt(i, cc.set(confColors[i % confColors.length])));
  let confT = -1;
  function burst() {
    if (REDUCED) return;
    confT = 0;
    confetti.visible = true;
    bits.forEach((b) => {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.6 + Math.random() * 1.5;
      b.p.set((Math.random() - 0.5) * 1.6, 0.9, (Math.random() - 0.5) * 1.1);
      b.v.set(Math.cos(a) * sp, 3.2 + Math.random() * 1.8, Math.sin(a) * sp);
      b.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      b.w.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16);
    });
  }
  const cm = new THREE.Matrix4();
  const cq = new THREE.Quaternion();
  const cs = new THREE.Vector3();
  function stepConfetti(dt) {
    if (confT < 0) return;
    confT += dt;
    const LIFE = 1.7;
    bits.forEach((b, i) => {
      b.v.y -= 7.5 * dt;
      b.v.multiplyScalar(1 - 1.2 * dt); // air drag, so they flutter
      b.p.addScaledVector(b.v, dt);
      b.r.x += b.w.x * dt; b.r.y += b.w.y * dt; b.r.z += b.w.z * dt;
      cs.setScalar(Math.max(0, Math.min(1, (LIFE - confT) / 0.4)));
      confetti.setMatrixAt(i, cm.compose(b.p, cq.setFromEuler(b.r), cs));
    });
    confetti.instanceMatrix.needsUpdate = true;
    if (confT > LIFE) { confT = -1; confetti.visible = false; }
  }

  /* ---- camera ---- */
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.enableZoom = true;
  controls.zoomToCursor = true;
  controls.zoomSpeed = 0.9;
  controls.maxPolarAngle = 1.5;
  controls.rotateSpeed = 0.75;

  const V = (p, t) => ({ pos: new THREE.Vector3(...p), target: new THREE.Vector3(...t) });
  const CLOSED = V([2.45, 2.3, 4.85], [0, 0.5, 0]); // three-quarter view: the closed box, name sticker and prints
  const REST = V([0.36, 4.5, 3.5], [0.04, 0.3, 0.02]); // looking down into the open box
  const PEEK = V([0.3, 3.3, 2.55], [0.04, 0.25, 0.1]); // leaning in right after it opens
  // How far below the middle the box sits, per view (under the hero text, or above the card).
  const LIFTS = { closed: 0.24, rest: 0.23, focus: -0.13 };
  let lift = LIFTS.closed;
  let liftTo = lift;
  let fit = 1;
  const fitted = (v) => v.pos.clone().sub(v.target).multiplyScalar(fit).add(v.target);
  const restDist = () => fitted(REST).distanceTo(REST.target);

  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    fit = THREE.MathUtils.clamp(1.62 / camera.aspect, 1, 2.2);
    controls.minDistance = restDist() * 0.3; // close enough to read the name sticker
    controls.maxDistance = restDist() * 1.6;
    applyLift();
  }
  function applyLift() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    camera.setViewOffset(w, h, 0, -h * lift, w, h);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  /* ---- state ---- */
  let t = 0;
  let mode = 'drop'; // drop → closed → opening → rest ⇄ user / focus → returning → rest
  let fly = null;
  let dragging = false;
  let outFor = 0;
  let swayT = 0;
  let openT = 0;
  let nextShake = 0;
  let shakeT = -1;
  let focusKey = null;
  const drop = { y: 3, v: 0, bounces: 0 };
  const sq = { x: 1, v: 0 };
  const revealed = new Set();
  const flight = (v, dur, liftKey) => {
    fly = { t: 0, dur, p0: camera.position.clone(), t0: controls.target.clone(), p1: v.pos ? fitted(v) : v.p, t1: (v.target || v.t).clone() };
    liftTo = LIFTS[liftKey];
  };

  function setExploring(on) {
    hero.classList.toggle('exploring', on);
    reset.hidden = !(on && mode === 'user');
  }

  function replay() {
    t = 0;
    mode = REDUCED ? 'closed' : 'drop';
    fly = null;
    focusKey = null;
    card.classList.remove('show');
    setExploring(false);
    hero.classList.remove('opened');
    stage.classList.remove('touched');
    box.setLid(false);
    box.hideFood();
    revealed.clear();
    Object.values(tagEls).forEach((el) => el.classList.remove('in'));
    drop.y = REDUCED ? 0 : 3;
    drop.v = 0;
    drop.bounces = 0;
    lift = liftTo = LIFTS.closed;
    applyLift();
    camera.position.copy(fitted(CLOSED));
    controls.target.copy(CLOSED.target);
    cta.classList.remove('in');
    if (REDUCED) cta.classList.add('in');
    nextShake = REDUCED ? Infinity : 1.4;
  }

  // Tapped: unlatch, lid up, confetti, lean in, then the food pops to life.
  function open() {
    if (mode !== 'closed' && mode !== 'drop') return;
    mode = 'opening';
    openT = 0;
    drop.y = 0;
    shakeT = -1;
    cta.classList.remove('in');
    hero.classList.add('opened');
    stage.classList.add('touched');
    box.setLid(true);
    sq.v = -2.2; // a little jump as the latch lets go
    if (REDUCED) {
      order.forEach((k) => { box.revealFood(k, true); revealed.add(k); tagEls[k].classList.add('in'); });
      mode = 'rest';
      camera.position.copy(fitted(REST));
      controls.target.copy(REST.target);
      lift = liftTo = LIFTS.rest;
      applyLift();
    }
  }
  cta.addEventListener('click', open);

  function goHome() {
    mode = 'returning';
    focusKey = null;
    card.classList.remove('show');
    flight(REST, 1.1, 'rest');
    setExploring(false);
  }
  reset.addEventListener('click', goHome);

  /* ---- count tags, sitting right on each compartment ---- */
  const tagEls = {};
  const count = (k) => {
    const p = portions[k];
    return typeof p.qty === 'function' ? p.qty(box.counts[k]) : p.qty;
  };
  order.forEach((k) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'tag';
    el.innerHTML = '<b></b><span></span>';
    el.querySelector('b').textContent = count(k);
    el.querySelector('span').textContent = portions[k].short;
    el.setAttribute('aria-label', `${count(k)} ${portions[k].name}. Show what's in it.`);
    el.addEventListener('click', () => focus(k));
    tags.append(el);
    tagEls[k] = el;
  });

  /* ---- focus card: how much, and what it's made of ---- */
  const cardTitle = card.querySelector('.tb-card-title');
  const cardNote = card.querySelector('.tb-card-note');
  const cardMade = card.querySelector('.tb-card-made');
  const cardStep = card.querySelector('.tb-card-step');
  card.querySelector('[data-close]').addEventListener('click', goHome);
  card.querySelector('[data-prev]').addEventListener('click', () => focus(order[(order.indexOf(focusKey) + order.length - 1) % order.length]));
  card.querySelector('[data-next]').addEventListener('click', () => focus(order[(order.indexOf(focusKey) + 1) % order.length]));

  const dirFocus = new THREE.Vector3(0.1, 1, 0.62).normalize(); // a little more top-down than the overview
  const fv = new THREE.Vector3();
  function focus(k) {
    if (!revealed.has(k) || !box.lidOpen) return;
    const p = portions[k];
    focusKey = k;
    mode = 'focus';
    box.root.localToWorld(fv.copy(box.anchors[k]));
    const target = fv.clone();
    target.y -= 0.08;
    const pos = target.clone().addScaledVector(dirFocus, restDist() * p.zoom);
    flight({ p: pos, t: target }, 0.9, 'focus');
    setExploring(true);
    setTimeout(() => box.hopFood(k), REDUCED ? 0 : 700);

    cardTitle.textContent = `${count(k)} ${p.name}`;
    cardNote.textContent = p.note;
    cardMade.replaceChildren(...p.made.map((i) => {
      const src = ingredients[i];
      const li = document.createElement('li');
      li.innerHTML = `<span class="ingredient-icon ingredient-${i}"><img alt=""></span>`;
      li.querySelector('img').src = src.icon;
      li.append(src.name);
      return li;
    }));
    cardStep.textContent = `${order.indexOf(k) + 1} of ${order.length}`;
    card.classList.remove('show');
    void card.offsetWidth;
    card.classList.add('show');
  }

  const v3 = new THREE.Vector3();
  const toCam = new THREE.Vector3();
  function placeTags() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    toCam.copy(camera.position).sub(controls.target).normalize();
    const near = camera.position.distanceTo(controls.target) < restDist() * 0.62;
    // Tags step aside while you're in close, looking from the side, or reading a card.
    const hide = toCam.y < 0.45 || !box.lidOpen || near || mode === 'focus' || mode === 'opening' && openT < 0.5;
    tags.classList.toggle('hidden', hide);
    const pts = order.map((k) => {
      box.root.localToWorld(v3.copy(box.anchors[k])).project(camera);
      const el = tagEls[k];
      return { el, x: (v3.x * 0.5 + 0.5) * w, y: (-v3.y * 0.5 + 0.5) * h, w: el.offsetWidth + 4, h: el.offsetHeight + 4 };
    });
    // Nudge apart any tags that would overlap (e.g. when the box is turned).
    for (let it = 0; it < 4; it++) {
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          const ox = (a.w + b.w) / 2 - Math.abs(a.x - b.x);
          const oy = (a.h + b.h) / 2 - Math.abs(a.y - b.y);
          if (ox <= 0 || oy <= 0) continue;
          if (ox < oy) { const d = (ox / 2) * Math.sign(b.x - a.x || 1); a.x -= d; b.x += d; }
          else { const d = (oy / 2) * Math.sign(b.y - a.y || 1); a.y -= d; b.y += d; }
        }
      }
    }
    pts.forEach((p) => { p.el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`; });
  }

  // The "Tap to open" bubble floats just above the closed lid.
  const lidTop = new THREE.Vector3(0, 1.02, 0.2);
  function placeCta() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    rig.localToWorld(v3.copy(lidTop)).project(camera);
    cta.style.left = `${((v3.x * 0.5 + 0.5) * w).toFixed(1)}px`;
    cta.style.top = `${((-v3.y * 0.5 + 0.5) * h).toFixed(1)}px`;
  }

  // How much of the frame the box still covers. Near 0 means it has been
  // dragged, panned or zoomed out of view.
  const bodyBox = new THREE.Box3(new THREE.Vector3(-1.32, 0, -0.92), new THREE.Vector3(1.32, 0.84, 0.92));
  const corner = new THREE.Vector3();
  function inFrame() {
    let x0 = Infinity; let x1 = -Infinity; let y0 = Infinity; let y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? bodyBox.max.x : bodyBox.min.x, i & 2 ? bodyBox.max.y : bodyBox.min.y, i & 4 ? bodyBox.max.z : bodyBox.min.z);
      box.root.localToWorld(corner).project(camera);
      if (corner.z > 1) return 0; // behind the camera
      x0 = Math.min(x0, corner.x); x1 = Math.max(x1, corner.x);
      y0 = Math.min(y0, corner.y); y1 = Math.max(y1, corner.y);
    }
    const ox = Math.max(0, Math.min(x1, 1) - Math.max(x0, -1));
    const oy = Math.max(0, Math.min(y1, 1) - Math.max(y0, -1));
    const boxArea = (x1 - x0) * (y1 - y0);
    return (ox * oy) / Math.min(boxArea, 4);
  }

  /* ---- input ---- */
  const free = () => mode === 'rest' || mode === 'user' || mode === 'focus' || mode === 'returning';
  // Only an actual drag (not a tap) counts as taking over the camera.
  let press = null;
  controls.addEventListener('start', () => { dragging = true; });
  controls.addEventListener('end', () => { dragging = false; });
  canvas.addEventListener('pointerdown', (e) => { press = { x: e.clientX, y: e.clientY }; });
  addEventListener('pointerup', () => { press = null; });
  canvas.addEventListener('pointermove', (e) => {
    if (!press || Math.hypot(e.clientX - press.x, e.clientY - press.y) < 6) return;
    press = null;
    stage.classList.add('touched');
    if (!free()) return; // turning the closed box is fine; it just keeps waiting
    fly = null;
    if (mode !== 'focus') { mode = 'user'; setExploring(true); }
  });

  // The wheel zooms only once the box has been touched, so scrolling the
  // screen past it still scrolls.
  let engaged = false;
  canvas.addEventListener('pointerdown', () => { engaged = true; });
  stage.addEventListener('pointerleave', () => { engaged = false; });
  stage.addEventListener('wheel', (e) => {
    if (!engaged && !e.ctrlKey) { e.stopPropagation(); return; }
    if (mode === 'rest' || mode === 'returning') { mode = 'user'; fly = null; setExploring(true); }
  }, { capture: true });

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 6) return;
    // Closed: a tap anywhere on the box opens it.
    if (mode === 'closed' || mode === 'drop') { open(); return; }
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(box.pickables, false)[0];
    const action = hit?.object.userData.action;
    if (action && ['food', 'spread', 'pop', 'sticker', 'dial'].includes(action.type)) box.tap(action, hit);
  });

  /* ---- loop ---- */
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
  const clock = new THREE.Clock();
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);

  replay();

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    if (!visible) return;
    t += dt;

    // 1. Fall in and bounce to a stop, squashing on each landing.
    if (mode === 'drop') {
      drop.v -= 18 * dt;
      drop.y += drop.v * dt;
      if (drop.y <= 0) {
        drop.y = 0;
        const impact = -drop.v;
        sq.v = -Math.min(4, impact * 0.55);
        drop.bounces++;
        if (impact > 1.6 && drop.bounces < 4) drop.v = impact * 0.36;
        else {
          drop.v = 0;
          mode = 'closed';
          nextShake = t + 0.9;
          setTimeout(() => { if (mode === 'closed') cta.classList.add('in'); }, 350);
        }
      }
    }
    // Sub-step the squash spring so slow frames can't make it blow up.
    for (let i = 0, n = Math.max(3, Math.ceil(dt / 0.008)), h = dt / n; i < n; i++) {
      sq.v += ((1 - sq.x) * 260 - sq.v * 12) * h;
      sq.x += sq.v * h;
    }

    // 2. Closed and waiting: a shake every so often, like something inside wants out.
    let wob = 0;
    let hopY = 0;
    if (mode === 'closed' && t > nextShake) {
      shakeT = 0;
      nextShake = t + 2.4 + Math.random() * 0.8;
      box.rattle();
      cta.classList.remove('nudge');
      void cta.offsetWidth;
      cta.classList.add('nudge');
    }
    if (shakeT >= 0) {
      shakeT += dt;
      const k = shakeT / 0.55;
      if (k >= 1) shakeT = -1;
      else {
        wob = Math.sin(shakeT * 40) * 0.05 * (1 - k);
        hopY = Math.sin(Math.PI * Math.min(1, k * 2)) * 0.05;
        if (Math.abs(shakeT - 0.25) < dt) box.rattle(0.7);
      }
    }
    rig.position.y = drop.y + hopY;
    rig.rotation.z = wob;
    rig.scale.set(1 + (1 - sq.x) * 0.45, sq.x, 1 + (1 - sq.x) * 0.45);

    // 3. Opening: confetti, lean in, then pop each compartment to life.
    if (mode === 'opening') {
      openT += dt;
      if (openT > 0.12 && !fly && openT < 0.3) { flight(PEEK, 1.25, 'rest'); setExploring(true); }
      if (openT > 0.32 && confT < 0 && openT < 0.5) burst();
      order.forEach((k, i) => {
        if (!revealed.has(k) && openT > 0.6 + i * 0.17) {
          revealed.add(k);
          box.revealFood(k);
          tagEls[k].style.setProperty('--d', '0ms');
          tagEls[k].classList.add('in');
        }
      });
      if (openT > 1.75 && openT - dt <= 1.75) { flight(REST, 1.1, 'rest'); setExploring(false); }
      if (openT > 2.9) { mode = 'rest'; swayT = 0; }
    }

    // Left out of the frame? Glide back.
    if ((mode === 'user' || mode === 'focus') && !dragging && !fly) {
      outFor = inFrame() < 0.18 ? outFor + dt : 0;
      if (outFor > 0.35) { outFor = 0; goHome(); }
    }

    // The frame's framing point eases between views too.
    if (Math.abs(lift - liftTo) > 1e-4) {
      lift += (liftTo - lift) * Math.min(1, dt * 4.5);
      applyLift();
    }

    if (fly) {
      fly.t += dt / fly.dur;
      const k = ease(Math.min(fly.t, 1));
      camera.position.lerpVectors(fly.p0, fly.p1, k);
      controls.target.lerpVectors(fly.t0, fly.t1, k);
      if (fly.t >= 1) {
        fly = null;
        if (mode === 'returning') { mode = 'rest'; swayT = 0; }
      }
    } else if ((mode === 'rest' || mode === 'closed') && !REDUCED && !dragging) {
      // A slow, small sway so the box never looks like a still image.
      swayT += dt;
      const v = mode === 'rest' ? REST : CLOSED;
      const a = Math.sin(swayT * 0.45) * (mode === 'rest' ? 0.1 : 0.14);
      const p = fitted(v).sub(v.target);
      if (mode === 'closed' && stage.classList.contains('touched')) swayT -= dt; // turned by hand: leave it be
      else {
        camera.position.copy(p.applyAxisAngle(THREE.Object3D.DEFAULT_UP, a).add(v.target));
        controls.target.copy(v.target);
      }
    }

    box.update(dt);
    stepConfetti(dt);
    contact.material.opacity = 0.45 * Math.max(0, 1 - rig.position.y * 0.8);
    contact.scale.setScalar(1 + rig.position.y * 0.3);
    controls.update();
    placeTags();
    if (mode === 'closed' || mode === 'drop') placeCta();
    renderer.render(scene, camera);
  });

  return { replay, focus, open };
}
