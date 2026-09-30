import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createBox } from './box.js';
import { DAYS, todayIndex, C } from './themes.js';
import * as sfx from './audio.js';
import * as T from './textures.js';

const $ = (id) => document.getElementById(id);

// Canvas prints need the brand font before they're drawn.
await Promise.race([
  Promise.all(['500', '600', '700'].map((w) => document.fonts.load(`${w} 40px Fredoka`))),
  new Promise((r) => setTimeout(r, 3000)),
]);

/* ------------------------------------------------------------ renderer -- */
const canvas = $('scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (err) {
  $('fallback').hidden = false;
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
T.setMaxAniso(renderer.capabilities.getMaxAnisotropy());

const scene = new THREE.Scene();
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;
  pmrem.dispose();
}

const key = new THREE.DirectionalLight('#FFF3E4', 2.1);
key.position.set(-3.2, 6.5, 4.2);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 16 });
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.015;
key.shadow.radius = 5;
scene.add(key);
scene.add(new THREE.HemisphereLight('#FFFFFF', '#F2D2AE', 0.55));
const rim = new THREE.DirectionalLight('#DDEBFF', 0.6);
rim.position.set(4, 3, -5);
scene.add(rim);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ color: '#5A3A1C', opacity: 0.16 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const contactTex = T.canvasTex(512, 384, T.drawContactShadow);
contactTex.redraw();
const contact = new THREE.Mesh(
  new THREE.PlaneGeometry(3.9, 2.9),
  new THREE.MeshBasicMaterial({ map: contactTex.tex, transparent: true, opacity: 0.5, depthWrite: false, color: '#ffffff' }),
);
contact.rotation.x = -Math.PI / 2;
contact.position.y = 0.002;
scene.add(contact);

/* ----------------------------------------------------------------- box -- */
let dayIndex = todayIndex();
let childName = 'Aarav';

const box = createBox({
  theme: DAYS[dayIndex],
  name: childName,
  sfx,
  say: showSay,
  onLidChange: (open) => {
    $('btn-lid').textContent = open ? 'Close lid' : 'Open lid';
    $('btn-lid').setAttribute('aria-pressed', String(open));
  },
});
scene.add(box.root);

/* -------------------------------------------------------------- camera -- */
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 2.4;
controls.maxDistance = 24;
controls.maxPolarAngle = 1.5;
controls.rotateSpeed = 0.8;

const VIEWS = {
  hero: { pos: [3.5, 2.8, 4.7], target: [0, 0.45, 0] },
  dial: { pos: [-0.9, 1.15, 3.6], target: [-0.35, 0.42, 0.9] },
  pops: { pos: [0.3, 4.6, 2.5], target: [0, 0.95, 0.15], lid: false },
  beads: { pos: [3.9, 1.5, -0.5], target: [1.3, 0.45, 0], lid: false },
  sticker: { pos: [1.3, 1.05, 3.6], target: [0.35, 0.4, 0.9] },
  snacks: { pos: [0.3, 4.6, 2.9], target: [0, 0.3, 0.1], lid: true },
  menu: { pos: [0, 1.25, -4.2], target: [0, 0.44, -0.9], lid: false },
  week: { pos: [-4.3, 1.5, 0.5], target: [-1.3, 0.45, 0], lid: false },
  food: { pos: [0.3, 3.1, 2.3], target: [0, 1.55, -1.2], lid: true },
};

const FEATURES = [
  { view: 'hero', icon: '📦', label: 'Whole box', c: '#FFE6C7' },
  { view: 'dial', icon: '🎡', label: 'Picture wheel', c: '#DCEEFF', tap: { type: 'dial' } },
  { view: 'pops', icon: '🔺', label: 'Buddy buttons', c: '#FFE0DC' },
  { view: 'beads', icon: '🧮', label: 'Bead game', c: '#FFF1C7' },
  { view: 'sticker', icon: '🏷️', label: 'Name sticker', c: '#D9F6E8', tap: { type: 'sticker' } },
  { view: 'snacks', icon: '🍱', label: 'Bento inside', c: '#FFE9CC' },
  { view: 'food', icon: '🥕', label: 'Food of the day', c: '#FFE4D2', tap: { type: 'lidUnder' } },
  { view: 'menu', icon: '📋', label: 'Nutrition card', c: '#ECE3FF', tap: { type: 'menu' } },
  { view: 'week', icon: '⭐', label: 'Sticker week', c: '#D6F3F3' },
];

let fly = null;
let viewScale = 1;

function viewFor(name) {
  const v = VIEWS[name];
  const target = new THREE.Vector3(...v.target);
  const pos = new THREE.Vector3(...v.pos).sub(target).multiplyScalar(viewScale).add(target);
  return { pos, target };
}

function flyTo(name) {
  const { pos, target } = viewFor(name);
  fly = { t: 0, dur: 1.1, p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target };
  if (VIEWS[name].lid !== undefined) box.setLid(VIEWS[name].lid);
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const prev = viewScale;
  viewScale = THREE.MathUtils.clamp(1.5 / camera.aspect, 1, 3.1);
  camera.updateProjectionMatrix();
  // Keep the current framing when the window changes shape.
  if (prev !== viewScale) {
    camera.position.sub(controls.target).multiplyScalar(viewScale / prev).add(controls.target);
  }
}
window.addEventListener('resize', resize);
resize();
{
  const { pos, target } = viewFor('hero');
  camera.position.copy(pos);
  controls.target.copy(target);
}

/* -------------------------------------------------------------- picking -- */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pick(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(box.pickables, false)[0];
  return hit?.object.userData.action ? hit : null;
}

let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; fly = null; });
canvas.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  down = null;
  if (moved > 6) return;
  const hit = pick(e);
  if (hit) box.tap(hit.object.userData.action, hit);
});

const tip = $('tip');
let hoverEvt = null;
canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') hoverEvt = e; });
canvas.addEventListener('pointerleave', () => { hoverEvt = null; tip.hidden = true; canvas.style.cursor = ''; });

function updateHover() {
  if (!hoverEvt) return;
  const e = hoverEvt;
  hoverEvt = null;
  if (e.buttons) { tip.hidden = true; return; }
  const hit = pick(e);
  const label = hit && box.hoverLabel(hit.object.userData.action);
  canvas.style.cursor = label ? 'pointer' : 'grab';
  tip.hidden = !label;
  if (label) {
    tip.textContent = label;
    tip.style.left = `${e.clientX}px`;
    tip.style.top = `${e.clientY}px`;
  }
}

/* --------------------------------------------------------------- bubble -- */
let bubbleTimer = 0;
function showSay(p) {
  sfx.speak(p.speak);
  const art = $('bubble-art');
  art.replaceChildren();
  art.style.background = '#FFF3DA';
  if (p.item) {
    const c = document.createElement('canvas');
    c.width = c.height = 112;
    const ctx = c.getContext('2d');
    T.drawItemPicture(ctx, p.item, 56, 56, 84);
    art.append(c);
  } else if (p.color) {
    art.style.background = p.color;
  } else if (p.count !== undefined) {
    art.textContent = String(p.count);
  } else {
    art.textContent = p.icon || '✨';
  }
  $('bubble-title').textContent = p.title;
  $('bubble-body').textContent = p.body || '';
  const b = $('bubble');
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => b.classList.remove('show'), 4200);
}

/* ------------------------------------------------------------------- UI -- */
function drawBrand() {
  const c = $('brand-logo');
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  T.drawLogo(ctx, 0, 0, c.height);
}
drawBrand();

function setSubtitle() {
  const d = DAYS[dayIndex];
  $('subtitle').textContent = `${childName}'s ${d.day} box · ${d.theme}`;
}
setSubtitle();

const featureEls = FEATURES.map((f) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.innerHTML = `<span class="dot" style="--c:${f.c}">${f.icon}</span><span></span>`;
  b.lastChild.textContent = f.label;
  b.addEventListener('click', () => {
    featureEls.forEach((el) => el.classList.toggle('active', el === b));
    flyTo(f.view);
    if (f.tap) setTimeout(() => box.tap(f.tap), 700);
  });
  $('features').append(b);
  return b;
});
featureEls[0].classList.add('active');

const dayEls = DAYS.map((d, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'day';
  b.setAttribute('role', 'tab');
  b.style.setProperty('--lid', d.lid);
  b.style.setProperty('--body', d.body);
  b.innerHTML = `<span class="sw"></span><span class="d">${d.short}</span><span class="t">${d.theme}</span>${i === todayIndex() ? '<span class="today" title="Today"></span>' : ''}`;
  b.addEventListener('click', () => selectDay(i));
  $('days').append(b);
  return b;
});

function selectDay(i, announce = true) {
  dayIndex = i;
  dayEls.forEach((el, j) => el.setAttribute('aria-selected', String(j === i)));
  document.documentElement.style.setProperty('--accent', DAYS[i].body);
  setSubtitle();
  box.setTheme(DAYS[i]);
  if (announce) {
    setTimeout(() => {
      const d = DAYS[i];
      showSay({ speak: `${d.day}! ${d.meal.name}. And today we learn ${d.theme.toLowerCase()}.`, title: d.meal.name, body: `${d.day}'s box · today we learn ${d.theme.toLowerCase()}.`, item: d.items[0] });
    }, 650);
  }
}
selectDay(dayIndex, false);

$('btn-lid').addEventListener('click', () => box.setLid(!box.lidOpen));

$('btn-sound').addEventListener('click', (e) => {
  const on = !sfx.isOn();
  sfx.setOn(on);
  const b = e.currentTarget;
  b.setAttribute('aria-pressed', String(on));
  b.setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
  b.title = on ? 'Sound on' : 'Sound off';
});

$('name-input').addEventListener('input', (e) => {
  childName = e.target.value.trim().replace(/\s+/g, ' ') || 'Aarav';
  box.setName(childName);
  setSubtitle();
});

// Logo sheet.
const dlg = $('logo-dialog');
$('btn-logo').addEventListener('click', () => {
  const big = $('logo-big');
  const bctx = big.getContext('2d');
  bctx.clearRect(0, 0, big.width, big.height);
  T.drawLogo(bctx, 0, 0, big.height);
  const mark = $('logo-mark');
  const mctx = mark.getContext('2d');
  mctx.clearRect(0, 0, 400, 400);
  mctx.save();
  mctx.scale(2, 2);
  T.drawMark(mctx);
  mctx.restore();
  const sw = $('swatches');
  if (!sw.childElementCount) {
    [['Coral', C.coral], ['Sunshine', C.sun], ['Mint', C.mint], ['Sky', C.sky], ['Grape', C.grape], ['Ink', C.ink]].forEach(([n, hex]) => {
      const s = document.createElement('span');
      s.className = 'swatch';
      s.innerHTML = `<i style="background:${hex}"></i>${n}<br>${hex}`;
      sw.append(s);
    });
  }
  dlg.showModal();
});
$('logo-close').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
$('dl-png').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = $('logo-big').toDataURL('image/png');
  a.download = 'toddlers-snack-box-logo.png';
  a.click();
});

setTimeout(() => {
  showSay({ title: `Hi ${childName}!`, body: 'Tap the wheel, the beads or the buttons to play. Drag to turn the box.', icon: '👋' });
}, 600);

/* ----------------------------------------------------------------- loop -- */
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1); // springs substep, so slow frames still keep real time
  if (fly) {
    fly.t += dt / fly.dur;
    const k = ease(Math.min(fly.t, 1));
    camera.position.lerpVectors(fly.p0, fly.p1, k);
    controls.target.lerpVectors(fly.t0, fly.t1, k);
    if (fly.t >= 1) fly = null;
  }
  const y = box.update(dt);
  contact.material.opacity = 0.5 * Math.max(0, 1 - y * 2.2);
  contact.scale.setScalar(1 + y * 0.6);
  controls.update();
  updateHover();
  renderer.render(scene, camera);
});
