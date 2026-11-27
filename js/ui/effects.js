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
// Tout est synthétisé, sans fichier audio : un bus commun (compresseur + réverbération) donne
// du corps aux sons ; les cloches sont métalliques (partiels inharmoniques) ; la déchirure est un
// froissement de feuille d'aluminium (bruit granuleux) et non un simple souffle.

let audio = null;
let bus = null;

/** Réponse impulsionnelle d'une petite salle, générée : bruit stéréo qui s'éteint. */
function impulse(ac, seconds = 1.6) {
  const n = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, n, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6);
  }
  return buf;
}

function ctx() {
  if (!getState().settings.sound) return null;
  try {
    if (!audio) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      const master = audio.createGain();
      master.gain.value = 0.9;
      const comp = audio.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      comp.attack.value = 0.004;
      comp.release.value = 0.2;
      master.connect(comp).connect(audio.destination);
      const verb = audio.createConvolver();
      verb.buffer = impulse(audio);
      const wet = audio.createGain();
      wet.gain.value = 0.34;
      verb.connect(wet).connect(master);
      bus = { master, verb };
    }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  } catch {
    return null;
  }
}

/** Branche un nœud sur le bus : `wet` = part envoyée à la réverbération (0 à 1). */
function out(ac, node, wet = 0) {
  node.connect(bus.master);
  if (wet > 0) {
    const send = ac.createGain();
    send.gain.value = wet;
    node.connect(send).connect(bus.verb);
  }
}

function envelope(ac, t0, { gain, attack = 0.01, dur }) {
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), t0 + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  return amp;
}

function tone(ac, { freq, to, start = 0, dur = 0.2, type = 'sine', gain = 0.08, attack = 0.012, wet = 0.15, detune = 0, lowpass = 0 }) {
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  osc.type = type;
  osc.detune.value = detune;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const amp = envelope(ac, t0, { gain, attack, dur });
  let node = osc.connect(amp);
  if (lowpass) {
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lowpass;
    node = node.connect(f);
  }
  out(ac, node, wet);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** Cloche métallique : partiels inharmoniques, chacun s'éteignant à sa vitesse. */
function bell(ac, { freq, start = 0, gain = 0.06, dur = 1.2, wet = 0.45 }) {
  const PARTIALS = [[1, 1, 1], [2.756, 0.5, 0.6], [5.404, 0.28, 0.4], [8.933, 0.14, 0.25]];
  PARTIALS.forEach(([ratio, level, decay]) => tone(ac, { freq: freq * ratio, start, dur: dur * decay, gain: gain * level, attack: 0.004, wet, type: 'sine' }));
}

/** Source de bruit : brut, ou granuleux (impulsions éparses comme du papier froissé). */
function noiseBuffer(ac, dur, crackle = false) {
  const n = Math.ceil(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    d[i] = crackle ? (Math.random() < 0.035 ? w : w * 0.12) : w;
  }
  return buf;
}

function noise(ac, { start = 0, dur = 0.25, gain = 0.06, from = 4000, to = 600, type = 'bandpass', q = 1, crackle = false, wet = 0.1 }) {
  const t0 = ac.currentTime + start;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, dur, crackle);
  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, t0);
  filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.03, dur / 3));
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  out(ac, src.connect(filter).connect(amp), wet);
  src.start(t0);
}

/** Coup sourd : un sinus qui plonge, avec un peu de claquement. */
function thump(ac, { start = 0, gain = 0.22, freq = 120, dur = 0.28 }) {
  tone(ac, { freq, to: 38, start, dur, gain, attack: 0.004, wet: 0.2 });
  noise(ac, { start, dur: 0.05, gain: gain * 0.35, from: 1500, to: 300, wet: 0 });
}

/** Montée de tension : balayage de bruit et de scie qui grimpe. */
function riser(ac, { start = 0, dur = 0.8, gain = 0.05, from = 200, to = 1800 }) {
  noise(ac, { start, dur, gain: gain * 1.4, from: from * 2, to: to * 3, q: 2.5, wet: 0.3 });
  tone(ac, { freq: from, to, start, dur, type: 'sawtooth', gain: gain * 0.6, attack: dur * 0.6, lowpass: to * 1.2, wet: 0.35 });
}

/** Nappe de voix : trois scies légèrement désaccordées, filtrées, à l'attaque lente. */
function pad(ac, { freq, start = 0, dur = 1.6, gain = 0.03 }) {
  [-9, 0, 9].forEach((detune) => tone(ac, { freq, start, dur, type: 'sawtooth', gain, attack: dur * 0.35, detune, lowpass: 1400, wet: 0.5 }));
}

const NOTE = { C5: 523.25, E5: 659.25, G5: 783.99, B5: 987.77, C6: 1046.5, E6: 1318.5, G6: 1568, C7: 2093, E7: 2637 };

/** Cascade de cloches qui grimpe (le « scintillement » d'une belle carte). */
function sparkles(ac, { start = 0, count = 6, from = 'C6', gain = 0.035 }) {
  const ladder = [NOTE.C6, NOTE.E6, NOTE.G6, NOTE.C7, NOTE.E7, NOTE.C7 * 1.5];
  for (let i = 0; i < count; i++) bell(ac, { freq: ladder[i % ladder.length] * (from === 'C6' ? 1 : 0.5), start: start + i * 0.07, gain: gain * (1 - i * 0.07), dur: 0.9 });
}

/** Ce que fait chaque rareté à la révélation : de plus en plus de couches, de plus en plus longtemps. */
const REVEALS = {
  commune(ac) {
    thump(ac, { gain: 0.1, freq: 95, dur: 0.18 });
    noise(ac, { dur: 0.09, gain: 0.04, from: 3000, to: 1200, wet: 0.05 });
    bell(ac, { freq: NOTE.E5, start: 0.03, gain: 0.03, dur: 0.6, wet: 0.3 });
  },
  peu_commune(ac) {
    thump(ac, { gain: 0.14, freq: 105, dur: 0.22 });
    bell(ac, { freq: NOTE.G5, start: 0.02, gain: 0.05, dur: 0.8 });
    bell(ac, { freq: NOTE.C6, start: 0.11, gain: 0.05, dur: 1 });
  },
  rare(ac) {
    thump(ac, { gain: 0.2 });
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((freq, i) => bell(ac, { freq, start: 0.03 + i * 0.08, gain: 0.055, dur: 1.2 }));
    noise(ac, { start: 0.05, dur: 0.6, gain: 0.025, from: 5000, to: 9000, type: 'highpass', wet: 0.5 });
  },
  ultra_rare(ac) {
    thump(ac, { gain: 0.26, freq: 105 });
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((freq) => bell(ac, { freq, start: 0.02, gain: 0.05, dur: 1.6 }));
    pad(ac, { freq: NOTE.C5 / 2, dur: 1.6, gain: 0.03 });
    sparkles(ac, { start: 0.18, count: 6 });
  },
  legendaire(ac) {
    thump(ac, { gain: 0.34, freq: 90, dur: 0.5 });
    noise(ac, { dur: 0.7, gain: 0.07, from: 800, to: 9000, q: 1.5, wet: 0.5 });
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6].forEach((freq, i) => bell(ac, { freq, start: 0.04 + i * 0.045, gain: 0.055, dur: 2 }));
    pad(ac, { freq: NOTE.C5 / 2, dur: 2.2, gain: 0.035 });
    pad(ac, { freq: NOTE.G5 / 2, dur: 2.2, gain: 0.025 });
    sparkles(ac, { start: 0.25, count: 9 });
  },
  mythique(ac) {
    thump(ac, { gain: 0.42, freq: 80, dur: 0.7 });
    thump(ac, { start: 0.22, gain: 0.2, freq: 140, dur: 0.3 });
    noise(ac, { dur: 1, gain: 0.09, from: 500, to: 11000, q: 1.2, wet: 0.6 });
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6, NOTE.G6].forEach((freq, i) => bell(ac, { freq, start: 0.03 + i * 0.05, gain: 0.06, dur: 2.6 }));
    [NOTE.C5 / 2, NOTE.G5 / 2, NOTE.E5].forEach((freq) => pad(ac, { freq, dur: 2.8, gain: 0.035 }));
    sparkles(ac, { start: 0.3, count: 12 });
  },
};

export const sfx = {
  /** Clic discret : une note de bois, un peu de variation à chaque fois. */
  tap() {
    const ac = ctx();
    if (!ac) return;
    tone(ac, { freq: 520 * (0.97 + Math.random() * 0.06), to: 380, dur: 0.05, type: 'triangle', gain: 0.06, attack: 0.003, wet: 0.05 });
    noise(ac, { dur: 0.02, gain: 0.03, from: 5000, to: 2500, type: 'highpass', wet: 0 });
  },
  /** Tension avant un résultat (Évolution) : balayage montant et pouls grave. */
  charge() {
    const ac = ctx();
    if (!ac) return;
    riser(ac, { dur: 0.9, gain: 0.05, from: 140, to: 900 });
    [0, 0.3, 0.6].forEach((at) => thump(ac, { start: at, gain: 0.08 + at * 0.1, freq: 70, dur: 0.14 }));
  },
  /** Déchirure d'un coup (ouverture rapide) : le froissement, puis le souffle. */
  tear() {
    const ac = ctx();
    if (!ac) return;
    this.rip(0.28);
    this.burst();
  },
  /**
   * Déchirure du sachet : froissement granuleux qui monte en fréquence, plus un claquement
   * de soudure qui cède en fin de course.
   */
  rip(dur = 0.55) {
    const ac = ctx();
    if (!ac) return;
    noise(ac, { dur, gain: 0.11, from: 2200, to: 7000, type: 'bandpass', q: 0.8, crackle: true, wet: 0.12 });
    noise(ac, { dur: dur * 0.9, gain: 0.05, from: 5000, to: 9500, type: 'highpass', crackle: true, wet: 0.08 });
    noise(ac, { start: dur * 0.92, dur: 0.07, gain: 0.08, from: 4000, to: 1500, wet: 0.1 });
  },
  /**
   * Déchirure tenue à la main : un froissement continu dont le volume suit la vitesse du geste.
   * @returns {{ set: (speed: number) => void, stop: () => void }}
   */
  ripLive() {
    const ac = ctx();
    if (!ac) return { set() {}, stop() {} };
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(ac, 1.2, true);
    src.loop = true;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    filter.frequency.value = 3200;
    const amp = ac.createGain();
    amp.gain.value = 0.0001;
    out(ac, src.connect(filter).connect(amp), 0.1);
    src.start();
    return {
      set(speed) {
        const level = Math.min(1, Math.max(0, speed));
        amp.gain.setTargetAtTime(0.0001 + level * 0.12, ac.currentTime, 0.03);
        filter.frequency.setTargetAtTime(2400 + level * 4200, ac.currentTime, 0.05);
      },
      stop() {
        amp.gain.setTargetAtTime(0.0001, ac.currentTime, 0.04);
        setTimeout(() => src.stop(), 250);
      },
    };
  },
  /** Le sachet s'ouvre : la lumière jaillit (souffle ascendant, scintillement, petit coup). */
  burst() {
    const ac = ctx();
    if (!ac) return;
    thump(ac, { gain: 0.16, freq: 130, dur: 0.22 });
    noise(ac, { dur: 0.45, gain: 0.07, from: 900, to: 9000, q: 1.4, wet: 0.45 });
    sparkles(ac, { start: 0.05, count: 4, gain: 0.03 });
  },
  /** Montée de tension avant une carte rare. */
  suspense(rank = 3) {
    const ac = ctx();
    if (!ac) return;
    riser(ac, { dur: rank >= 4 ? 1.1 : 0.7, gain: rank >= 4 ? 0.06 : 0.045, from: 180, to: rank >= 4 ? 2400 : 1500 });
  },
  /** Retournement de la carte : un froissement de papier glacé. */
  flip() {
    const ac = ctx();
    if (!ac) return;
    noise(ac, { dur: 0.14, gain: 0.05, from: 3600, to: 1400, type: 'highpass', wet: 0.08 });
    tone(ac, { freq: 260, to: 170, dur: 0.1, type: 'triangle', gain: 0.04, attack: 0.004, wet: 0.1 });
  },
  reveal(rarity) {
    const ac = ctx();
    if (!ac) return;
    (REVEALS[rarity] || REVEALS.commune)(ac);
  },
  /** Pièces : deux ou trois tintements métalliques qui rebondissent. */
  coins() {
    const ac = ctx();
    if (!ac) return;
    [0, 0.07, 0.16].forEach((at, i) => {
      bell(ac, { freq: 2300 + i * 380 + Math.random() * 60, start: at, gain: 0.04, dur: 0.5, wet: 0.25 });
      noise(ac, { start: at, dur: 0.03, gain: 0.03, from: 8000, to: 5000, type: 'highpass', wet: 0 });
    });
  },
  /** Cliquetis de la roulette : un petit claquement de bois, légèrement différent à chaque carte. */
  tick() {
    const ac = ctx();
    if (!ac) return;
    tone(ac, { freq: 760 * (0.94 + Math.random() * 0.12), to: 420, dur: 0.03, type: 'triangle', gain: 0.045, attack: 0.002, wet: 0.04 });
    noise(ac, { dur: 0.018, gain: 0.025, from: 6000, to: 3000, type: 'highpass', wet: 0 });
  },
  /** Échec : deux notes qui s'affaissent, voilées. */
  fail() {
    const ac = ctx();
    if (!ac) return;
    tone(ac, { freq: 330, to: 262, dur: 0.32, type: 'triangle', gain: 0.07, lowpass: 1200, wet: 0.3 });
    tone(ac, { freq: 247, to: 156, start: 0.22, dur: 0.6, type: 'triangle', gain: 0.07, lowpass: 900, wet: 0.35 });
    thump(ac, { start: 0.22, gain: 0.12, freq: 70, dur: 0.4 });
  },
  /** Réussite : arpège de cloches avec un coup en dessous. */
  win() {
    const ac = ctx();
    if (!ac) return;
    thump(ac, { gain: 0.22 });
    [NOTE.C5, NOTE.G5, NOTE.C6, NOTE.E6].forEach((freq, i) => bell(ac, { freq, start: 0.02 + i * 0.09, gain: 0.06, dur: 1.4 }));
    sparkles(ac, { start: 0.4, count: 5 });
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
