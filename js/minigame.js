/**
 * Mini-jeu Hub — « Réaction capture »
 * Timing : cliquer quand l’anneau s’aligne sur la zone cible.
 * Récompenses : Balls + argent. UI SVG, français, sans emoji.
 */
import { icon } from './icons.js';
import { BALLS } from './game.js';
import { addLog } from './game-log.js';

const COOLDOWN_MS = 45_000;
const DAILY_MAX = 12;
const SWEET_DEG = 28;
const PERFECT_DEG = 8;

export function ensureMinigame(state) {
  if (!state.minigame) {
    state.minigame = { lastPlay: 0, playsToday: 0, day: null, bestScore: 0 };
  }
  const day = new Date().toDateString();
  if (state.minigame.day !== day) {
    state.minigame.day = day;
    state.minigame.playsToday = 0;
  }
  return state.minigame;
}

export function canPlay(state) {
  const mg = ensureMinigame(state);
  if (mg.playsToday >= DAILY_MAX) return { ok: false, reason: 'daily' };
  const left = COOLDOWN_MS - (Date.now() - (mg.lastPlay || 0));
  if (left > 0) return { ok: false, reason: 'cooldown', ms: left };
  return { ok: true };
}

function gradeTiming(offsetDeg) {
  const a = Math.abs(offsetDeg);
  if (a <= PERFECT_DEG / 2) return 'perfect';
  if (a <= SWEET_DEG / 2) return 'good';
  if (a <= SWEET_DEG) return 'ok';
  return 'miss';
}

function rewardsFor(grade) {
  switch (grade) {
    case 'perfect':
      return { money: 600, balls: { pokeball: 3, greatball: 1 }, score: 100 };
    case 'good':
      return { money: 280, balls: { pokeball: 2 }, score: 70 };
    case 'ok':
      return { money: 100, balls: { pokeball: 1 }, score: 40 };
    default:
      return { money: 0, balls: {}, score: 0 };
  }
}

export function resolveAttempt(state, needleDeg, targetDeg) {
  const gate = canPlay(state);
  if (!gate.ok) return { ok: false, reason: gate.reason, ms: gate.ms };

  const mg = ensureMinigame(state);
  const delta = ((needleDeg - targetDeg + 540) % 360) - 180;
  const grade = gradeTiming(delta);
  const reward = rewardsFor(grade);

  mg.lastPlay = Date.now();
  mg.playsToday++;
  if (reward.score > (mg.bestScore || 0)) mg.bestScore = reward.score;

  if (reward.money) {
    state.money += reward.money;
    state.stats.moneyEarned = (state.stats.moneyEarned || 0) + reward.money;
  }
  for (const [k, v] of Object.entries(reward.balls)) {
    state.balls[k] = (state.balls[k] || 0) + v;
  }

  const label =
    grade === 'perfect' ? 'Parfait' : grade === 'good' ? 'Bien' : grade === 'ok' ? 'Correct' : 'Raté';

  const bits = [];
  if (reward.money) bits.push(`+${reward.money} ₽`);
  for (const [k, v] of Object.entries(reward.balls)) {
    bits.push(`+${v} ${BALLS[k]?.name || k}`);
  }
  const rewardTxt = bits.length ? bits.join(' · ') : 'Aucune récompense';
  addLog(state, `Réaction capture — ${label} (${rewardTxt})`, 'bonus');

  return { ok: true, grade, label, reward, delta, rewardTxt };
}

export function renderMinigame(state) {
  ensureMinigame(state);
  const gate = canPlay(state);
  const mg = state.minigame;
  const sweetStart = 90 - SWEET_DEG / 2;
  const sweetEnd = 90 + SWEET_DEG / 2;
  const r = 90;
  const cx = 120;
  const cy = 120;

  const polar = (deg, rad) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  };
  const arc = (from, to, rad) => {
    const [x1, y1] = polar(from, rad);
    const [x2, y2] = polar(to, rad);
    const large = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${rad} ${rad} 0 ${large} 1 ${x2} ${y2}`;
  };

  let status = 'Prêt — clique quand l’aiguille entre dans la zone.';
  if (!gate.ok && gate.reason === 'daily') {
    status = `Limite du jour atteinte (${DAILY_MAX}). Reviens demain.`;
  } else if (!gate.ok && gate.reason === 'cooldown') {
    status = `Repos… ${Math.ceil(gate.ms / 1000)} s`;
  }

  return `
    <div class="panel-head">
      <h2>Réaction capture</h2>
      <span class="muted">${mg.playsToday}/${DAILY_MAX} aujourd’hui</span>
    </div>
    <div class="mg-wrap">
      <p class="mg-intro muted">Aligne l’aiguille sur la zone claire, puis capture. Récompenses : Balls et argent.</p>
      <div class="mg-stage" id="mg-stage" data-target="90" data-running="0">
        <svg class="mg-svg" viewBox="0 0 240 240" aria-hidden="true">
          <circle cx="${cx}" cy="${cy}" r="${r}" class="mg-ring-bg" />
          <path d="${arc(sweetStart, sweetEnd, r)}" class="mg-sweet" />
          <path d="${arc(90 - PERFECT_DEG / 2, 90 + PERFECT_DEG / 2, r)}" class="mg-perfect" />
          <circle cx="${cx}" cy="${cy}" r="14" class="mg-hub" />
          <g id="mg-needle" class="mg-needle" transform="rotate(0 ${cx} ${cy})">
            <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - r + 6}" />
            <circle cx="${cx}" cy="${cy - r + 6}" r="5" />
          </g>
        </svg>
        <div class="mg-status" id="mg-status">${status}</div>
      </div>
      <div class="mg-actions">
        <button type="button" class="btn-primary" id="mg-start" ${gate.ok ? '' : 'disabled'}>
          ${icon('dice')} Lancer
        </button>
        <button type="button" class="btn-secondary" id="mg-capture" disabled>
          ${icon('ball')} Capturer
        </button>
      </div>
      <div class="mg-meta">
        <div class="stat-box"><span>Meilleur score</span><strong>${mg.bestScore || 0}</strong></div>
        <div class="stat-box"><span>Cooldown</span><strong>${Math.round(COOLDOWN_MS / 1000)} s</strong></div>
      </div>
      <p class="muted mg-hint">Parfait → gros gain · Bien → Balls · Raté → rien. Une tentative consomme le cooldown.</p>
    </div>`;
}

export function bindMinigame(state, { onDone } = {}) {
  const stage = document.getElementById('mg-stage');
  const needle = document.getElementById('mg-needle');
  const btnStart = document.getElementById('mg-start');
  const btnCap = document.getElementById('mg-capture');
  const status = document.getElementById('mg-status');
  if (!stage || !needle || !btnStart || !btnCap) return;

  let raf = 0;
  let angle = 0;
  let speed = 220;
  let running = false;
  const target = Number(stage.dataset.target) || 90;
  const cx = 120;
  const cy = 120;

  const stopAnim = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    running = false;
    stage.dataset.running = '0';
  };

  let last = 0;
  const tick = (t) => {
    if (!running) return;
    if (!last) last = t;
    const dt = (t - last) / 1000;
    last = t;
    angle = (angle + speed * dt) % 360;
    needle.setAttribute('transform', `rotate(${angle} ${cx} ${cy})`);
    raf = requestAnimationFrame(tick);
  };

  btnStart.onclick = () => {
    const gate = canPlay(state);
    if (!gate.ok) {
      status.textContent =
        gate.reason === 'daily'
          ? `Limite du jour atteinte (${DAILY_MAX}).`
          : `Cooldown : ${Math.ceil((gate.ms || 0) / 1000)} s`;
      return;
    }
    stopAnim();
    angle = Math.random() * 360;
    speed = 180 + Math.random() * 120;
    running = true;
    stage.dataset.running = '1';
    last = 0;
    btnStart.disabled = true;
    btnCap.disabled = false;
    status.textContent = 'Tourne… clique Capturer dans la zone claire.';
    raf = requestAnimationFrame(tick);
  };

  btnCap.onclick = () => {
    if (!running) return;
    stopAnim();
    btnCap.disabled = true;
    const res = resolveAttempt(state, angle, target);
    if (!res.ok) {
      status.textContent = res.reason === 'daily' ? 'Limite du jour.' : 'Cooldown actif.';
      btnStart.disabled = !canPlay(state).ok;
      return;
    }
    status.textContent = `${res.label} — ${res.rewardTxt}`;
    stage.classList.toggle('mg-hit', res.grade !== 'miss');
    stage.classList.toggle('mg-miss', res.grade === 'miss');
    if (typeof onDone === 'function') onDone(res);
  };
}
