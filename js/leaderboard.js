import { icon } from './icons.js';

const KEY = 'shinobiiii_leaderboard_v1';

function badgeCount(state) {
  const b = state.badges;
  if (Array.isArray(b)) return b.length;
  if (b && typeof b === 'object') return Object.keys(b).length;
  return 0;
}

function scoreOf(e) {
  return (e.dex || 0) + (e.badges || 0) * 5 + (e.ascension || 0) * 25 + (e.catches || 0);
}

export function readLeaderboard() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Met à jour le classement local avec l’état actuel, garde le top 25. */
export function pushLeaderboard(state) {
  const entry = {
    name: state.playerName || 'Ninja',
    battles: state.stats?.battles || 0,
    catches: state.stats?.catches || 0,
    dex: Object.keys(state.caught || {}).length,
    badges: badgeCount(state),
    ascension: state.ascensionLevel || 0,
    at: Date.now(),
  };
  let list = readLeaderboard();
  const idx = list.findIndex((e) => e.name === entry.name);
  if (idx >= 0) {
    const prev = list[idx];
    if (scoreOf(entry) >= scoreOf(prev)) list[idx] = entry;
  } else {
    list.push(entry);
  }
  list.sort((a, b) => scoreOf(b) - scoreOf(a));
  list = list.slice(0, 25);
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export function renderLeaderboardPanel(state) {
  const list = pushLeaderboard(state);
  return `
    <div class="panel-head"><h2>Classement</h2>${icon('trophy')}</div>
    <p class="muted">Local à cet appareil — captures, badges et ascension</p>
    <div class="lb-list">${
      list.length
        ? list
            .map(
              (e, i) => `<div class="lb-row">
        <span class="lb-rank">${i + 1}</span>
        <div>
          <strong>${e.name}</strong>
          <p class="muted">Dex ${e.dex} · Captures ${e.catches || 0} · Badges ${e.badges} · Asc ${e.ascension}</p>
        </div>
      </div>`,
            )
            .join('')
        : '<p class="muted">Aucune entrée pour l’instant.</p>'
    }</div>`;
}
