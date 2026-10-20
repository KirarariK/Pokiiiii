import { addLog } from './game-log.js';
import { icon } from './icons.js';
import { gainXp } from './pokemon.js';
import { ensureDaily } from './quests.js';

const DAILY_LIMIT = 5;

export function ensureMinigame(state) {
  if (!state.minigame) state.minigame = { playsToday: 0, day: null, best: 0 };
  const day = new Date().toDateString();
  if (state.minigame.day !== day) {
    state.minigame.day = day;
    state.minigame.playsToday = 0;
  }
  return state.minigame;
}

export function canPlayMinigame(state) {
  return ensureMinigame(state).playsToday < DAILY_LIMIT;
}

/**
 * Récompense selon le score (0–100) : argent, Balls (« tickets »), XP lead + pass.
 */
export function resolveMinigame(state, score) {
  ensureMinigame(state);
  if (!canPlayMinigame(state)) return { ok: false, reason: 'limit' };

  const s = Math.max(0, Math.min(100, Math.round(score)));
  state.minigame.playsToday++;
  state.minigame.best = Math.max(state.minigame.best || 0, s);

  const money = Math.floor(s * 10);
  const balls = s >= 85 ? 4 : s >= 60 ? 2 : s >= 40 ? 1 : 0;
  const xp = Math.floor(s * 2.5);
  const passXp = s >= 70 ? 1 : 0;

  state.money += money;
  state.stats.moneyEarned = (state.stats.moneyEarned || 0) + money;
  if (balls) state.balls.pokeball = (state.balls.pokeball || 0) + balls;

  const lead = state.team?.find((p) => p.hp > 0) || state.team?.[0];
  let leveled = false;
  if (lead && xp > 0) {
    const res = gainXp(lead, xp);
    leveled = !!res.leveled;
  }

  if (passXp) {
    ensureDaily(state);
    state.daily.passXp = (state.daily.passXp || 0) + passXp;
  }

  const bits = [`+${money}両`];
  if (balls) bits.push(`+${balls} Parchemin`);
  if (xp) bits.push(`+${xp} XP`);
  if (passXp) bits.push(`+${passXp} XP pass`);
  addLog(state, `Mini-jeu ${s} pts → ${bits.join(' · ')}`, 'shop');

  return { ok: true, money, balls, xp, passXp, score: s, leveled };
}

export function renderMinigamePanel(state) {
  ensureMinigame(state);
  const left = DAILY_LIMIT - state.minigame.playsToday;
  return `
    <div class="panel-head"><h2>Mini-jeu</h2><span class="muted">${left}/${DAILY_LIMIT}</span></div>
    <div class="mg-card">${icon('dice')}<div>
      <strong>Réaction Capture</strong>
      <p class="muted">Lance, puis capture quand le curseur est au centre. Record : ${state.minigame.best || 0}</p>
    </div></div>
    <div class="mg-stage" id="mg-stage">
      <div class="mg-track"><div class="mg-zone"></div><div class="mg-cursor" id="mg-cursor"></div></div>
      <div class="mg-actions">
        <button type="button" class="btn-primary" id="mg-start" ${left <= 0 ? 'disabled' : ''}>Jouer</button>
        <button type="button" class="btn-secondary" id="mg-click" disabled>Capturer</button>
      </div>
      <p id="mg-result" class="muted">5 parties / jour · argent, Balls et XP selon la précision</p>
    </div>`;
}

export function bindMinigameHandlers(root, state, onDone) {
  const cursor = root.querySelector('#mg-cursor');
  const start = root.querySelector('#mg-start');
  const click = root.querySelector('#mg-click');
  const result = root.querySelector('#mg-result');
  if (!start || !cursor) return;

  let raf = 0;
  let t0 = 0;
  let running = false;

  const frame = (now) => {
    if (!running) return;
    cursor.style.left = `${((now - t0) / 11) % 100}%`;
    raf = requestAnimationFrame(frame);
  };

  start.onclick = () => {
    if (!canPlayMinigame(state)) return;
    running = true;
    t0 = performance.now();
    click.disabled = false;
    start.disabled = true;
    if (result) result.textContent = 'Vise le centre…';
    raf = requestAnimationFrame(frame);
  };

  click.onclick = () => {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    const x = parseFloat(cursor.style.left) || 0;
    const score = Math.max(0, Math.min(100, Math.round(100 - Math.abs(x - 50) * 4)));
    const res = resolveMinigame(state, score);
    click.disabled = true;
    start.disabled = !canPlayMinigame(state);
    if (result) {
      result.textContent = res.ok
        ? `Score ${score} · +${res.money}両${res.balls ? ` · +${res.balls} Ball` : ''}${res.xp ? ` · +${res.xp} XP` : ''}`
        : 'Limite quotidienne atteinte';
    }
    onDone?.(res);
  };
}
