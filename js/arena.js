/**
 * Défis Kage / Champions — défis 1v1 auto vs équipe de gym
 */
import {
  GYMS, getGym, previousGym, gymsByRegion, REGION_ORDER, REGION_LABELS,
} from './data/gyms.js';
import {
  createPokemon, calcDamage, gainXp, pokeName, getSpecies, refreshStats, xpFromWild,
} from './pokemon.js';
import { addLog } from './game-log.js';
import { TYPE_COLORS, TYPE_FR } from './data/types.js';
import { icon } from './icons.js';

const MAX_TURNS = 80;

function activeFighter(state, gen = null) {
  return (
    state.team.find((p) => {
      if (!(p.hp > 0)) return false;
      if (gen == null) return true;
      const g = Number(getSpecies(p.speciesId)?.generation) || 1;
      return g === Number(gen);
    }) || null
  );
}

function healTeamSilent(state) {
  for (const p of state.team) {
    refreshStats(p);
    p.hp = p.maxHp;
  }
}

export function ensureArena(state) {
  if (!state) return state;
  if (Array.isArray(state.badges)) {
    const migrated = {};
    for (const b of state.badges) {
      if (typeof b === 'string') migrated[`region:${b}`] = { region: b, at: Date.now() };
    }
    state.badges = migrated;
  }
  if (!state.badges || typeof state.badges !== 'object') state.badges = {};
  if (typeof state.arenaWins !== 'number') state.arenaWins = 0;
  return state;
}

export function teamMaxLevel(state) {
  if (!state.team?.length) return 1;
  return Math.max(1, ...state.team.map((p) => p.level || 1));
}

export function hasBadge(state, badgeId) {
  ensureArena(state);
  return !!state.badges?.[badgeId];
}

/** Débloqué si badge précédent (1re libre) OU niveau ≥ minTeamLevel */
export function canChallengeGym(state, gymOrId) {
  ensureArena(state);
  const gym = typeof gymOrId === 'string' ? getGym(gymOrId) : gymOrId;
  if (!gym) return { ok: false, reason: 'unknown' };
  if (hasBadge(state, gym.badgeId)) return { ok: false, reason: 'already' };

  const lvl = teamMaxLevel(state);
  const prev = previousGym(gym);
  const hasPrev = !prev || hasBadge(state, prev.badgeId);
  const levelOk = lvl >= gym.minTeamLevel;

  if (hasPrev || levelOk) {
    return { ok: true, reason: hasPrev && levelOk ? 'ready' : hasPrev ? 'badge-path' : 'level-skip', gym };
  }
  return {
    ok: false,
    reason: 'locked',
    needBadge: prev?.badgeId,
    needLeader: prev?.leaderName,
    need: gym.minTeamLevel,
    have: lvl,
  };
}

export const canChallenge = canChallengeGym;

function buildGymFighter(entry) {
  const mon = createPokemon(entry.speciesId, entry.level, { iv: 10, shiny: false });
  refreshStats(mon);
  mon.hp = mon.maxHp;
  return mon;
}

function simulateDuel(playerMon, gymMon) {
  const log = [];
  let turns = 0;
  let next = (playerMon.spe ?? 0) >= (gymMon.spe ?? 0) ? 'player' : 'gym';
  while (playerMon.hp > 0 && gymMon.hp > 0 && turns < MAX_TURNS) {
    turns++;
    const atk = next === 'player' ? playerMon : gymMon;
    const def = next === 'player' ? gymMon : playerMon;
    // Duel serré : léger avantage joueur, pas de curbstomp
    const hit = calcDamage(atk, def, next === 'gym' ? 48 : 52);
    def.hp = Math.max(0, def.hp - hit.damage);
    log.push({ who: next, attacker: pokeName(atk), defender: pokeName(def), damage: hit.damage, label: hit.label });
    if (def.hp <= 0) break;
    next = next === 'player' ? 'gym' : 'player';
  }
  return { win: gymMon.hp <= 0 && playerMon.hp > 0, turns, log };
}

export function challengeGym(state, gymId) {
  ensureArena(state);
  const gym = getGym(gymId);
  if (!gym) return { ok: false, reason: 'unknown' };
  const gate = canChallengeGym(state, gym);
  if (!gate.ok) return { ok: false, ...gate };

  healTeamSilent(state);
  const gymGen = Number(gym.gen) || 1;
  const gymTeam = gym.pokemon.filter((e) => getSpecies(e.speciesId)).map(buildGymFighter);
  if (!gymTeam.length) return { ok: false, reason: 'empty-team' };

  if (!activeFighter(state, gymGen)) {
    return {
      ok: false,
      reason: 'no-gen-fighter',
      needGen: gymGen,
      message: `Il faut un shinobi saga ${gymGen} vivant dans l’escouade pour ce défi.`,
    };
  }

  const duelLogs = [];
  let gymIdx = 0;
  let playerFaints = 0;

  while (gymIdx < gymTeam.length) {
    const fighter = activeFighter(state, gymGen);
    if (!fighter) {
      addLog(state, `Défaite contre ${gym.leaderName}…`, 'faint');
      healTeamSilent(state);
      return { ok: true, win: false, gym, duels: duelLogs, playerFaints };
    }
    const foe = gymTeam[gymIdx];
    const result = simulateDuel(fighter, foe);
    duelLogs.push({ gymMon: pokeName(foe), speciesId: foe.speciesId, level: foe.level, ...result });
    if (result.win) {
      const xp = Math.floor(xpFromWild(foe, fighter.level) * 1.4);
      const info = gainXp(fighter, xp);
      addLog(state, `${pokeName(fighter)} bat le ${pokeName(foe)} de ${gym.leaderName} (+${xp} XP)`, 'battle');
      if (info.leveled) addLog(state, `${pokeName(fighter)} monte au N.${info.newLevel} !`, 'level');
      // Idle QoL : soigne entre adversaires du gym
      for (const mon of state.team) {
        if (mon.hp > 0) { refreshStats(mon); mon.hp = mon.maxHp; }
      }
      gymIdx++;
    } else {
      addLog(state, `${pokeName(fighter)} est K.O. face à ${pokeName(foe)} !`, 'faint');
      fighter.hp = 0;
      playerFaints++;
    }
  }

  state.money += gym.rewardMoney;
  state.stats.moneyEarned = (state.stats.moneyEarned || 0) + gym.rewardMoney;
  state.stats.battles = (state.stats.battles || 0) + gymTeam.length;
  state.badges[gym.badgeId] = {
    gymId: gym.id,
    badge: gym.badgeId,
    badgeName: gym.badgeName,
    at: Date.now(),
    leader: gym.leaderName,
    region: gym.region,
    type: gym.type,
    champion: !!gym.champion,
  };
  state.arenaWins = (state.arenaWins || 0) + 1;
  const kind = gym.champion ? 'Titre de Kage' : (gym.badgeName || 'Insigne');
  addLog(state, `${kind} remporté : ${gym.leaderName} (${REGION_LABELS[gym.region] || gym.region}) — +${gym.rewardMoney}両`, 'unlock');
  healTeamSilent(state);
  return { ok: true, win: true, gym, duels: duelLogs, playerFaints, money: gym.rewardMoney, reward: gym.rewardMoney, badgeId: gym.badgeId, badge: gym.badgeId, badgeName: gym.badgeName };
}

export function ownedBadgeIds(state) {
  ensureArena(state);
  return Object.keys(state.badges).filter((k) => !k.startsWith('region:'));
}

export function badgeCount(state) {
  return ownedBadgeIds(state).length;
}

/** Défis Kage actuellement défiables (compteur Hub) */
export function readyGymCount(state) {
  ensureArena(state);
  return GYMS.filter((g) => canChallengeGym(state, g).ok).length;
}

export function arenaSummary(state) {
  ensureArena(state);
  return {
    owned: ownedBadgeIds(state).length,
    total: GYMS.length,
    wins: state.arenaWins || 0,
    ready: readyGymCount(state),
    byRegion: REGION_ORDER.map((r) => {
      const list = gymsByRegion(r);
      return { region: r, label: REGION_LABELS[r], got: list.filter((g) => hasBadge(state, g.badgeId)).length, total: list.length };
    }),
  };
}

export function badgeIconSvg(type, owned = true) {
  const color = TYPE_COLORS[type] || '#f5c518';
  const opacity = owned ? 1 : 0.28;
  return `<svg class="gym-badge-svg" viewBox="0 0 40 48" aria-hidden="true" style="opacity:${opacity}">
    <circle cx="20" cy="16" r="13" fill="none" stroke="${color}" stroke-width="2.2"/>
    <circle cx="20" cy="16" r="6.5" fill="${color}" opacity="0.85"/>
    <path d="M13 26 L10 42 L20 36 L30 42 L27 26" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
  </svg>`;
}

function buildArenasHtml(state) {
  ensureArena(state);
  const summary = arenaSummary(state);
  const lvl = teamMaxLevel(state);
  const showcase = GYMS.map((g) => {
    const owned = hasBadge(state, g.badgeId);
    const label = owned ? (g.champion ? 'Titre' : 'Insigne') : '—';
    return `<div class="badge-slot ${owned ? 'owned' : 'empty'}" title="${g.badgeName || g.leaderName} — ${TYPE_FR[g.type] || g.type}">
      ${badgeIconSvg(g.type, owned)}
      <span>${label}</span>
    </div>`;
  }).join('');

  const progressBars = summary.byRegion.map((r) => {
    const pct = r.total ? Math.round((r.got / r.total) * 100) : 0;
    return `<div class="arena-progress-row" title="${r.label}">
      <span>${r.label}</span>
      <div class="arena-progress-bar"><div style="width:${pct}%"></div></div>
      <strong>${r.got}/${r.total}</strong>
    </div>`;
  }).join('');

  const regions = REGION_ORDER.map((region) => {
    const list = gymsByRegion(region);
    const cards = list.map((g) => {
      const gate = canChallengeGym(state, g);
      const owned = hasBadge(state, g.badgeId);
      const teamPreview = g.pokemon.map((p) => {
        const sp = getSpecies(p.speciesId);
        return sp ? `${sp.nameFr || sp.name} N.${p.level}` : `? N.${p.level}`;
      }).join(', ');
      let status, btn;
      if (owned) {
        status = `<span class="arena-status won">${g.badgeName || 'Insigne'} obtenu</span>`;
        btn = '<button type="button" class="btn-secondary" disabled>Obtenu</button>';
      } else if (gate.ok) {
        status = `<span class="arena-status ready">Disponible · N.${g.minTeamLevel}+</span>`;
        btn = `<button type="button" class="btn-primary" data-challenge-gym="${g.id}">Défier</button>`;
      } else {
        const tip = gate.needLeader
          ? `Battre ${gate.needLeader} ou atteindre N.${gate.need}`
          : `Niveau d’équipe N.${gate.need} requis (actuel N.${gate.have})`;
        status = `<span class="arena-status locked">${tip}</span>`;
        btn = '<button type="button" class="btn-secondary" disabled>Verrouillé</button>';
      }
      const ico = g.champion ? icon('trophy') : badgeIconSvg(g.type, owned || gate.ok);
      return `<article class="arena-card ${owned ? 'done' : gate.ok ? 'ready' : 'locked'} ${g.champion ? 'champ' : ''}">
          <div class="arena-badge-ico">${ico}</div>
          <div class="arena-body">
            <strong>${g.name}</strong>
            <p>${g.champion ? 'Kage' : 'Examinateur'} <em>${g.leaderName}</em> · ${TYPE_FR[g.type] || g.type} · Saga ${g.gen}</p>
            <p class="muted arena-team">${teamPreview}</p>
            <p class="muted">${g.badgeName} · ${g.rewardMoney.toLocaleString('fr-FR')} 両</p>
            ${status}
          </div>
          <div class="arena-actions">${btn}</div>
        </article>`;
    }).join('');
    const got = list.filter((g) => hasBadge(state, g.badgeId)).length;
    return `<section class="arena-region">
        <h3>${REGION_LABELS[region]} <small class="muted">${got}/${list.length}</small></h3>
        <div class="arena-list">${cards}</div>
      </section>`;
  }).join('');

  return `
    <div class="panel-head">
      <h2>${icon('arena')} Défis Kage</h2>
      <span class="muted">${summary.owned}/${summary.total} badges · ${summary.wins} victoire(s) · Équipe N.${lvl}</span>
    </div>
    <div class="badge-showcase">
      <div class="badge-showcase-head">
        <span class="badge-showcase-ico">${icon('gymbadge')}</span>
        <div>
          <strong>Collection de badges</strong>
          <p class="muted">Défie les champions d’village par région.</p>
        </div>
      </div>
      <div class="arena-progress">${progressBars}</div>
      <div class="badge-grid">${showcase}</div>
    </div>
    ${regions}`;
}

/**
 * Monte le panneau Défis Kage dans `root` et branche les défis via handlers.onChallenge(gymId).
 */
export function renderArenasPanel(root, state, handlers = {}) {
  if (!root) return;
  ensureArena(state);
  root.innerHTML = buildArenasHtml(state);
  root.querySelectorAll('[data-challenge-gym]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onChallenge?.(btn.dataset.challengeGym);
    });
  });
}

/** HTML brut (tests / aperçu) */
export function renderArenaPanelHtml(state) {
  return buildArenasHtml(state);
}

export { GYMS, getGym, gymsByRegion, REGION_ORDER, REGION_LABELS, previousGym };
