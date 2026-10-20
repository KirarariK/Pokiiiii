/** Ascension NG+ — prestige qui conserve dex, badges et niveau d’ascension */

import { ZONES, STARTERS } from './data/zones.js';
import { createPokemon, getSpecies, displayName } from './pokemon.js';
import { addLog } from './game-log.js';
import { initDailyBaselines } from './quests.js';
import { icon } from './icons.js';

const XP_PER_LEVEL = 0.12;
const MONEY_PER_LEVEL = 0.15;

export function ascensionBonuses(state) {
  const lvl = Math.max(0, state?.ascensionLevel || 0);
  return {
    level: lvl,
    xpMult: 1 + lvl * XP_PER_LEVEL,
    moneyMult: 1 + lvl * MONEY_PER_LEVEL,
  };
}

function badgeList(state) {
  const b = state?.badges;
  if (Array.isArray(b)) return b;
  if (b && typeof b === 'object') {
    return Object.entries(b)
      .filter(([k]) => k.startsWith('region:'))
      .map(([k]) => k.slice(7));
  }
  return [];
}

export function canAscend(state) {
  if (!state) return false;
  const zones = state.unlockedZones?.length || 0;
  const catches = state.stats?.catches || 0;
  const badges = badgeList(state).length;
  return zones >= 5 || catches >= 15 || badges >= 2;
}

export function ascendPreview(state) {
  const next = (state.ascensionLevel || 0) + 1;
  return {
    nextLevel: next,
    xpMult: 1 + next * XP_PER_LEVEL,
    moneyMult: 1 + next * MONEY_PER_LEVEL,
    keepDex: Object.keys(state.caught || {}).length,
    keepInsignes: badgeList(state).length,
  };
}

/**
 * Prestige : remet argent / zones / équipe / boîte.
 * Conserve : dex (seen/caught), badges, ascensionLevel, settings, nom, starterId, stats de vie.
 */
export function performAscension(state) {
  if (!canAscend(state)) return { ok: false, reason: 'locked' };

  const starterId =
    state.starterId ||
    state.team?.[0]?.speciesId ||
    STARTERS[0];
  const keptSeen = { ...(state.seen || {}) };
  const keptCaught = { ...(state.caught || {}) };
  const keptInsignes =
    state.badges && typeof state.badges === 'object' && !Array.isArray(state.badges)
      ? { ...state.badges }
      : Object.fromEntries(badgeList(state).map((r) => [`region:${r}`, { region: r, at: Date.now() }]));
  const settings = { ...(state.settings || { mute: false }) };
  const playerName = state.playerName || 'Ninja';
  const stats = { ...(state.stats || { battles: 0, catches: 0, moneyEarned: 0, playTime: 0 }) };
  const ascensionLevel = (state.ascensionLevel || 0) + 1;

  keptSeen[starterId] = true;
  keptCaught[starterId] = true;

  const starter = createPokemon(starterId, 5);

  state.ascensionLevel = ascensionLevel;
  state.money = 800;
  state.balls = { pokeball: 15, greatball: 2, ultraball: 0, masterball: 0 };
  state.team = [starter];
  state.box = [];
  state.seen = keptSeen;
  state.caught = keptCaught;
  state.badges = keptInsignes;
  state.unlockedZones = [ZONES[0].id];
  state.currentZone = ZONES[0].id;
  state.unlockedGens = [1];
  state.autoCatch = false;
  state.autoCatchBall = 'pokeball';
  state.battleSpeed = state.battleSpeed || 1;
  state.settings = settings;
  state.playerName = playerName;
  state.starterId = starterId;
  state.stats = stats;
  state.log = [];
  state.daily = null;
  state.dailyBaselines = null;
  state.expeditions = [];
  state.daycare = [];
  state.tutorialDone = true;
  initDailyBaselines(state);

  const sp = getSpecies(starterId);
  addLog(
    state,
    `Ascension N.${ascensionLevel} — nouveau départ avec ${displayName(sp)}. Dex et badges conservés.`,
    'unlock'
  );
  return { ok: true, level: ascensionLevel, starter };
}

export function tryAwardRegionBadge(state, zone) {
  if (!state || !zone?.region) return false;
  if (!state.badges || typeof state.badges !== 'object' || Array.isArray(state.badges)) {
    const regions = badgeList(state);
    state.badges = Object.fromEntries(regions.map((r) => [`region:${r}`, { region: r, at: Date.now() }]));
  }
  const key = `region:${zone.region}`;
  if (state.badges[key]) return false;
  // Badge région dès qu’une zone payante (ou 2e zone) est débloquée
  const regionZones = ZONES.filter((z) => z.region === zone.region);
  const unlockedInRegion = regionZones.filter((z) => state.unlockedZones.includes(z.id));
  if (unlockedInRegion.length < 2 && zone.unlockCost === 0) return false;
  state.badges[key] = { region: zone.region, at: Date.now() };
  addLog(state, `Insigne obtenu : village ${zone.region} !`, 'unlock');
  return true;
}

export function renderAscensionPanel(state) {
  const bonus = ascensionBonuses(state);
  const preview = ascendPreview(state);
  const ok = canAscend(state);
  const chips = badgeList(state)
    .map((b) => `<span class="badge-chip">${icon('badge')} ${b}</span>`)
    .join('');

  return `
    <div class="panel-head"><h2>Ascension</h2></div>
    <div class="ascend-card">
      <div class="ascend-ico">${icon('crown')}</div>
      <div>
        <strong>Niveau d’ascension ${bonus.level}</strong>
        <p class="muted">Bonus actuel : XP ×${bonus.xpMult.toFixed(2)} · Argent ×${bonus.moneyMult.toFixed(2)}</p>
      </div>
    </div>
    <div class="ascend-keep">
      <p><strong>Conservé</strong> : Bingo Book (${preview.keepDex}), badges (${preview.keepInsignes}), bonus d’ascension.</p>
      <p><strong>Réinitialisé</strong> : argent, zones, équipe, réserve, expéditions, dojo.</p>
    </div>
    <div class="badge-row">${chips || '<span class="muted">Aucun insigne village pour l’instant</span>'}</div>
    <p class="muted">Condition : 5 zones débloquées, 15 captures, ou 2 badges.</p>
    <button type="button" class="btn-primary" data-ascend-open ${ok ? '' : 'disabled'}>
      Ascension → N.${preview.nextLevel} (XP ×${preview.xpMult.toFixed(2)} · 両 ×${preview.moneyMult.toFixed(2)})
    </button>`;
}

export function renderAscendConfirmModal(state) {
  const preview = ascendPreview(state);
  return `
    <div class="ascend-modal">
      <div class="ascend-ico">${icon('crown')}</div>
      <h2>Confirmer l’ascension ?</h2>
      <p>Vous passez au niveau <strong>${preview.nextLevel}</strong>. Dex et badges sont gardés ; argent, zones et équipe sont remis à zéro.</p>
      <p class="muted">Nouveaux bonus : XP ×${preview.xpMult.toFixed(2)} · Argent ×${preview.moneyMult.toFixed(2)}</p>
      <div class="tutorial-actions">
        <button type="button" class="btn-secondary" data-ascend-cancel>Annuler</button>
        <button type="button" class="btn-danger" data-ascend-confirm>Ascension</button>
      </div>
    </div>`;
}
