// Runs the four onboarding screens as one flow, with each screen's character
// alive and reacting to what the parent does.
import { Character } from './characters.js';

const ORDER = ['child', 'location', 'meal', 'plan'];
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Measure where the caret sits inside an input, so the eyes can follow it.
const measure = document.createElement('canvas').getContext('2d');
function caretPoint(input) {
  const r = input.getBoundingClientRect();
  const cs = getComputedStyle(input);
  measure.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const zoom = r.width / input.offsetWidth || 1;
  const text = input.value || input.placeholder || '';
  const w = measure.measureText(input.value ? text : '').width;
  return { x: r.left + (parseFloat(cs.paddingLeft) + w) * zoom, y: r.top + r.height / 2 };
}

export function mountOnboarding({ display, stepper, onName }) {
  const screens = Object.fromEntries(ORDER.map((k) => [k, display.querySelector(`[data-screen="${k}"]`)]));
  const chars = Object.fromEntries(ORDER.map((k) => [k, new Character(screens[k], k)]));
  let current = 'child';
  let busy = false;

  /* ---- navigation ---- */
  function go(next, dir = 1) {
    if (next === current || busy) return;
    const from = screens[current];
    const to = screens[next];
    busy = true;
    from.classList.remove('arrive');
    from.style.setProperty('--dir', dir);
    from.classList.add('leave');
    to.hidden = false;
    to.classList.remove('arrive');
    void to.offsetWidth;
    to.classList.add('arrive');
    chars[next].play();
    current = next;
    stepper.querySelectorAll('button[data-go]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.go === next)));
    setTimeout(() => {
      from.hidden = true;
      from.classList.remove('leave');
      busy = false;
    }, REDUCED ? 0 : 280);
  }
  const step = (d) => ORDER[Math.min(ORDER.length - 1, Math.max(0, ORDER.indexOf(current) + d))];
  stepper.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.go) go(b.dataset.go, ORDER.indexOf(b.dataset.go) >= ORDER.indexOf(current) ? 1 : -1);
    if (b.dataset.replay !== undefined) {
      const s = screens[current];
      s.classList.remove('arrive');
      void s.offsetWidth;
      s.classList.add('arrive');
      chars[current].play();
    }
  });
  display.querySelectorAll('.setup-back').forEach((b) => b.addEventListener('click', () => go(step(-1), -1)));
  display.querySelectorAll('[data-skip]').forEach((b) => b.addEventListener('click', () => go(step(1))));

  // Happy hop, then move on.
  const hopThen = (k, next) => {
    chars[k].hop();
    setTimeout(() => go(next), REDUCED ? 0 : 380);
  };

  /* ---- child ---- */
  {
    const s = screens.child;
    const c = chars.child;
    const name = s.querySelector('#child-name');
    const dob = s.querySelector('#child-birthday');
    const focused = (el) => () => (document.activeElement === el ? caretPoint(el) : null);
    let watching = null;
    // Empty field: curious little "o". Once there's a name: smiling and blushing.
    const mood = (el) => c.setBase(el.value.trim() ? 'happy' : 'curious');
    [name, dob].forEach((el) => {
      el.addEventListener('focus', () => { watching = el; c.watch(focused(el)); mood(el); });
      el.addEventListener('blur', () => {
        if (watching !== el) return;
        c.watch(null);
        c.setBase('neutral');
        if (el.value.trim()) c.express('happy', 1.2);
      });
    });
    name.addEventListener('input', () => {
      const n = name.value.trim();
      mood(name);
      c.chatter();
      c.setBlush(n ? 0.55 : 0);
      onName(n || 'Aarav');
    });
    dob.addEventListener('input', () => { mood(dob); c.chatter(); });
    s.querySelectorAll('input[name="ob-gender"]').forEach((r) => r.addEventListener('change', () => { c.nod(); c.express('delighted', 1.2); }));
    s.querySelector('.child-add').addEventListener('click', () => c.squish());
    s.querySelector('.child-form').addEventListener('submit', (e) => { e.preventDefault(); hopThen('child', 'location'); });
  }

  /* ---- location ---- */
  {
    const s = screens.location;
    const c = chars.location;
    const pin = s.querySelector('#pin-code');
    const field = s.querySelector('.location-field');
    let err = null;
    const valid = () => /^[1-9]\d{5}$/.test(pin.value);
    pin.addEventListener('focus', () => { c.watch(() => (document.activeElement === pin ? caretPoint(pin) : null)); c.setBase(valid() ? 'happy' : 'focused'); });
    pin.addEventListener('blur', () => { c.watch(null); if (c.base !== 'sad') c.setBase('neutral'); });
    pin.addEventListener('input', () => {
      pin.value = pin.value.replace(/\D/g, '').slice(0, 6);
      pin.setAttribute('aria-invalid', 'false');
      err?.remove();
      err = null;
      // Concentrating while typing; cheers up again as soon as you retry after an error.
      c.setBase(valid() ? 'happy' : 'focused');
      c.chatter();
      if (valid()) c.hop();
    });
    s.querySelector('.location-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (/^[1-9]\d{5}$/.test(pin.value)) { hopThen('location', 'meal'); return; }
      c.shakeHead();
      c.setBase('sad'); // stays a bit sad until you fix the PIN
      c.express('sad');
      pin.setAttribute('aria-invalid', 'true');
      if (!err) {
        err = document.createElement('p');
        err.className = 'location-error';
        err.id = 'pin-error';
        err.setAttribute('role', 'alert');
        err.textContent = 'Enter a valid 6-digit PIN code.';
        field.append(err);
      }
    });
  }

  /* ---- meal preview ---- */
  {
    const s = screens.meal;
    const c = chars.meal;
    c.bias = s.querySelector('.meal-card'); // keeps glancing down at the food
    s.querySelector('.meal-subscribe').addEventListener('click', () => hopThen('meal', 'plan'));
    s.querySelector('.meal-card').addEventListener('click', () => { c.express('yum', 1.3); c.chatter(); });
  }

  /* ---- plan ---- */
  {
    const s = screens.plan;
    const c = chars.plan;
    s.querySelectorAll('input[name="ob-plan"]').forEach((r) => r.addEventListener('change', () => {
      s.querySelectorAll('.plan-option').forEach((o) => o.classList.toggle('selected', o.contains(r) ? r.checked : false));
      const o = r.closest('.plan-option').getBoundingClientRect();
      const until = performance.now() + 1400;
      c.watch(() => (performance.now() < until ? { x: o.left + o.width * 0.3, y: o.top + o.height / 2 } : null));
      c.nod();
      // The better-value plan gets the bigger grin.
      c.express(r.value === 'monthly' ? 'delighted' : 'happy', 1.3);
    }));
    s.querySelector('.plan-checkout').addEventListener('click', () => {
      c.hop();
      setTimeout(() => go('child', -1), REDUCED ? 0 : 520);
    });
  }

  /* ---- tap the character to squish it ---- */
  ORDER.forEach((k) => {
    screens[k].addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, input, label, a, .meal-card, form, .plan-options')) return;
      const h1 = screens[k].querySelector('h1').getBoundingClientRect();
      if (e.clientY < h1.top) chars[k].squish();
    });
  });

  /* ---- eyes follow the pointer anywhere on the page ---- */
  addEventListener('pointermove', (e) => chars[current].pointer(e.clientX, e.clientY), { passive: true });
  addEventListener('pointerdown', (e) => chars[current].pointer(e.clientX, e.clientY), { passive: true });

  /* ---- loop ---- */
  let last = performance.now();
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(display);
  Promise.all(ORDER.map((k) => chars[k].ready)).then(() => {
    screens.child.classList.add('arrive');
    chars.child.play();
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (visible) chars[current].update(dt);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
