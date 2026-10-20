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
import { BALLS, ZONES, BRAND } from './game.js';
import { STARTERS_BY_GEN, GEN_META } from './data/starters.js';
import { icon } from './icons.js';

const REGION_FR = {
  kanto: 'Kanto',
  johto: 'Johto',
  hoenn: 'Hoenn',
  sinnoh: 'Sinnoh',
  unova: 'Unys',
  kalos: 'Kalos',
  alola: 'Alola',
  galar: 'Galar',
  paldea: 'Paldea',
};

/** État filtre statut Pokédex (complète opts de main.js) */
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
        <img src="${artUrl(poke.speciesId)}" alt="${name}" loading="lazy"
          onerror="this.onerror=null;this.src='${spriteUrl(poke.speciesId)}'" />
        ${poke.shiny ? '<span class="shiny-badge shiny-sparkle" title="Chromatique">✨</span>' : ''}
        ${evo ? '<span class="evo-badge">Évoluer</span>' : ''}
        <span class="card-gen gen-pill">G${sp?.generation || '?'}</span>
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
  const regionKey = (zone?.region || '').toLowerCase();
  const regionLabel = REGION_FR[regionKey] || zone?.region || '';
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
        ? 'Capturé'
        : 'Défaite'
    : actingAlly
      ? `${pokeName(fighter)} attaque`
      : `${pokeName(wild)} attaque`;

  return `
    <div class="battle-arena duel" style="--zone-bg:${zone?.bg || '#1a1a2e'}">
      <div class="battle-zone-label">${zone?.name || ''}${regionLabel ? ` · ${regionLabel}` : ''} · Gen ${zone?.gen || '?'} · 1v1</div>
      <div class="battle-layout duel-grid">
        <div class="battle-side ally ${actingAlly ? 'acting' : ''}" data-side="ally">
          <div class="battle-info">
            <div class="battle-role">Votre Pokémon</div>
            <div class="battle-name">
              ${pokeName(fighter)}${fighter.shiny ? ' <span class="shiny-inline">✨</span>' : ''}
              <span>N.${fighter.level}</span>
            </div>
            <div class="types">${typeBadges(fSp?.types)}</div>
            ${hpBar(fighter.hp, fighter.maxHp)}
            ${xpBar(fighter)}
          </div>
          <div class="sprite-wrap ally-wrap">
            <img class="battle-sprite ally-sprite ${fighter.hp <= 0 ? 'faint' : ''} ${fighter.shiny ? 'shiny-sparkle' : ''}"
              src="${artUrl(fighter.speciesId)}" alt="${pokeName(fighter)}"
              onerror="this.onerror=null;this.src='${spriteUrl(fighter.speciesId)}'" />
            <div class="dmg-layer">${floatHtml(float, 'ally')}</div>
            <div class="battle-platform ally-platform" aria-hidden="true"></div>
          </div>
        </div>

        <div class="battle-vs">
          <span class="vs-badge">VS</span>
          <div class="turn-badge">Tour ${battle.turn || 0} · ${turnHint}</div>
          ${label ? `<div class="eff-banner ${labelKind}">${label}</div>` : ''}
        </div>

        <div class="battle-side enemy ${actingEnemy ? 'acting' : ''}" data-side="enemy">
          <div class="sprite-wrap enemy-wrap">
            ${wild.shiny ? '<div class="shiny-burst" aria-hidden="true"></div>' : ''}
            <img class="battle-sprite enemy-sprite ${wild.hp <= 0 ? 'faint' : ''} ${wild.shiny ? 'shiny-glow shiny-sparkle' : ''}"
              src="${artUrl(wild.speciesId)}" alt="${pokeName(wild)}"
              onerror="this.onerror=null;this.src='${spriteUrl(wild.speciesId)}'" />
            <div class="dmg-layer">${floatHtml(float, 'enemy')}</div>
            <div class="battle-platform enemy-platform" aria-hidden="true"></div>
          </div>
          <div class="battle-info">
            <div class="battle-role">Sauvage</div>
            <div class="battle-name">
              ${pokeName(wild)}${wild.shiny ? ' <span class="shiny-inline">✨</span>' : ''}
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

/** Shake automatique au clic Ball (sans toucher main.js) */
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

export function renderTeam(state) {
  const fighter = state.team.find((x) => x.hp > 0);
  return state.team
    .map((p, i) => {
      const isFighter = fighter === p;
      const actions = `
        <div class="card-actions">
          ${isFighter ? '<em class="lead-tag">Combattant 1v1</em>' : ''}
          ${canEvolve(p) ? `<button data-act="evolve" data-uid="${p.uid}">Évoluer</button>` : ''}
          ${state.team.length > 1 ? `<button data-act="box" data-uid="${p.uid}">→ PC</button>` : ''}
          ${i > 0 ? `<button data-act="up" data-i="${i}">↑ Lead</button>` : ''}
        </div>`;
      return renderPokeCard(p, { actions, selected: isFighter });
    })
    .join('');
}

export function renderBox(state) {
  if (!state.box.length) {
    return `<p class="empty-hint">Le PC est vide. Capturez des Pokémon !</p>`;
  }
  return state.box
    .map((p) => {
      const actions = `
        <div class="card-actions">
          ${canEvolve(p) ? `<button data-act="evolve" data-uid="${p.uid}">Évoluer</button>` : ''}
          <button data-act="team" data-uid="${p.uid}" ${state.team.length >= 6 ? 'disabled' : ''}>→ Équipe</button>
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
      view.innerHTML = renderPokedex(lastDexArgs.state, lastDexArgs.opts);
    }
  });
}

export function renderPokedex(state, opts = {}) {
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
    ['caught', 'Capturés'],
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
        <div class="dex-gen">G${sp.generation}</div>
        ${caught ? '<span class="dex-ball" title="Capturé">🔴</span>' : ''}
        ${seen && !caught ? '<span class="dex-seen-dot" title="Vu"></span>' : ''}
      </div>`;
    })
    .join('');

  return `
    <div class="dex-toolbar">
      <div class="dex-summary">
        <strong>${caughtCount}</strong>/${total} capturés · ${seenCount} vus
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

  let html = '<div class="zones-map">';
  for (const [key, list] of byRegion) {
    const [gen, region] = key.split('|');
    const regionName = REGION_FR[region] || region;
    html += `
      <section class="zone-region" data-region="${region}">
        <header class="zone-region-head region-title">
          <h3>Gen ${gen} — ${regionName}</h3>
          <span class="muted">${list.length} zone${list.length > 1 ? 's' : ''}</span>
        </header>
        <div class="zones-list zone-region-grid">`;
    html += list
      .map((z) => {
        const unlocked = state.unlockedZones.includes(z.id);
        const active = state.currentZone === z.id;
        return `
      <button class="zone-card ${unlocked ? 'unlocked' : 'locked'} ${active ? 'active' : ''}" data-zone="${z.id}" type="button">
        <div class="zone-preview" style="background:${z.bg}"></div>
        <div class="zone-meta">
          <strong>${z.name}</strong>
          <span>${z.desc}</span>
          <span class="zone-lvl">N.${z.minLevel}–${z.maxLevel} · ${z.pokemon.length} espèces</span>
          ${
            unlocked
              ? active
                ? '<em class="tag">En cours</em>'
                : '<em class="tag go">Explorer</em>'
              : `<em class="tag cost">${z.unlockCost.toLocaleString('fr-FR')} ₽</em>`
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
      <div class="shop-icon ico-wrap">${icon(b.icon || 'ball')}</div>
      <div>
        <strong>${b.name}</strong>
        <div class="muted">Bonus ×${b.bonus} · Stock: ${state.balls[b.id] || 0}</div>
      </div>
      <div class="shop-buy">
        <button data-buy="${b.id}" data-qty="1" ${state.money < b.price ? 'disabled' : ''}>${b.price.toLocaleString('fr-FR')} ₽</button>
        <button data-buy="${b.id}" data-qty="5" ${state.money < b.price * 5 ? 'disabled' : ''}>5× ${(b.price * 5).toLocaleString('fr-FR')} ₽</button>
      </div>
    </div>`
    )
    .join('');
}

export function renderLog(state) {
  return state.log
    .slice(0, 40)
    .map((l) => `<div class="log-line log-${l.type}">${l.msg}</div>`)
    .join('');
}

export function renderCatchButtons(state, battle) {
  const wildAlive = battle && !battle.over && battle.wild.hp > 0;
  return Object.values(BALLS)
    .map((b) => {
      const n = state.balls[b.id] || 0;
      return `<button class="ball-btn" data-catch="${b.id}" ${!wildAlive || n <= 0 ? 'disabled' : ''}>
        <span class="ball-ico">${icon(b.icon || 'ball')}</span>
        <span class="ball-label">${b.name}</span>
        <span class="ball-stock">${n}</span>
      </button>`;
    })
    .join('');
}

export function updateHud(state) {
  const money = $('#money');
  if (!money) return;
  money.textContent = state.money.toLocaleString('fr-FR') + ' ₽';
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
  const gens = Object.keys(STARTERS_BY_GEN).map(Number);
  const tabs = gens
    .map((g) => {
      const meta = GEN_META[g];
      return `<button type="button" class="chip starter-gen-chip ${selectedGen === g ? 'active' : ''}" data-starter-gen="${g}">
        <span class="chip-gen">Gen ${meta.roman}</span>
        <small>${meta.name}</small>
      </button>`;
    })
    .join('');

  const starters = STARTERS_BY_GEN[selectedGen] || STARTERS_BY_GEN[1];
  const meta = GEN_META[selectedGen] || GEN_META[1];
  const cards = starters
    .map((s) => {
      const sp = getSpecies(s.id);
      if (!sp) {
        return `
          <button class="starter-card unavailable" type="button" disabled>
            <div class="starter-art"><img src="${artUrl(s.id)}" alt="" /></div>
            <strong>${s.label || '???'}</strong>
            <div class="muted">Chargement…</div>
          </button>`;
      }
      return `
        <button class="starter-card" data-starter="${s.id}" type="button">
          <div class="starter-art">
            <img src="${artUrl(s.id)}" alt="${displayName(sp)}" />
          </div>
          <strong>${displayName(sp)}</strong>
          <div class="types">${typeBadges(sp.types)}</div>
          <span class="starter-id">#${String(s.id).padStart(3, '0')}</span>
        </button>`;
    })
    .join('');

  const hasSave =
    localStorage.getItem('pokiiiii_save_v3') ||
    localStorage.getItem('pokeidle_fan_save_v2') ||
    localStorage.getItem('pokeidle_fan_save_v1');

  return `
    <div class="starter-screen">
      <div class="starter-hero">
        <p class="brand-mark">${icon('logo')} ${BRAND.name}</p>
        <h1>Choisissez votre starter</h1>
        <p class="subtitle">${BRAND.tagline} · ${speciesCount()} Pokémon</p>
      </div>
      <div class="chip-row starter-gens">${tabs}</div>
      <p class="starter-region">Région · ${meta.name}</p>
      <div class="starter-grid">${cards}</div>
      ${
        hasSave
          ? `<button class="btn-secondary btn-continue" id="btn-continue" type="button">Continuer la partie</button>`
          : ''
      }
    </div>`;
}
