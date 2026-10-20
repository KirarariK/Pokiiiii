import { TYPE_COLORS, TYPE_FR } from './data/types.js';
import {
  getSpecies,
  displayName,
  pokeName,
  artUrl,
  spriteUrl,
  canEvolve,
  xpForLevel,
  speciesCount,
  allSpecies,
} from './pokemon.js';
import {
  BALLS,
  ZONES,
  BRAND,
  isPokemonBusy,
  currentPlayGen,
  isPokemonOfGen,
  isGenUnlocked,
  ensureUnlockedGens,
  activeFighter,
} from './game.js';
import { resolveZoneBgClass } from './data/zones.js';
import { STARTERS_BY_GEN, GEN_META } from './data/starters.js';
import { icon } from './icons.js';
import { renderEventBanner } from './events.js';

const REGION_FR = {
  konoha: 'Konoha',
  suna: 'Suna',
  kiri: 'Kiri',
  kumo: 'Kumo',
  ame: 'Ame',
  oto: 'Oto',
  yugakure: 'Yugakure',
  yuki: 'Yuki',
  myoboku: 'Myôboku',
  iron: 'Pays du Fer',
  alliance: 'Alliance',
  kara: 'Kara',
  otsutsuki: 'Ôtsutsuki',
  // legacy fallbacks
  kanto: 'Konoha',
  johto: 'Suna',
  hoenn: 'Kiri',
};

function battleZoneTone(zone) {
  return resolveZoneBgClass(zone);
}

/** État filtre statut Bingo Book (complète opts de main.js) */
const dexExtra = { status: 'all' };
let lastDexArgs = null;
let dexStatusBound = false;

export function $(sel, root = document) {
  return root.querySelector(sel);
}

export function $$(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

export function typeBadges(types) {
  return (types || [])
    .map(
      (t) =>
        `<span class="type-badge" style="--tc:${TYPE_COLORS[t] || '#888'}">${TYPE_FR[t] || t}</span>`
    )
    .join('');
}

export function hpBar(hp, maxHp, opts = {}) {
  const pct = Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100));
  let color = '#4ade80';
  if (pct <= 50) color = '#facc15';
  if (pct <= 20) color = '#f87171';
  const label = opts.showLabel !== false
    ? `<span class="bar-label hp-text">${Math.max(0, Math.ceil(hp))}/${maxHp}</span>`
    : '';
  return `
    <div class="bar-row">
      <span class="bar-tag">PV</span>
      <div class="hp-bar" title="${Math.ceil(hp)}/${maxHp}">
        <div class="hp-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      ${label}
    </div>`;
}

export function xpBar(poke) {
  const cur = xpForLevel(poke.level);
  const next = xpForLevel(Math.min(100, poke.level + 1));
  const pct =
    poke.level >= 100 ? 100 : ((poke.xp - cur) / Math.max(1, next - cur)) * 100;
  return `
    <div class="bar-row">
      <span class="bar-tag xp">XP</span>
      <div class="xp-bar" title="XP ${poke.xp}">
        <div class="xp-fill" style="width:${Math.max(0, Math.min(100, pct))}%"></div>
      </div>
    </div>`;
}

export function renderPokeCard(poke, opts = {}) {
  const sp = getSpecies(poke.speciesId);
  const name = pokeName(poke);
  const evo = canEvolve(poke);
  return `
    <article class="poke-card ${opts.selected ? 'selected' : ''} ${poke.shiny ? 'shiny' : ''}" data-uid="${poke.uid}">
      <div class="poke-card-img">
        <div class="poke-card-glow" aria-hidden="true"></div>
        <img referrerpolicy="no-referrer" src="${artUrl(poke.speciesId)}" alt="${name}" loading="lazy"
          onerror="this.onerror=null;this.src='${spriteUrl(poke.speciesId)}'" />
        ${poke.shiny ? `<span class="shiny-badge shiny-sparkle" title="Aura rare">${icon('sparkle')}</span>` : ''}
        ${evo ? '<span class="evo-badge">Mode suivant</span>' : ''}
        <span class="card-gen gen-pill">S${sp?.generation || '?'}</span>
      </div>
      <div class="poke-card-body">
        <div class="poke-card-title">
          <strong>${name}</strong>
          <span class="lvl">N.${poke.level}</span>
        </div>
        <div class="types">${typeBadges(sp?.types)}</div>
        ${hpBar(poke.hp, poke.maxHp)}
        ${xpBar(poke)}
        <div class="stats-mini">
          <span>ATK ${poke.atk}</span>
          <span>DEF ${poke.def}</span>
          <span>VIT ${poke.spe}</span>
        </div>
        ${opts.actions || ''}
      </div>
    </article>`;
}

function floatHtml(float, side) {
  if (!float || float.side !== side) return '';
  const kindClass =
    float.kind === 'super'
      ? 'dmg-super'
      : float.kind === 'resist'
        ? 'dmg-resist'
        : float.kind === 'immune'
          ? 'dmg-immune'
          : '';
  return `<span class="dmg-num ${kindClass}">${float.text}</span>`;
}

export function renderBattle(state, battle) {
  const fighter = state.team.find((p) => p.hp > 0) || state.team[0];
  const wild = battle?.wild;
  const zone = ZONES.find((z) => z.id === state.currentZone);
  if (!wild || !fighter) {
    return `<div class="battle-empty">Préparation du duel 1v1…</div>`;
  }

  const wSp = getSpecies(wild.speciesId);
  const fSp = getSpecies(fighter.speciesId);
  const float = battle.lastFloat;
  const label = battle.lastLabel;
  const next = battle.nextActor;
  const actingAlly = !battle.over && next === 'player';
  const actingEnemy = !battle.over && next === 'wild';
  const regionKey = (zone?.region || 'konoha').toLowerCase();
  const regionLabel = REGION_FR[regionKey] || zone?.region || '';
  const zoneTone = battleZoneTone(zone);
  const zoneImg = zone?.image || '';
  const labelKind =
    battle.lastAttack?.typeMult === 0
      ? 'immune'
      : (battle.lastAttack?.typeMult ?? 1) >= 2
        ? 'super'
        : (battle.lastAttack?.typeMult ?? 1) < 1
          ? 'resist'
          : '';
  const turnHint = battle.over
    ? battle.result === 'win'
      ? 'Victoire'
      : battle.result === 'catch'
        ? 'Scellé'
        : 'Défaite'
    : actingAlly
      ? `${pokeName(fighter)} attaque`
      : `${pokeName(wild)} attaque`;

  return `
    <div class="battle-arena duel bg-region bg-region-${regionKey} ${zoneTone}${zoneImg ? ' has-zone-art' : ''}" style="--zone-bg:${zone?.bg || '#1a1a2e'};${zoneImg ? `--zone-art:url('${zoneImg}')` : ''}">
      <div class="battle-bg-overlay" aria-hidden="true"></div>
      <div class="battle-zone-label">${zone?.name || ''}${regionLabel ? ` · ${regionLabel}` : ''} · Saga ${zone?.gen || '?'} · 1v1</div>
      ${renderEventBanner()}
      <div class="battle-layout duel-grid">
        <div class="battle-side ally ${actingAlly ? 'acting' : ''}" data-side="ally">
          <div class="battle-info">
            <div class="battle-role">Votre shinobi</div>
            <div class="battle-name">
              ${pokeName(fighter)}${fighter.shiny ? ` <span class="shiny-inline">${icon('sparkle')}</span>` : ''}
              <span>N.${fighter.level}</span>
            </div>
            <div class="types">${typeBadges(fSp?.types)}</div>
            ${hpBar(fighter.hp, fighter.maxHp)}
            ${xpBar(fighter)}
          </div>
          <div class="sprite-wrap ally-wrap">
            <img referrerpolicy="no-referrer" class="battle-sprite ally-sprite ${fighter.hp <= 0 ? 'faint' : ''} ${fighter.shiny ? 'shiny-sparkle' : ''}"
              data-sid="${fighter.speciesId}" data-uid="${fighter.uid || ''}"
              src="${artUrl(fighter.speciesId)}" alt="${pokeName(fighter)}"
              onerror="this.onerror=null;this.src='${spriteUrl(fighter.speciesId)}'" />
            <div class="dmg-layer" data-dmg="ally">${floatHtml(float, 'ally')}</div>
            <div class="battle-platform ally-platform" aria-hidden="true"></div>
          </div>
        </div>

        <div class="battle-vs">
          <span class="vs-badge">VS</span>
          <div class="turn-badge">Tour ${battle.turn || 0} · ${turnHint}</div>
          <div class="eff-slot">${label ? `<div class="eff-banner ${labelKind}">${label}</div>` : ''}</div>
        </div>

        <div class="battle-side enemy ${actingEnemy ? 'acting' : ''}" data-side="enemy">
          <div class="sprite-wrap enemy-wrap">
            ${wild.shiny ? '<div class="shiny-burst" aria-hidden="true"></div>' : ''}
            <img referrerpolicy="no-referrer" class="battle-sprite enemy-sprite ${wild.hp <= 0 ? 'faint' : ''} ${wild.shiny ? 'shiny-glow shiny-sparkle' : ''}"
              data-sid="${wild.speciesId}"
              src="${artUrl(wild.speciesId)}" alt="${pokeName(wild)}"
              onerror="this.onerror=null;this.src='${spriteUrl(wild.speciesId)}'" />
            <div class="dmg-layer" data-dmg="enemy">${floatHtml(float, 'enemy')}</div>
            <div class="battle-platform enemy-platform" aria-hidden="true"></div>
          </div>
          <div class="battle-info">
            <div class="battle-role">Shinobi adverse</div>
            <div class="battle-name">
              ${pokeName(wild)}${wild.shiny ? ` <span class="shiny-inline">${icon('sparkle')}</span>` : ''}
              <span>N.${wild.level}</span>
            </div>
            <div class="types">${typeBadges(wSp?.types)}</div>
            ${hpBar(wild.hp, wild.maxHp)}
            <div class="muted tiny">#${String(wild.speciesId).padStart(4, '0')} · G${wSp?.generation || '?'}</div>
          </div>
        </div>
      </div>
    </div>`;
}

/** Flash hit + classe CSS (utilisable depuis main) */
export function flashHit(side) {
  const sel = side === 'enemy' ? '.enemy-sprite' : '.ally-sprite';
  const el = $(sel);
  if (!el) return;
  el.classList.remove('hit');
  void el.offsetWidth;
  el.classList.add('hit');
  setTimeout(() => el.classList.remove('hit'), 220);
}

export function playCaptureShake() {
  const el = $('.enemy-sprite');
  if (!el) return;
  el.classList.remove('capture-shake');
  void el.offsetWidth;
  el.classList.add('capture-shake');
  setTimeout(() => el.classList.remove('capture-shake'), 900);
}

/** Shake automatique au clic sceau (sans toucher main.js) */
let captureShakeBound = false;
function ensureCaptureShake() {
  if (captureShakeBound || typeof document === 'undefined') return;
  captureShakeBound = true;
  document.addEventListener(
    'click',
    (e) => {
      const btn = e.target.closest?.('[data-catch]');
      if (btn && !btn.disabled) playCaptureShake();
    },
    true
  );
}
ensureCaptureShake();

export function applyBattleFx(events = []) {
  for (const ev of events) {
    if (ev.type === 'attack') {
      flashHit(ev.who === 'player' ? 'enemy' : 'ally');
    }
  }
}

function patchHpRow(sideRoot, hp, maxHp) {
  if (!sideRoot) return;
  const pct = Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100));
  let color = '#4ade80';
  if (pct <= 50) color = '#facc15';
  if (pct <= 20) color = '#f87171';
  const fill = sideRoot.querySelector('.hp-fill');
  const label = sideRoot.querySelector('.hp-text');
  const bar = sideRoot.querySelector('.hp-bar');
  if (fill) {
    fill.style.width = `${pct}%`;
    fill.style.background = color;
  }
  if (label) label.textContent = `${Math.max(0, Math.ceil(hp))}/${maxHp}`;
  if (bar) bar.title = `${Math.ceil(hp)}/${maxHp}`;
}

function patchXpRow(sideRoot, poke) {
  if (!sideRoot || !poke) return;
  const cur = xpForLevel(poke.level);
  const next = xpForLevel(Math.min(100, poke.level + 1));
  const pct =
    poke.level >= 100 ? 100 : ((poke.xp - cur) / Math.max(1, next - cur)) * 100;
  const fill = sideRoot.querySelector('.xp-fill');
  const bar = sideRoot.querySelector('.xp-bar');
  if (fill) fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  if (bar) bar.title = `XP ${poke.xp}`;
}

function patchSideIdentity(sideRoot, img, poke, role) {
  if (!sideRoot || !img || !poke) return;
  const sp = getSpecies(poke.speciesId);
  const sid = String(poke.speciesId);
  const uid = String(poke.uid || '');
  const changed = img.dataset.sid !== sid || (role === 'ally' && img.dataset.uid !== uid);

  if (changed) {
    img.dataset.sid = sid;
    if (role === 'ally') img.dataset.uid = uid;
    img.src = artUrl(poke.speciesId);
    img.alt = pokeName(poke);
    img.classList.add('sprite-swap');
    setTimeout(() => img.classList.remove('sprite-swap'), 220);
  }

  img.classList.toggle('faint', poke.hp <= 0);
  img.classList.toggle('shiny-sparkle', !!poke.shiny);
  if (role === 'enemy') img.classList.toggle('shiny-glow', !!poke.shiny);

  if (changed) {
    const nameEl = sideRoot.querySelector('.battle-name');
    if (nameEl) {
      nameEl.innerHTML = `${pokeName(poke)}${
        poke.shiny ? ` <span class="shiny-inline">${icon('sparkle')}</span>` : ''
      } <span>N.${poke.level}</span>`;
    }
    const types = sideRoot.querySelector('.types');
    if (types) types.innerHTML = typeBadges(sp?.types);

    if (role === 'enemy') {
      const meta = sideRoot.querySelector('.muted.tiny');
      if (meta) {
        meta.textContent = `#${String(poke.speciesId).padStart(4, '0')} · S${sp?.generation || '?'}`;
      }
      const wrap = sideRoot.querySelector('.enemy-wrap');
      if (wrap) {
        let burst = wrap.querySelector('.shiny-burst');
        if (poke.shiny && !burst) {
          burst = document.createElement('div');
          burst.className = 'shiny-burst';
          burst.setAttribute('aria-hidden', 'true');
          wrap.insertBefore(burst, wrap.firstChild);
        } else if (!poke.shiny && burst) {
          burst.remove();
        }
      }
    }
  } else {
    const lvl = sideRoot.querySelector('.battle-name > span:last-child');
    if (lvl && lvl.textContent !== `N.${poke.level}`) lvl.textContent = `N.${poke.level}`;
  }

  patchHpRow(sideRoot, poke.hp, poke.maxHp);
  if (role === 'ally') patchXpRow(sideRoot, poke);
}

/**
 * Met à jour le duel sans détruire le DOM (pas de flicker).
 * @returns {boolean} false seulement si l’défi n’existe pas encore
 */
export function patchBattle(state, battle) {
  const root = $('#battle-view');
  const arena = root?.querySelector('.battle-arena');
  if (!arena || !battle?.wild) return false;

  const fighter = state.team.find((p) => p.hp > 0) || state.team[0];
  const wild = battle.wild;
  if (!fighter) return false;

  const allyImg = arena.querySelector('.ally-sprite');
  const enemyImg = arena.querySelector('.enemy-sprite');
  const allySide = arena.querySelector('.battle-side.ally');
  const enemySide = arena.querySelector('.battle-side.enemy');
  if (!allyImg || !enemyImg || !allySide || !enemySide) return false;

  patchSideIdentity(allySide, allyImg, fighter, 'ally');
  patchSideIdentity(enemySide, enemyImg, wild, 'enemy');

  const next = battle.nextActor;
  allySide.classList.toggle('acting', !battle.over && next === 'player');
  enemySide.classList.toggle('acting', !battle.over && next === 'wild');

  const turnHint = battle.over
    ? battle.result === 'win'
      ? 'Victoire'
      : battle.result === 'catch'
        ? 'Scellé'
        : 'Défaite'
    : next === 'player'
      ? `${pokeName(fighter)} attaque`
      : `${pokeName(wild)} attaque`;
  const turnBadge = arena.querySelector('.turn-badge');
  if (turnBadge) turnBadge.textContent = `Tour ${battle.turn || 0} · ${turnHint}`;

  const float = battle.lastFloat;
  const allyDmg = arena.querySelector('[data-dmg="ally"]');
  const enemyDmg = arena.querySelector('[data-dmg="enemy"]');
  if (allyDmg) allyDmg.innerHTML = floatHtml(float, 'ally');
  if (enemyDmg) enemyDmg.innerHTML = floatHtml(float, 'enemy');

  const label = battle.lastLabel;
  const labelKind =
    battle.lastAttack?.typeMult === 0
      ? 'immune'
      : (battle.lastAttack?.typeMult ?? 1) >= 2
        ? 'super'
        : (battle.lastAttack?.typeMult ?? 1) < 1
          ? 'resist'
          : '';
  const effSlot = arena.querySelector('.eff-slot');
  if (effSlot) {
    effSlot.innerHTML = label ? `<div class="eff-banner ${labelKind}">${label}</div>` : '';
  }

  return true;
}

/** Met à jour les stocks sceau sans recréer les boutons si possible. */
export function patchCatchButtons(state, battle) {
  const host = $('#catch-btns');
  if (!host) return false;
  const btns = host.querySelectorAll('[data-catch]');
  if (!btns.length) return false;
  const wildAlive = battle && !battle.over && battle.wild.hp > 0;
  let ok = true;
  btns.forEach((btn) => {
    const id = btn.dataset.catch;
    const n = state.balls[id] || 0;
    const stock = btn.querySelector('.ball-stock');
    if (!stock) {
      ok = false;
      return;
    }
    if (stock.textContent !== String(n)) stock.textContent = String(n);
    btn.disabled = !wildAlive || n <= 0;
  });
  return ok;
}

/** Ajoute seulement les nouvelles lignes du journal (pas de rebuild). */
let lastLogStamp = 0;
let lastLogFilter = 'all';

export function resetLogPatch() {
  lastLogStamp = 0;
  lastLogFilter = 'all';
}

export function patchLog(state, filter = 'all') {
  const host = $('#log');
  if (!host) return false;

  if (filter !== lastLogFilter || host.childElementCount === 0) {
    lastLogFilter = filter;
    lastLogStamp = 0;
    host.innerHTML = renderLog(state, filter);
    const top = state.log?.[0];
    lastLogStamp = top?.t || Date.now();
    return true;
  }

  const lines = state.log || [];
  if (!lines.length) return true;
  const fresh = [];
  for (const l of lines) {
    if ((l.t || 0) <= lastLogStamp) break;
    fresh.push(l);
  }
  if (!fresh.length) return true;

  lastLogStamp = fresh[0].t || lastLogStamp;
  const def = LOG_FILTERS.find((f) => f.id === filter) || LOG_FILTERS[0];
  const known = new Set(LOG_FILTERS.flatMap((f) => f.types || []));
  const html = fresh
    .filter((l) => {
      if (filter === 'all') return true;
      const t = l.type || 'info';
      if (def.types?.includes(t)) return true;
      if (filter === 'other') return !known.has(t);
      return false;
    })
    .map((l) => `<div class="log-line log-${l.type || 'info'} log-enter">${l.msg}</div>`)
    .join('');
  if (html) host.insertAdjacentHTML('afterbegin', html);
  while (host.childElementCount > 40) host.lastElementChild?.remove();
  return true;
}

export function renderTeam(state) {
  const playGen = currentPlayGen(state);
  const fighter = activeFighter(state);
  return state.team
    .map((p, i) => {
      const busy = isPokemonBusy(state, p.uid);
      const ofGen = isPokemonOfGen(p, playGen);
      const isFighter = fighter === p;
      const actions = `
        <div class="card-actions">
          ${busy ? '<em class="busy-tag">Indisponible</em>' : ''}
          ${!ofGen ? `<em class="busy-tag">Hors Saga ${playGen}</em>` : ''}
          ${isFighter ? '<em class="lead-tag">Avant-garde</em>' : ''}
          ${!busy && canEvolve(p) ? `<button data-act="evolve" data-uid="${p.uid}">Mode suivant</button>` : ''}
          ${!busy && state.team.length > 1 ? `<button data-act="box" data-uid="${p.uid}">→ Réserve</button>` : ''}
          ${!busy && ofGen && i > 0 ? `<button data-act="up" data-i="${i}">↑ Avant-garde</button>` : ''}
        </div>`;
      return renderPokeCard(p, {
        actions,
        selected: isFighter,
        className: busy || !ofGen ? 'busy' : '',
      });
    })
    .join('');
}

export function renderBox(state) {
  if (!state.box.length) {
    return `<p class="empty-hint">La réserve est vide. Scellez des shinobi !</p>`;
  }
  return state.box
    .map((p) => {
      const actions = `
        <div class="card-actions">
          ${canEvolve(p) ? `<button data-act="evolve" data-uid="${p.uid}">Mode suivant</button>` : ''}
          <button data-act="team" data-uid="${p.uid}" ${state.team.length >= 6 ? 'disabled' : ''}>→ Escouade</button>
        </div>`;
      return renderPokeCard(p, { actions });
    })
    .join('');
}

function ensureDexStatusListener() {
  if (dexStatusBound) return;
  dexStatusBound = true;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dex-status]');
    if (!btn || !btn.closest('#dex-view')) return;
    dexExtra.status = btn.dataset.dexStatus || 'all';
    if (!lastDexArgs) return;
    const view = $('#dex-view');
    if (view) {
      view.innerHTML = renderBingoBook(lastDexArgs.state, lastDexArgs.opts);
    }
  });
}

export function renderBingoBook(state, opts = {}) {
  ensureDexStatusListener();
  lastDexArgs = { state, opts };
  const genFilter = opts.gen || 0;
  const q = (opts.query || '').trim().toLowerCase();
  const status = opts.status || dexExtra.status || 'all';
  const total = speciesCount();

  const list = allSpecies().filter((sp) => {
    if (genFilter && sp.generation !== genFilter) return false;
    const seen = !!state.seen[sp.id];
    const caught = !!state.caught[sp.id];
    if (status === 'caught' && !caught) return false;
    if (status === 'seen' && (!seen || caught)) return false;
    if (status === 'unknown' && seen) return false;
    if (!q) return true;
    const nameOk =
      sp.name.includes(q) ||
      (sp.nameFr || '').toLowerCase().includes(q) ||
      String(sp.id) === q ||
      String(sp.id).padStart(4, '0').includes(q);
    if (!nameOk) return false;
    // Recherche texte : masquer les inconnus sauf si query numérique
    if (!seen && !/^\d+$/.test(q)) return false;
    return true;
  });

  const caughtCount = Object.keys(state.caught).length;
  const seenCount = Object.keys(state.seen).length;

  const genTabs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((g) => {
      const label = g === 0 ? 'Toutes' : `G${g} · ${GEN_META[g]?.name || g}`;
      return `<button type="button" class="chip ${genFilter === g ? 'active' : ''}" data-dex-gen="${g}">${label}</button>`;
    })
    .join('');

  const statusTabs = [
    ['all', 'Tous'],
    ['caught', 'Scellés'],
    ['seen', 'Vus'],
    ['unknown', 'Inconnus'],
  ]
    .map(
      ([k, label]) =>
        `<button type="button" class="chip subtle ${status === k ? 'active' : ''}" data-dex-status="${k}">${label}</button>`
    )
    .join('');

  const entries = list
    .map((sp) => {
      const id = sp.id;
      const seen = !!state.seen[id];
      const caught = !!state.caught[id];
      return `
      <div class="dex-entry ${caught ? 'caught' : seen ? 'seen' : 'unknown'}">
        <div class="dex-num">#${String(id).padStart(4, '0')}</div>
        <img src="${spriteUrl(id)}" alt="" class="${seen ? '' : 'silhouette'}" loading="lazy" />
        <div class="dex-name">${seen ? displayName(sp) : '???'}</div>
        <div class="dex-gen">S${sp.generation}</div>
        ${caught ? `<span class="dex-ball" title="Scellé">${icon('scroll')}</span>` : ''}
        ${seen && !caught ? '<span class="dex-seen-dot" title="Vu"></span>' : ''}
      </div>`;
    })
    .join('');

  return `
    <div class="dex-toolbar">
      <div class="dex-summary">
        <strong>${caughtCount}</strong>/${total} scellés · ${seenCount} vus
        ${list.length !== total ? ` · affichage ${list.length}` : ''}
      </div>
      <div class="dex-search-wrap">
        <input id="dex-search" type="search" placeholder="Rechercher un nom ou n°…" value="${escapeAttr(opts.query || '')}" autocomplete="off" />
      </div>
      <div class="chip-row gen-row" id="dex-gens">${genTabs}</div>
      <div class="chip-row status-row">${statusTabs}</div>
    </div>
    <div class="dex-grid">${entries || '<p class="empty-hint">Aucun résultat</p>'}</div>`;
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

export function renderZones(state) {
  const byRegion = new Map();
  for (const z of ZONES) {
    const key = `${z.gen || 0}|${z.region || 'autre'}`;
    if (!byRegion.has(key)) byRegion.set(key, []);
    byRegion.get(key).push(z);
  }

  ensureUnlockedGens(state);
  const playGen = currentPlayGen(state);
  const nextUnlocks = ZONES.filter(
    (z) =>
      !state.unlockedZones.includes(z.id) &&
      z.unlockCost > 0 &&
      isGenUnlocked(state, z.gen || 1),
  )
    .slice()
    .sort((a, b) => a.unlockCost - b.unlockCost || a.gen - b.gen)
    .slice(0, 4);
  const preview =
    nextUnlocks.length === 0
      ? ''
      : `<div class="zone-unlock-preview">
      <div class="zone-unlock-head">
        <strong>Prochains déblocages</strong>
        <span class="muted">${state.money.toLocaleString('fr-FR')} 両</span>
      </div>
      <ul class="zone-unlock-list">
        ${nextUnlocks
          .map((z) => {
            const afford = state.money >= z.unlockCost;
            const short = Math.max(0, z.unlockCost - state.money);
            return `<li class="${afford ? 'can-buy' : 'need-more'}">
              <span class="zu-name">${z.name}</span>
              <span class="zu-meta">G${z.gen} · N.${z.minLevel}–${z.maxLevel}</span>
              <span class="zu-cost">${afford ? 'OK' : `−${short.toLocaleString('fr-FR')}`} · ${z.unlockCost.toLocaleString('fr-FR')} 両</span>
            </li>`;
          })
          .join('')}
      </ul>
    </div>`;

  let html = `<div class="zones-map">
    <p class="muted zones-gen-hint">Combat & kuchiyose : <strong>Saga ${playGen}</strong> uniquement (zone actuelle). Les sagas suivantes se débloquent en battant le Kage.</p>
    ${preview}`;
  for (const [key, list] of byRegion) {
    const [gen, region] = key.split('|');
    const regionName = REGION_FR[region] || region;
    const genOpen = isGenUnlocked(state, Number(gen) || 1);
    html += `
      <section class="zone-region ${genOpen ? '' : 'gen-locked'}" data-region="${region}">
        <header class="zone-region-head region-title">
          <h3>Saga ${gen} — ${regionName}${genOpen ? '' : ' · Verrouillé'}</h3>
          <span class="muted">${genOpen ? `${list.length} zone${list.length > 1 ? 's' : ''}` : 'Champion précédent requis'}</span>
        </header>
        <div class="zones-list zone-region-grid">`;
    html += list
      .map((z) => {
        const unlocked = state.unlockedZones.includes(z.id);
        const active = state.currentZone === z.id;
        const canBuy = genOpen && !unlocked;
        return `
      <button class="zone-card ${unlocked ? 'unlocked' : 'locked'} ${active ? 'active' : ''} ${genOpen ? '' : 'gen-locked'}" data-zone="${z.id}" type="button" ${genOpen || unlocked ? '' : 'disabled'}>
        <div class="zone-preview" style="background-image:${z.image ? `url('${z.image}')` : 'none'};background-color:#1a0c06;background-size:cover;background-position:center;">
          ${z.image ? '' : `<span class="zone-preview-fallback" style="background:${z.bg}"></span>`}
        </div>
        <div class="zone-meta">
          <strong>${z.name}</strong>
          <span>${z.desc}</span>
          <span class="zone-lvl">N.${z.minLevel}–${z.maxLevel} · ${z.pokemon.length} shinobi</span>
          ${
            unlocked
              ? active
                ? '<em class="tag">En cours</em>'
                : '<em class="tag go">Explorer</em>'
              : genOpen
                ? `<em class="tag cost">${z.unlockCost.toLocaleString('fr-FR')} 両</em>`
                : '<em class="tag">Saga verrouillée</em>'
          }
        </div>
      </button>`;
      })
      .join('');
    html += '</div></section>';
  }
  html += '</div>';
  return html;
}

export function renderShop(state) {
  return Object.values(BALLS)
    .map(
      (b) => `
    <div class="shop-item">
      <div class="shop-icon ico-wrap">${icon(b.icon || 'scroll')}</div>
      <div>
        <strong>${b.name}</strong>
        <div class="muted">Bonus ×${b.bonus} · Stock: ${state.balls[b.id] || 0}</div>
      </div>
      <div class="shop-buy">
        <button data-buy="${b.id}" data-qty="1" ${state.money < b.price ? 'disabled' : ''}>${b.price.toLocaleString('fr-FR')} 両</button>
        <button data-buy="${b.id}" data-qty="5" ${state.money < b.price * 5 ? 'disabled' : ''}>5× ${(b.price * 5).toLocaleString('fr-FR')} 両</button>
      </div>
    </div>`
    )
    .join('');
}

/** Filtres journal — groupes logiques pour l’UI combat */
export const LOG_FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'catch', label: 'Sceaux', types: ['catch'] },
  { id: 'battle', label: 'Combat', types: ['battle', 'faint', 'miss', 'level', 'evolve'] },
  { id: 'unlock', label: 'Débloc.', types: ['unlock'] },
  { id: 'shop', label: 'Boutique', types: ['shop', 'heal'] },
  { id: 'other', label: 'Autre', types: ['offline', 'info'] },
];

export function renderLogToolbar(filter = 'all') {
  const chips = LOG_FILTERS.map(
    (f) =>
      `<button type="button" class="log-chip ${filter === f.id ? 'active' : ''}" data-log-filter="${f.id}">${f.label}</button>`
  ).join('');
  return `<div class="log-toolbar">
    <div class="log-filters" role="group" aria-label="Filtrer le journal">${chips}</div>
    <button type="button" class="log-clear btn-secondary" data-log-clear title="Vider le journal">Effacer</button>
  </div>`;
}

export function renderLog(state, filter = 'all') {
  const def = LOG_FILTERS.find((f) => f.id === filter) || LOG_FILTERS[0];
  const lines = (state.log || []).filter((l) => {
    if (filter === 'all') return true;
    const t = l.type || 'info';
    if (def.types?.includes(t)) return true;
    // Types inconnus → « Autre »
    if (filter === 'other') {
      const known = new Set(LOG_FILTERS.flatMap((f) => f.types || []));
      return !known.has(t);
    }
    return false;
  });
  if (!lines.length) {
    return `<div class="log-empty muted">Aucune entrée${filter === 'all' ? '' : ' pour ce filtre'}.</div>`;
  }
  return lines
    .slice(0, 40)
    .map((l) => `<div class="log-line log-${l.type || 'info'}">${l.msg}</div>`)
    .join('');
}

export function renderCatchButtons(state, battle) {
  const wildAlive = battle && !battle.over && battle.wild.hp > 0;
  return Object.values(BALLS)
    .map((b) => {
      const n = state.balls[b.id] || 0;
      return `<button class="ball-btn" data-catch="${b.id}" ${!wildAlive || n <= 0 ? 'disabled' : ''}>
        <span class="ball-ico">${icon(b.icon || 'scroll')}</span>
        <span class="ball-label">${b.name}</span>
        <span class="ball-stock">${n}</span>
      </button>`;
    })
    .join('');
}

export function updateHud(state) {
  const money = $('#money');
  if (!money) return;
  money.textContent = state.money.toLocaleString('fr-FR') + ' 両';
  const team = $('#team-count');
  if (team) team.textContent = `${state.team.length}/6`;
  const dex = $('#dex-count');
  if (dex) dex.textContent = `${Object.keys(state.caught).length}/${speciesCount()}`;
  const zoneEl = $('#zone-name');
  const zone = ZONES.find((z) => z.id === state.currentZone);
  if (zoneEl) zoneEl.textContent = zone?.name || '—';
}

export function showModal(html) {
  const overlay = $('#modal-overlay');
  $('#modal-body').innerHTML = html;
  overlay.hidden = false;
}

export function hideModal() {
  $('#modal-overlay').hidden = true;
}

export function toast(msg, ms = 2200) {
  let host = $('#toasts');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toasts';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, ms);
}

export function renderStarterSelect(selectedGen = 1) {
  // Nouvelle partie : Gen 1 uniquement. Les autres gens se débloquent via les champions.
  const unlocked = [1];
  const playableGen = unlocked.includes(selectedGen) ? selectedGen : 1;
  const gens = Object.keys(STARTERS_BY_GEN).map(Number);
  const tabs = gens
    .map((g) => {
      const meta = GEN_META[g];
      const open = unlocked.includes(g);
      return `<button type="button" class="chip starter-gen-chip ${playableGen === g ? 'active' : ''} ${open ? '' : 'locked'}" data-starter-gen="${g}" ${open ? '' : 'disabled'} title="${open ? meta.name : 'Battez le Kage de la saga précédente'}">
        <span class="chip-gen">Saga ${meta.roman}</span>
        <small>${open ? meta.name : 'Verrouillé'}</small>
      </button>`;
    })
    .join('');

  const starters = STARTERS_BY_GEN[playableGen] || STARTERS_BY_GEN[1];
  const meta = GEN_META[playableGen] || GEN_META[1];
  const cards = starters
    .map((entry) => {
      const sid = typeof entry === 'number' ? entry : entry?.id;
      const sp = getSpecies(sid);
      if (!sp) {
        return `
          <button class="starter-card unavailable" type="button" disabled>
            <div class="starter-art"><img referrerpolicy="no-referrer" src="${artUrl(sid)}" alt="" /></div>
            <strong>${entry?.label || '???'}</strong>
            <div class="muted">Chargement…</div>
          </button>`;
      }
      return `
        <button class="starter-card" data-starter="${sid}" type="button">
          <div class="starter-art">
            <img referrerpolicy="no-referrer" src="${artUrl(sid)}" alt="${displayName(sp)}" />
          </div>
          <strong>${displayName(sp)}</strong>
          <div class="types">${typeBadges(sp.types)}</div>
          <span class="starter-id">#${String(sid).padStart(3, '0')}</span>
        </button>`;
    })
    .join('');

  const hasSave =
    localStorage.getItem('shinobiiii_save_v1') ||
    localStorage.getItem('pokiiiii_save_v3') ||
    localStorage.getItem('pokeidle_fan_save_v2') ||
    localStorage.getItem('pokeidle_fan_save_v1');

  return `
    <div class="starter-screen">
      <div class="starter-hero">
        <p class="brand-mark">${icon('logo')} ${BRAND.name}</p>
        <h1>Choisis ta première recrue</h1>
        <p class="subtitle">${BRAND.tagline} · Début obligatoirement en Saga I (Konoha)</p>
      </div>
      <div class="chip-row starter-gens">${tabs}</div>
      <p class="starter-region">Région · ${meta.name} · Sagas II–IV via chaque finale de village</p>
      <div class="starter-grid">${cards}</div>
      ${
        hasSave
          ? `<button class="btn-secondary btn-continue" id="btn-continue" type="button">Continuer la partie</button>`
          : ''
      }
    </div>`;
}
