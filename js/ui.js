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
import { BALLS, ZONES } from './game.js';
import { STARTERS_BY_GEN, GEN_META } from './data/starters.js';

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

export function hpBar(hp, maxHp) {
  const pct = Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100));
  let color = '#4ade80';
  if (pct <= 50) color = '#facc15';
  if (pct <= 20) color = '#f87171';
  return `<div class="hp-bar" title="${Math.ceil(hp)}/${maxHp}"><div class="hp-fill" style="width:${pct}%;background:${color}"></div></div>
    <div class="hp-text">${Math.ceil(hp)} / ${maxHp}</div>`;
}

export function xpBar(poke) {
  const cur = xpForLevel(poke.level);
  const next = xpForLevel(Math.min(100, poke.level + 1));
  const pct =
    poke.level >= 100 ? 100 : ((poke.xp - cur) / Math.max(1, next - cur)) * 100;
  return `<div class="xp-bar" title="XP ${poke.xp}"><div class="xp-fill" style="width:${Math.max(0, Math.min(100, pct))}%"></div></div>`;
}

export function renderPokeCard(poke, opts = {}) {
  const sp = getSpecies(poke.speciesId);
  const name = pokeName(poke);
  const evo = canEvolve(poke);
  return `
    <article class="poke-card ${poke.shiny ? 'shiny' : ''}" data-uid="${poke.uid}">
      <div class="poke-card-img">
        <img src="${artUrl(poke.speciesId)}" alt="${name}" loading="lazy" onerror="this.src='${spriteUrl(poke.speciesId)}'" />
        ${poke.shiny ? '<span class="shiny-badge">✨</span>' : ''}
        ${evo ? '<span class="evo-badge">Évoluer</span>' : ''}
        <span class="gen-pill">G${sp?.generation || '?'}</span>
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

export function renderBattle(state, battle) {
  const fighter = state.team.find((p) => p.hp > 0) || state.team[0];
  const wild = battle?.wild;
  const zone = ZONES.find((z) => z.id === state.currentZone);
  if (!wild || !fighter) return `<div class="battle-empty">Préparation du duel 1v1…</div>`;

  const wSp = getSpecies(wild.speciesId);
  const fSp = getSpecies(fighter.speciesId);
  const float = battle.lastFloat;
  const label = battle.lastLabel;
  const next = battle.nextActor;
  const actingAlly = !battle.over && next === 'player';
  const actingEnemy = !battle.over && next === 'wild';
  const labelKind =
    battle.lastAttack?.typeMult === 0
      ? 'immune'
      : (battle.lastAttack?.typeMult ?? 1) >= 2
        ? 'super'
        : (battle.lastAttack?.typeMult ?? 1) < 1
          ? 'resist'
          : '';

  return `
    <div class="battle-arena duel" style="--zone-bg:${zone?.bg || '#1a1a2e'}">
      <div class="battle-zone-label">${zone?.name || ''}${zone?.region ? ` · ${zone.region}` : ''} · Gen ${zone?.gen || '?'} · 1v1</div>
      <div class="duel-grid">
        <div class="battle-side ally ${actingAlly ? 'acting' : ''}">
          <div class="battle-info">
            <div class="battle-role">Votre Pokémon</div>
            <div class="battle-name">${pokeName(fighter)} <span>N.${fighter.level}</span></div>
            ${typeBadges(fSp?.types)}
            ${hpBar(fighter.hp, fighter.maxHp)}
            ${xpBar(fighter)}
          </div>
          <div class="sprite-wrap">
            <img class="battle-sprite ally-sprite ${fighter.hp <= 0 ? 'faint' : ''}" src="${artUrl(fighter.speciesId)}" alt="" onerror="this.src='${spriteUrl(fighter.speciesId)}'" />
            ${float?.side === 'ally' ? `<div class="dmg-float ${float.kind}">${float.text}</div>` : ''}
          </div>
        </div>
        <div class="battle-vs">
          <div class="vs-badge">1 VS 1</div>
          <div class="turn-badge">Tour ${battle.turn || 0}${
            battle.over
              ? battle.result === 'win'
                ? ' · Victoire'
                : battle.result === 'catch'
                  ? ' · Capturé'
                  : ' · Défaite'
              : actingAlly
                ? ` · ${pokeName(fighter)} attaque`
                : ` · ${pokeName(wild)} attaque`
          }</div>
          ${label ? `<div class="eff-banner ${labelKind}">${label}</div>` : ''}
        </div>
        <div class="battle-side enemy ${actingEnemy ? 'acting' : ''}">
          <div class="sprite-wrap">
            <img class="battle-sprite enemy-sprite ${wild.hp <= 0 ? 'faint' : ''} ${wild.shiny ? 'shiny-glow' : ''}" src="${artUrl(wild.speciesId)}" alt="" onerror="this.src='${spriteUrl(wild.speciesId)}'" />
            ${float?.side === 'enemy' ? `<div class="dmg-float ${float.kind}">${float.text}</div>` : ''}
          </div>
          <div class="battle-info">
            <div class="battle-role">Sauvage</div>
            <div class="battle-name">${pokeName(wild)}${wild.shiny ? ' ✨' : ''} <span>N.${wild.level}</span></div>
            ${typeBadges(wSp?.types)}
            ${hpBar(wild.hp, wild.maxHp)}
            <div class="muted tiny">#${String(wild.speciesId).padStart(4, '0')} · G${wSp?.generation ?? '?'}</div>
          </div>
        </div>
      </div>
    </div>`;
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
      return renderPokeCard(p, { actions });
    })
    .join('');
}

export function renderBox(state) {
  if (!state.box.length) return `<p class="empty-hint">Le PC est vide. Capturez des Pokémon !</p>`;
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

export function renderPokedex(state, opts = {}) {
  const genFilter = opts.gen || 0;
  const q = (opts.query || '').trim().toLowerCase();
  const total = speciesCount();
  const list = allSpecies().filter((sp) => {
    if (genFilter && sp.generation !== genFilter) return false;
    if (!q) return true;
    return (
      sp.name.includes(q) ||
      (sp.nameFr || '').toLowerCase().includes(q) ||
      String(sp.id) === q
    );
  });

  const caughtCount = Object.keys(state.caught).length;
  const seenCount = Object.keys(state.seen).length;

  const genTabs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((g) => {
      const label = g === 0 ? 'Tous' : `G${g}`;
      return `<button type="button" class="chip ${genFilter === g ? 'active' : ''}" data-dex-gen="${g}">${label}</button>`;
    })
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
        ${caught ? '<span class="dex-ball">🔴</span>' : ''}
      </div>`;
    })
    .join('');

  return `
    <div class="dex-toolbar">
      <div class="dex-summary"><strong>${caughtCount}</strong>/${total} capturés · ${seenCount} vus</div>
      <input id="dex-search" type="search" placeholder="Rechercher…" value="${opts.query || ''}" />
    </div>
    <div class="chip-row" id="dex-gens">${genTabs}</div>
    <div class="dex-grid">${entries || '<p class="empty-hint">Aucun résultat</p>'}</div>`;
}

export function renderZones(state) {
  const byRegion = new Map();
  for (const z of ZONES) {
    const key = `${z.gen || 0}|${z.region || 'Autre'}`;
    if (!byRegion.has(key)) byRegion.set(key, []);
    byRegion.get(key).push(z);
  }
  let html = '';
  for (const [key, list] of byRegion) {
    const [gen, region] = key.split('|');
    html += `<h3 class="region-title">Gen ${gen} — ${region}</h3><div class="zones-list">`;
    html += list
      .map((z) => {
        const unlocked = state.unlockedZones.includes(z.id);
        const active = state.currentZone === z.id;
        return `
      <button class="zone-card ${unlocked ? 'unlocked' : 'locked'} ${active ? 'active' : ''}" data-zone="${z.id}">
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
    html += '</div>';
  }
  return html;
}

export function renderShop(state) {
  return Object.values(BALLS)
    .map(
      (b) => `
    <div class="shop-item">
      <div class="shop-icon">${b.emoji}</div>
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
        ${b.emoji} ${b.name} <span>(${n})</span>
      </button>`;
    })
    .join('');
}

export function updateHud(state) {
  const money = $('#money');
  if (!money) return;
  money.textContent = state.money.toLocaleString('fr-FR') + ' ₽';
  $('#team-count').textContent = `${state.team.length}/6`;
  $('#dex-count').textContent = `${Object.keys(state.caught).length}/${speciesCount()}`;
  const zone = ZONES.find((z) => z.id === state.currentZone);
  $('#zone-name').textContent = zone?.name || '—';
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
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  $('#toasts').appendChild(el);
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
      return `<button type="button" class="chip ${selectedGen === g ? 'active' : ''}" data-starter-gen="${g}">Gen ${meta.roman} · ${meta.name}</button>`;
    })
    .join('');

  const starters = STARTERS_BY_GEN[selectedGen] || STARTERS_BY_GEN[1];
  const cards = starters
    .map((s) => {
      const sp = getSpecies(s.id);
      if (!sp) return '';
      return `
        <button class="starter-card" data-starter="${s.id}">
          <img src="${artUrl(s.id)}" alt="${displayName(sp)}" />
          <strong>${displayName(sp)}</strong>
          <div class="types">${typeBadges(sp.types)}</div>
        </button>`;
    })
    .join('');

  return `
    <div class="starter-screen">
      <h1>PokéIdle</h1>
      <p class="subtitle">Tout le Pokédex · ${speciesCount()} Pokémon · Duels 1v1 idle</p>
      <div class="chip-row starter-gens">${tabs}</div>
      <div class="starter-grid">${cards}</div>
      ${
        localStorage.getItem('pokeidle_fan_save_v2') || localStorage.getItem('pokeidle_fan_save_v1')
          ? `<button class="btn-secondary" id="btn-continue">Continuer la partie</button>`
          : ''
      }
    </div>`;
}
