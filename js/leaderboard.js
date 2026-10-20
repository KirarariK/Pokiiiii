/**
 * Classement local — top scores en localStorage.
 * Colonnes : combats, captures, dex, ascension.
 */
import { icon } from './icons.js';
import { speciesCount } from './pokemon.js';

const KEY = 'pokiiiii_leaderboard_v1';
const MAX = 10;

export function ascensionFromState(state) {
  if (typeof state.ascensionLevel === 'number' && state.ascensionLevel > 0) {
    return state.ascensionLevel;
  }
  if (typeof state.stats?.ascension === 'number') return state.stats.ascension;
  const zones = state.unlockedZones?.length || 0;
  const maxLvl = Math.max(1, ...(state.team || []).map((p) => p.level || 1));
  const dex = Object.keys(state.caught || {}).length;
  return zones * 10 + Math.floor(maxLvl / 2) + Math.floor(dex / 5);
}

export function snapshotFromState(state) {
  return {
    name: (state.playerName || 'Dresseur').slice(0, 16),
    battles: state.stats?.battles || 0,
    catches: state.stats?.catches || 0,
    dex: Object.keys(state.caught || {}).length,
    ascension: ascensionFromState(state),
    at: Date.now(),
  };
}

export function getLeaderboard() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveList(list) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

function rankKey(e) {
  return e.ascension * 1e9 + e.dex * 1e6 + e.catches * 1e3 + e.battles;
}

export function submitScore(state) {
  const entry = snapshotFromState(state);
  let list = getLeaderboard();
  const byName = list.findIndex((e) => e.name === entry.name);
  if (byName >= 0) {
    if (rankKey(entry) >= rankKey(list[byName])) list[byName] = entry;
  } else {
    list.push(entry);
  }
  list.sort((a, b) => rankKey(b) - rankKey(a));
  list = list.slice(0, MAX);
  saveList(list);
  return list;
}

export function clearLeaderboard() {
  localStorage.removeItem(KEY);
}

export function renderLeaderboard(state) {
  const list = getLeaderboard();
  const current = snapshotFromState(state);
  const total = speciesCount();

  const rows =
    list.length === 0
      ? `<p class="muted lb-empty">Aucun score enregistré. Clique « Enregistrer mon score ».</p>`
      : `<ol class="lb-list">
      ${list
        .map((e, i) => {
          const me = e.name === current.name;
          return `
          <li class="lb-row ${me ? 'me' : ''}">
            <span class="lb-rank">${i + 1}</span>
            <div class="lb-body">
              <strong>${escapeHtml(e.name)}</strong>
              <div class="lb-stats">
                <span title="Combats">${icon('swords')} ${e.battles}</span>
                <span title="Captures">${icon('ball')} ${e.catches}</span>
                <span title="Dex">${icon('dex')} ${e.dex}/${total}</span>
                <span title="Ascension">${icon('flame')} ${e.ascension}</span>
              </div>
            </div>
          </li>`;
        })
        .join('')}
    </ol>`;

  return `
    <div class="panel-head">
      <h2>Classement</h2>
      <span class="muted">Local · top ${MAX}</span>
    </div>
    <div class="lb-wrap">
      <div class="lb-current">
        <div class="lb-current-ico">${icon('trophy')}</div>
        <div>
          <strong>${escapeHtml(current.name)}</strong>
          <p class="muted">Score actuel — Ascension ${current.ascension}</p>
          <div class="lb-stats">
            <span>${icon('swords')} ${current.battles} combats</span>
            <span>${icon('ball')} ${current.catches} captures</span>
            <span>${icon('dex')} ${current.dex}/${total}</span>
          </div>
        </div>
      </div>
      ${rows}
      <div class="lb-actions">
        <button type="button" class="btn-primary" data-lb-submit>
          ${icon('trophy')} Enregistrer mon score
        </button>
        <button type="button" class="btn-secondary" data-lb-clear>
          Effacer le classement
        </button>
      </div>
      <p class="muted lb-hint">Stocké sur cet appareil (localStorage). Ascension = niveau NG+ ou score de progression (zones, niveau, dex).</p>
    </div>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
