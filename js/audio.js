/** Synthèses WebAudio — aucun fichier son externe */

let ctx = null;
let muted = false;

function getCtx() {
  if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
    return null;
  }
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function setMuted(value) {
  muted = !!value;
}

export function isMuted() {
  return muted;
}

export function syncMuteFromState(state) {
  muted = !!(state?.settings?.mute);
}

function tone(freq, dur, type = 'square', gain = 0.08, when = 0) {
  const ac = getCtx();
  if (!ac || muted) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const SFX = {
  hit() {
    tone(180, 0.07, 'square', 0.07);
    tone(120, 0.09, 'triangle', 0.05, 0.02);
  },
  win() {
    tone(440, 0.1, 'square', 0.07);
    tone(554, 0.12, 'square', 0.07, 0.08);
    tone(659, 0.18, 'square', 0.08, 0.16);
  },
  catch() {
    tone(520, 0.08, 'sine', 0.07);
    tone(780, 0.1, 'sine', 0.08, 0.07);
    tone(1040, 0.16, 'triangle', 0.07, 0.14);
  },
  levelup() {
    tone(392, 0.1, 'square', 0.06);
    tone(523, 0.1, 'square', 0.07, 0.09);
    tone(659, 0.1, 'square', 0.07, 0.18);
    tone(784, 0.2, 'triangle', 0.08, 0.27);
  },
  ui() {
    tone(660, 0.045, 'sine', 0.045);
  },
};

/** @param {'hit'|'win'|'catch'|'levelup'|'ui'} name */
export function play(name) {
  if (muted) return;
  const fn = SFX[name];
  if (fn) fn();
}

export function playFromEvents(events = []) {
  for (const ev of events) {
    if (ev.type === 'attack') play('hit');
    else if (ev.type === 'win') {
      play('win');
      if (ev.levelInfo?.leveled) play('levelup');
    } else if (ev.type === 'catch') play('catch');
    else if (ev.type === 'levelup') play('levelup');
  }
}
