import { addLog } from './game-log.js';

/** Définitions de quêtes journalières */
export const QUEST_DEFS = [
  {
    id: 'win_10',
    title: 'Combattant',
    desc: 'Gagner 10 combats 1v1',
    icon: 'swords',
    target: 10,
    track: 'battles',
    reward: { money: 1500, balls: { pokeball: 5 } },
  },
  {
    id: 'catch_3',
    title: 'Captureur',
    desc: 'Capturer 3 Pokémon',
    icon: 'ball',
    target: 3,
    track: 'catches',
    reward: { money: 2000, balls: { greatball: 2 } },
  },
  {
    id: 'earn_5k',
    title: 'Économe',
    desc: 'Gagner 5 000 ₽',
    icon: 'coin',
    target: 5000,
    track: 'moneyEarned',
    reward: { money: 1000, balls: { pokeball: 10 } },
  },
  {
    id: 'play_15m',
    title: 'Session',
    desc: 'Jouer 15 minutes',
    icon: 'pass',
    target: 900,
    track: 'playTime',
    reward: { money: 800, balls: { ultraball: 1 } },
  },
];

export const PASS_TIERS = [
  { id: 1, need: 1, reward: { money: 500 }, free: true },
  { id: 2, need: 3, reward: { balls: { pokeball: 5 } }, free: true },
  { id: 3, need: 5, reward: { money: 1500 }, free: true },
  { id: 4, need: 8, reward: { balls: { greatball: 3 } }, free: true },
  { id: 5, need: 12, reward: { money: 3000 }, free: true },
  { id: 6, need: 18, reward: { balls: { ultraball: 2 } }, free: true },
  { id: 7, need: 25, reward: { money: 5000 }, free: true },
  { id: 8, need: 35, reward: { balls: { masterball: 1 } }, free: true },
];

export function todayKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function ensureDaily(state) {
  const key = todayKey();
  if (!state.daily || state.daily.day !== key) {
    state.daily = {
      day: key,
      quests: QUEST_DEFS.map((q) => ({
        id: q.id,
        progress: 0,
        claimed: false,
      })),
      passXp: 0,
      claimedTiers: [],
      claimed: false,
    };
  }
  return state.daily;
}

export function syncQuestProgress(state) {
  const daily = ensureDaily(state);
  for (const q of daily.quests) {
    const def = QUEST_DEFS.find((d) => d.id === q.id);
    if (!def || q.claimed) continue;
    const base = state.dailyBaselines?.[q.id];
    // Baselines set at day start
    if (state.dailyBaselines && base != null) {
      const cur = state.stats[def.track] || 0;
      q.progress = Math.min(def.target, Math.max(0, cur - base));
    }
  }
}

export function initDailyBaselines(state) {
  ensureDaily(state);
  if (!state.dailyBaselines || state.dailyBaselines._day !== state.daily.day) {
    state.dailyBaselines = { _day: state.daily.day };
    for (const def of QUEST_DEFS) {
      state.dailyBaselines[def.id] = state.stats[def.track] || 0;
    }
  }
}

function grantReward(state, reward) {
  if (reward.money) state.money += reward.money;
  if (reward.balls) {
    for (const [k, v] of Object.entries(reward.balls)) {
      state.balls[k] = (state.balls[k] || 0) + v;
    }
  }
}

export function claimQuest(state, questId) {
  ensureDaily(state);
  syncQuestProgress(state);
  const q = state.daily.quests.find((x) => x.id === questId);
  const def = QUEST_DEFS.find((d) => d.id === questId);
  if (!q || !def || q.claimed) return { ok: false, reason: 'unavailable' };
  if (q.progress < def.target) return { ok: false, reason: 'incomplete' };
  q.claimed = true;
  grantReward(state, def.reward);
  state.daily.passXp += 1;
  addLog(state, `Quête terminée : ${def.title}`, 'unlock');
  return { ok: true, reward: def.reward };
}

export function claimPassTier(state, tierId) {
  ensureDaily(state);
  const tier = PASS_TIERS.find((t) => t.id === tierId);
  if (!tier) return { ok: false };
  if (state.daily.claimedTiers.includes(tierId)) return { ok: false, reason: 'claimed' };
  if (state.daily.passXp < tier.need) return { ok: false, reason: 'locked' };
  state.daily.claimedTiers.push(tierId);
  grantReward(state, tier.reward);
  addLog(state, `Pass journalier — palier ${tierId} récupéré`, 'unlock');
  return { ok: true, reward: tier.reward };
}

export function pendingQuestCount(state) {
  ensureDaily(state);
  syncQuestProgress(state);
  return state.daily.quests.filter((q) => {
    const def = QUEST_DEFS.find((d) => d.id === q.id);
    return def && !q.claimed && q.progress >= def.target;
  }).length;
}

export function pendingPassCount(state) {
  ensureDaily(state);
  return PASS_TIERS.filter(
    (t) => state.daily.passXp >= t.need && !state.daily.claimedTiers.includes(t.id)
  ).length;
}

export function hubBadgeCount(state) {
  return pendingQuestCount(state) + pendingPassCount(state);
}
