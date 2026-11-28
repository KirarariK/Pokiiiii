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
// froissement de feuille d'aluminium (des centaines de grains courts) et non un simple souffle ;
// les sons sont répartis entre la gauche et la droite.

let audio = null;
let bus = null;

/**
 * Réponse impulsionnelle d'une salle, générée : un court silence, quelques premières réflexions,
 * puis une queue de bruit stéréo qui s'éteint en s'assombrissant (les aigus meurent en premier).
 */
function impulse(ac, seconds = 2.1) {
  const sr = ac.sampleRate;
  const n = Math.floor(sr * seconds);
  const pre = Math.floor(sr * 0.012);
  const buf = ac.createBuffer(2, n, sr);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let low = 0;
    for (let i = pre; i < n; i++) {
      const k = (i - pre) / (n - pre);
      // Filtre passe-bas à un pôle dont la coupure descend avec le temps.
      const a = 0.75 - 0.6 * k;
      low += a * (Math.random() * 2 - 1 - low);
      d[i] = low * Math.pow(1 - k, 2.4);
    }
    for (let r = 0; r < 7; r++) {
      const at = pre + Math.floor(sr * (0.004 + Math.random() * 0.045));
      d[at] += (Math.random() < 0.5 ? -1 : 1) * (0.5 - r * 0.05);
    }
  }
  return buf;
}

function ctx() {
  if (!getState().settings.sound) return null;
  try {
    if (!audio) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      const master = audio.createGain();
      master.gain.value = 1.5;
      const comp = audio.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      comp.attack.value = 0.004;
      comp.release.value = 0.2;
      master.connect(comp).connect(audio.destination);
      const verb = audio.createConvolver();
      verb.buffer = impulse(audio);
      const wet = audio.createGain();
      wet.gain.value = 0.3;
      verb.connect(wet).connect(master);
      bus = { master, verb };
    }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  } catch {
    return null;
  }
}

/** Branche un nœud sur le bus : `wet` = part envoyée à la réverbération (0 à 1), `pan` = gauche (-1) à droite (1). */
function out(ac, node, wet = 0, pan = 0) {
  if (pan && ac.createStereoPanner) {
    const p = ac.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    node = node.connect(p);
  }
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

function tone(ac, { freq, to, start = 0, dur = 0.2, type = 'sine', gain = 0.08, attack = 0.012, wet = 0.15, detune = 0, lowpass = 0, pan = 0 }) {
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
  out(ac, node, wet, pan);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** Cloche métallique : partiels inharmoniques, chacun s'éteignant à sa vitesse. */
function bell(ac, { freq, start = 0, gain = 0.06, dur = 1.2, wet = 0.45, pan = 0 }) {
  const PARTIALS = [[1, 1, 1], [2.756, 0.5, 0.6], [5.404, 0.28, 0.4], [8.933, 0.14, 0.25]];
  PARTIALS.forEach(([ratio, level, decay]) => tone(ac, { freq: freq * ratio, start, dur: dur * decay, gain: gain * level, attack: 0.004, wet, pan, type: 'sine' }));
  // Un double à peine désaccordé : la cloche « bat » au lieu de sonner comme un bip.
  tone(ac, { freq: freq * 1.004, start, dur: dur * 0.8, gain: gain * 0.45, attack: 0.004, wet, pan: -pan, type: 'sine' });
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

function noise(ac, { start = 0, dur = 0.25, gain = 0.06, from = 4000, to = 600, type = 'bandpass', q = 1, crackle = false, wet = 0.1, pan = 0 }) {
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
  out(ac, src.connect(filter).connect(amp), wet, pan);
  src.start(t0);
}

/**
 * Feuille d'aluminium froissée : des centaines de grains très courts (un claquement résonant
 * chacun), répartis au hasard dans le temps et entre les deux oreilles, sur un léger souffle.
 * `ramp` > 0 resserre les grains vers la fin (la déchirure s'emballe).
 */
function foilBuffer(ac, dur, { density = 110, ramp = 0 } = {}) {
  const sr = ac.sampleRate;
  const n = Math.ceil(sr * dur);
  const buf = ac.createBuffer(2, n, sr);
  const left = buf.getChannelData(0);
  const right = buf.getChannelData(1);
  for (let i = 0; i < n; i++) {
    left[i] = (Math.random() * 2 - 1) * 0.04;
    right[i] = (Math.random() * 2 - 1) * 0.04;
  }
  const count = Math.round(density * dur);
  for (let g = 0; g < count; g++) {
    const u = Math.random();
    const at = Math.floor((ramp ? Math.pow(u, 1 / (1 + ramp)) : u) * (n - 1));
    const len = Math.floor(sr * (0.0012 + Math.random() * 0.006));
    const w = (2 * Math.PI * (2600 + Math.random() * 7400)) / sr;
    const amp = 0.2 + Math.random() * Math.random() * 0.8;
    const side = Math.random() * Math.PI * 0.5;
    const gl = Math.cos(side);
    const gr = Math.sin(side);
    for (let j = 0; j < len && at + j < n; j++) {
      const v = (Math.sin(w * j) * 0.55 + (Math.random() * 2 - 1) * 0.6) * Math.exp((-5 * j) / len) * amp;
      left[at + j] += v * gl;
      right[at + j] += v * gr;
    }
  }
  return buf;
}

function foil(ac, { start = 0, dur = 0.3, gain = 0.1, density = 110, ramp = 0, highpass = 1800, wet = 0.1, attack = 0.02 }) {
  const t0 = ac.currentTime + start;
  const src = ac.createBufferSource();
  src.buffer = foilBuffer(ac, dur, { density, ramp });
  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = highpass;
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(attack, dur / 3));
  amp.gain.setValueAtTime(gain, t0 + dur * 0.8);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  out(ac, src.connect(filter).connect(amp), wet);
  src.start(t0);
}

/** Coup sourd : un sinus qui plonge, avec un peu de claquement. */
function thump(ac, { start = 0, gain = 0.22, freq = 120, dur = 0.28 }) {
  tone(ac, { freq, to: 38, start, dur, gain, attack: 0.004, wet: 0.2 });
  // Une octave au-dessus, brève : le coup s'entend aussi sur un haut-parleur de téléphone.
  tone(ac, { freq: freq * 2, to: 76, start, dur: dur * 0.5, gain: gain * 0.3, attack: 0.004, type: 'triangle', wet: 0.1 });
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
  for (let i = 0; i < count; i++) bell(ac, { freq: ladder[i % ladder.length] * (from === 'C6' ? 1 : 0.5), start: start + i * 0.07, gain: gain * (1 - i * 0.07), dur: 0.9, pan: (i % 2 ? 0.6 : -0.6) * (0.5 + Math.random() * 0.5) });
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
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((freq, i) => bell(ac, { freq, start: 0.03 + i * 0.08, gain: 0.055, dur: 1.2, pan: -0.5 + i * 0.33 }));
    noise(ac, { start: 0.05, dur: 0.6, gain: 0.025, from: 5000, to: 9000, type: 'highpass', wet: 0.5 });
  },
  ultra_rare(ac) {
    thump(ac, { gain: 0.26, freq: 105 });
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((freq, i) => bell(ac, { freq, start: 0.02 + i * 0.012, gain: 0.05, dur: 1.6, pan: -0.6 + i * 0.4 }));
    tone(ac, { freq: 62, to: 40, dur: 0.9, gain: 0.16, attack: 0.02, wet: 0.2 });
    pad(ac, { freq: NOTE.C5 / 2, dur: 1.6, gain: 0.03 });
    sparkles(ac, { start: 0.18, count: 6 });
  },
  legendaire(ac) {
    thump(ac, { gain: 0.34, freq: 90, dur: 0.5 });
    noise(ac, { dur: 0.7, gain: 0.07, from: 800, to: 9000, q: 1.5, wet: 0.5 });
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6].forEach((freq, i) => bell(ac, { freq, start: 0.04 + i * 0.045, gain: 0.055, dur: 2, pan: -0.7 + i * 0.35 }));
    tone(ac, { freq: 55, to: 36, dur: 1.3, gain: 0.2, attack: 0.02, wet: 0.25 });
    bell(ac, { freq: NOTE.C7, start: 0.75, gain: 0.04, dur: 2.2, wet: 0.6 });
    pad(ac, { freq: NOTE.C5 / 2, dur: 2.2, gain: 0.035 });
    pad(ac, { freq: NOTE.G5 / 2, dur: 2.2, gain: 0.025 });
    sparkles(ac, { start: 0.25, count: 9 });
  },
  mythique(ac) {
    thump(ac, { gain: 0.42, freq: 80, dur: 0.7 });
    thump(ac, { start: 0.22, gain: 0.2, freq: 140, dur: 0.3 });
    noise(ac, { dur: 1, gain: 0.09, from: 500, to: 11000, q: 1.2, wet: 0.6 });
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6, NOTE.G6].forEach((freq, i) => bell(ac, { freq, start: 0.03 + i * 0.05, gain: 0.06, dur: 2.6, pan: -0.75 + i * 0.3 }));
    tone(ac, { freq: 50, to: 32, dur: 1.8, gain: 0.24, attack: 0.02, wet: 0.3 });
    // Second temps : l'accord s'ouvre (neuvième ajoutée) et une cloche claire le couronne.
    [NOTE.G5, NOTE.B5 * 1.1225, NOTE.E6].forEach((freq, i) => bell(ac, { freq, start: 0.85 + i * 0.06, gain: 0.045, dur: 2.4, wet: 0.6, pan: 0.5 - i * 0.5 }));
    bell(ac, { freq: NOTE.C7, start: 1.1, gain: 0.045, dur: 2.6, wet: 0.65 });
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
  /** Le doigt se pose sur le sachet : la feuille crisse à peine. */
  grab() {
    const ac = ctx();
    if (!ac) return;
    foil(ac, { dur: 0.12, gain: 0.2, density: 220, highpass: 3000, wet: 0.08, attack: 0.004 });
  },
  /**
   * Déchirure du sachet : la feuille qui crisse de plus en plus serré, le « zip » de la soudure
   * qui se défait (une bande de bruit étroite qui monte), puis le claquement quand elle cède.
   */
  rip(dur = 0.55) {
    const ac = ctx();
    if (!ac) return;
    foil(ac, { dur, gain: 0.2, density: 240, ramp: 1.2, highpass: 1700, wet: 0.12 });
    noise(ac, { dur, gain: 0.06, from: 900, to: 3200, q: 5, wet: 0.1 });
    noise(ac, { dur: dur * 0.9, gain: 0.035, from: 380, to: 620, q: 1.2, wet: 0.05 });
    noise(ac, { start: dur * 0.93, dur: 0.06, gain: 0.11, from: 5200, to: 1400, wet: 0.15 });
    tone(ac, { freq: 210, to: 90, start: dur * 0.93, dur: 0.08, gain: 0.07, attack: 0.003, type: 'triangle', wet: 0.1 });
  },
  /**
   * Déchirure tenue à la main : le crissement suit la vitesse du geste, le « zip » monte avec
   * l'avancement, et chaque dent qui cède claque (`notch`).
   * @returns {{ set: (speed: number, progress?: number) => void, notch: () => void, stop: () => void }}
   */
  ripLive() {
    const ac = ctx();
    if (!ac) return { set() {}, notch() {}, stop() {} };
    const src = ac.createBufferSource();
    src.buffer = foilBuffer(ac, 1.6, { density: 230 });
    src.loop = true;
    const filter = ac.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2400;
    const amp = ac.createGain();
    amp.gain.value = 0.0001;
    out(ac, src.connect(filter).connect(amp), 0.1);
    const zipSrc = ac.createBufferSource();
    zipSrc.buffer = noiseBuffer(ac, 1);
    zipSrc.loop = true;
    const zip = ac.createBiquadFilter();
    zip.type = 'bandpass';
    zip.Q.value = 5;
    zip.frequency.value = 900;
    const zipAmp = ac.createGain();
    zipAmp.gain.value = 0.0001;
    out(ac, zipSrc.connect(zip).connect(zipAmp), 0.08);
    src.start();
    zipSrc.start();
    let stopped = false;
    return {
      set(speed, progress = 0) {
        if (stopped) return;
        const level = Math.min(1, Math.max(0, speed));
        const now = ac.currentTime;
        amp.gain.setTargetAtTime(0.0001 + level * 0.16, now, 0.025);
        filter.frequency.setTargetAtTime(2800 - level * 1300, now, 0.05);
        zipAmp.gain.setTargetAtTime(0.0001 + level * 0.06, now, 0.03);
        zip.frequency.setTargetAtTime(900 + progress * 2300, now, 0.04);
      },
      notch() {
        if (stopped) return;
        noise(ac, { dur: 0.03, gain: 0.07, from: 6500, to: 2200, wet: 0.08, pan: Math.random() - 0.5 });
      },
      stop() {
        if (stopped) return;
        stopped = true;
        amp.gain.setTargetAtTime(0.0001, ac.currentTime, 0.04);
        zipAmp.gain.setTargetAtTime(0.0001, ac.currentTime, 0.04);
        setTimeout(() => {
          src.stop();
          zipSrc.stop();
        }, 250);
      },
    };
  },
  /**
   * Le sachet s'ouvre : l'air s'échappe (souffle grave puis clair, d'une oreille à l'autre),
   * un coup sourd, un accord de cloches et un scintillement qui monte.
   */
  burst() {
    const ac = ctx();
    if (!ac) return;
    thump(ac, { gain: 0.2, freq: 120, dur: 0.3 });
    noise(ac, { dur: 0.16, gain: 0.09, from: 500, to: 180, type: 'lowpass', wet: 0.2 });
    noise(ac, { dur: 0.55, gain: 0.06, from: 700, to: 9500, q: 1.3, wet: 0.5, pan: -0.5 });
    noise(ac, { start: 0.04, dur: 0.6, gain: 0.05, from: 1100, to: 11000, q: 1.6, wet: 0.5, pan: 0.5 });
    foil(ac, { start: 0.02, dur: 0.3, gain: 0.05, density: 140, highpass: 4000, wet: 0.3 });
    [NOTE.C5, NOTE.G5, NOTE.E6].forEach((freq, i) => bell(ac, { freq, start: 0.03 + i * 0.03, gain: 0.03, dur: 1.1, pan: -0.5 + i * 0.5 }));
    sparkles(ac, { start: 0.12, count: 5, gain: 0.028 });
  },
  /** La roulette s'arrête : un loquet qui s'enclenche. */
  land() {
    const ac = ctx();
    if (!ac) return;
    thump(ac, { gain: 0.26, freq: 150, dur: 0.18 });
    tone(ac, { freq: 1150, to: 700, dur: 0.05, type: 'triangle', gain: 0.16, attack: 0.002, wet: 0.2 });
    noise(ac, { dur: 0.03, gain: 0.05, from: 5000, to: 1800, type: 'highpass', wet: 0.1 });
    bell(ac, { freq: NOTE.G5, start: 0.02, gain: 0.025, dur: 0.7 });
  },
  /** Tension avant une carte rare : montée, battements de cœur qui s'accélèrent, frémissement aigu. */
  suspense(rank = 3) {
    const ac = ctx();
    if (!ac) return;
    const dur = rank >= 4 ? 1.1 : 0.8;
    riser(ac, { dur, gain: rank >= 4 ? 0.06 : 0.045, from: 180, to: rank >= 4 ? 2400 : 1500 });
    let at = 0;
    for (let gap = 0.3, i = 0; at < dur - 0.1; i++, gap *= 0.8) {
      thump(ac, { start: at, gain: 0.09 + i * 0.025, freq: 75, dur: 0.13 });
      thump(ac, { start: at + 0.09, gain: 0.05 + i * 0.015, freq: 62, dur: 0.11 });
      at += gap;
    }
    for (let i = 0; i < Math.round(dur / 0.07); i++) {
      bell(ac, { freq: NOTE.C7 * (i % 2 ? 1.5 : 1), start: i * 0.07, gain: 0.004 + (i * 0.07 * 0.018) / dur, dur: 0.25, wet: 0.5, pan: i % 2 ? 0.5 : -0.5 });
    }
  },
  /** Retournement de la carte : un froissement de papier glacé. */
  flip() {
    const ac = ctx();
    if (!ac) return;
    noise(ac, { dur: 0.14, gain: 0.1, from: 3600, to: 1400, type: 'highpass', wet: 0.1 });
    tone(ac, { freq: 260, to: 170, dur: 0.1, type: 'triangle', gain: 0.08, attack: 0.004, wet: 0.1 });
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
  /**
   * Cliquetis de la roulette : un claquet de bois. `k` = avancement du tour (0 à 1) : en
   * ralentissant, chaque clic devient plus grave, plus net et plus présent.
   */
  tick(k = 0) {
    const ac = ctx();
    if (!ac) return;
    const freq = (1050 - 420 * k) * (0.96 + Math.random() * 0.08);
    const pan = (Math.random() - 0.5) * 0.3;
    tone(ac, { freq, to: freq * 0.55, dur: 0.03 + 0.025 * k, type: 'triangle', gain: 0.11 + 0.1 * k, attack: 0.002, wet: 0.04 + 0.1 * k, pan });
    noise(ac, { dur: 0.02, gain: 0.06 + 0.04 * k, from: 6000, to: 3000, type: 'highpass', wet: 0, pan });
    if (k > 0.8) tone(ac, { freq: freq * 0.25, to: 60, dur: 0.06, gain: 0.05 * k, attack: 0.003, wet: 0.1 });
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
