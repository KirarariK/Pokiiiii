// Effets : inclinaison 3D des cartes, sons synthétisés, particules.
// Tout respecte le réglage « animations » et la préférence système
// « réduire les animations ».

import { getState } from '../store.js';

export const motionOk = () =>
  getState().settings.motion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------- inclinaison */

/**
 * Incline un élément selon la position du pointeur et expose --mx / --my
 * (0–100 %) pour les reflets en CSS. Retourne la fonction de nettoyage.
 */
export function attachTilt(el, max = 14) {
  if (!el || !motionOk()) return () => {};
  let frame = 0;
  const move = (e) => {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      el.style.setProperty('--rx', `${((0.5 - y) * max).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${((x - 0.5) * max).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      el.classList.add('is-tilting');
    });
  };
  const leave = () => {
    cancelAnimationFrame(frame);
    el.classList.remove('is-tilting');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);
  return () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave);
    leave();
  };
}

/* --------------------------------------------------------------------- sons */

let audio = null;

function ctx() {
  if (!getState().settings.sound) return null;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    return audio;
  } catch {
    return null;
  }
}

function tone(ac, { freq, to, start = 0, dur = 0.2, type = 'sine', gain = 0.08 }) {
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(ac, { start = 0, dur = 0.25, gain = 0.06, from = 4000, to = 600 }) {
  const t0 = ac.currentTime + start;
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(from, t0);
  filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(amp).connect(ac.destination);
  src.start(t0);
}

/** Petite fanfare montante : plus la rareté est haute, plus elle est longue. */
const REVEAL_NOTES = {
  commune: [523],
  peu_commune: [523, 659],
  rare: [523, 659, 784],
  ultra_rare: [523, 659, 784, 1047],
  legendaire: [523, 659, 784, 1047, 1319, 1568],
};

export const sfx = {
  tap() {
    const ac = ctx();
    if (ac) tone(ac, { freq: 420, to: 620, dur: 0.07, type: 'triangle', gain: 0.05 });
  },
  charge() {
    const ac = ctx();
    if (ac) tone(ac, { freq: 140, to: 520, dur: 0.85, type: 'sawtooth', gain: 0.035 });
  },
  tear() {
    const ac = ctx();
    if (ac) noise(ac, { dur: 0.32, gain: 0.09 });
  },
  flip() {
    const ac = ctx();
    if (ac) noise(ac, { dur: 0.12, gain: 0.05, from: 2400, to: 900 });
  },
  reveal(rarity) {
    const ac = ctx();
    if (!ac) return;
    (REVEAL_NOTES[rarity] || REVEAL_NOTES.commune).forEach((freq, i) => {
      tone(ac, { freq, start: i * 0.085, dur: 0.32, type: 'triangle', gain: 0.07 });
    });
  },
  coins() {
    const ac = ctx();
    if (!ac) return;
    [1320, 1760, 2090].forEach((freq, i) => tone(ac, { freq, start: i * 0.06, dur: 0.16, type: 'square', gain: 0.025 }));
  },
};

/* --------------------------------------------------------------- particules */

/**
 * Gerbe de particules sur un canvas plein cadre.
 * @param {HTMLCanvasElement} canvas
 * @param {{ color: string, count?: number, power?: number }} options
 */
export function burst(canvas, { color, count = 60, power = 1 }) {
  if (!canvas || !motionOk()) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const g = canvas.getContext('2d');
  g.scale(dpr, dpr);
  const cx = width / 2;
  const cy = height / 2;
  const palette = [color, '#ffffff', color];
  const dots = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = (2 + Math.random() * 7) * power;
    return {
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      r: 1.5 + Math.random() * 3.5,
      life: 1,
      decay: 0.012 + Math.random() * 0.02,
      c: palette[Math.floor(Math.random() * palette.length)],
    };
  });
  let raf = 0;
  const step = () => {
    g.clearRect(0, 0, width, height);
    let alive = 0;
    for (const p of dots) {
      if (p.life <= 0) continue;
      alive++;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.975;
      p.vy = p.vy * 0.975 + 0.11;
      p.life -= p.decay;
      g.globalAlpha = Math.max(0, p.life);
      g.fillStyle = p.c;
      g.beginPath();
      g.arc(p.x, p.y, p.r * Math.max(0.2, p.life), 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    if (alive) raf = requestAnimationFrame(step);
    else g.clearRect(0, 0, width, height);
  };
  cancelAnimationFrame(canvas._raf || 0);
  raf = requestAnimationFrame(step);
  canvas._raf = raf;
}

/** Anime un montant de 0 à sa valeur finale. */
export function countUp(el, cents, format, ms = 900) {
  if (!el) return;
  if (!motionOk()) {
    el.textContent = format(cents);
    return;
  }
  const t0 = performance.now();
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = format(Math.round(cents * eased));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
