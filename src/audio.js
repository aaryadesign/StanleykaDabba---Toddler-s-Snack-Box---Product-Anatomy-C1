// Tiny synthesized sound kit + spoken words. No audio files needed.
let ctx = null;
let enabled = true;
let voice = null;
let noiseBuf = null;

export const isOn = () => enabled;
export function setOn(on) {
  enabled = on;
  if (!on && 'speechSynthesis' in window) speechSynthesis.cancel();
}

function ac() {
  if (!enabled) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noise(c) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  return s;
}

function env(c, t, attack, decay, peak) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(c.destination);
  return g;
}

function tone(type, f0, f1, dur, peak, delay = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
  o.connect(env(c, t, 0.005, dur, peak));
  o.start(t);
  o.stop(t + dur + 0.05);
}

function burst(freq, q, dur, peak, delay = 0, type = 'bandpass') {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const n = noise(c);
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  n.connect(f).connect(env(c, t, 0.002, dur, peak));
  n.start(t);
  n.stop(t + dur + 0.05);
}

export const pop = (freq = 600) => { tone('sine', freq * 1.8, freq, 0.22, 0.3); burst(2400, 1, 0.03, 0.08); };
export const click = () => burst(3200, 4, 0.04, 0.25);
export const ratchet = () => { for (let i = 0; i < 3; i++) burst(2600 + i * 300, 6, 0.025, 0.2, i * 0.045); tone('triangle', 1320, 1320, 0.2, 0.06, 0.14); };
export const clack = () => { tone('triangle', 1250, 900, 0.07, 0.22); burst(1800, 3, 0.03, 0.15); };
export const crunch = () => { for (let i = 0; i < 4; i++) burst(1500 + Math.random() * 2500, 1.5, 0.035, 0.18, i * 0.05); };
export const whoosh = () => { burst(900, 0.7, 0.35, 0.12); [523, 659, 784, 1046].forEach((f, i) => tone('sine', f, f, 0.25, 0.08, 0.05 + i * 0.07)); };
export const lid = (open) => {
  if (open) { tone('sine', 220, 330, 0.18, 0.12); burst(1200, 1, 0.08, 0.05); }
  else { tone('sine', 150, 80, 0.16, 0.3); burst(700, 1.2, 0.06, 0.2); }
};

function pickVoice() {
  if (voice) return voice;
  const vs = speechSynthesis.getVoices();
  voice =
    vs.find((v) => /en[-_]IN/i.test(v.lang) && /female|veena|isha|rishi/i.test(v.name)) ||
    vs.find((v) => /en[-_]IN/i.test(v.lang)) ||
    vs.find((v) => /samantha|karen|moira|tessa|serena/i.test(v.name)) ||
    vs.find((v) => /^en/i.test(v.lang)) ||
    null;
  return voice;
}

export function speak(text) {
  if (!enabled || !('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) u.voice = v;
  u.lang = v?.lang || 'en-IN';
  u.rate = 0.92;
  u.pitch = 1.15;
  speechSynthesis.speak(u);
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { voice = null; };
