import {
  TYPE_COLORS,
  TYPE_FR,
} from './data/types.js';
import {
  getSpecies,
  displayName,
  pokeName,
  artUrl,
  spriteUrl,
  canEvolve,
  xpForLevel,
} from './pokemon.js';
import { BALLS, ZONES } from './game.js';

export function $(sel, root = document) {
  return root.querySelector(sel);
}

export function $$ (sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

export function typeBadges(types) {
  return types
    .map(
      (t) =>
        `<span class="type-badge" style="--tc:${TYPE_COLORS[t] || '#888'}">${TYPE_FR[t] || t}</span>`
    )
    .join('');
}

export function hpBar(hp, maxHp) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  let color = '#4ade80';
  if (pct <= 50) color = '#facc15';
  if (pct <= 20) color = '#f87171';
  return `
    <div class="hp-bar" title="${hp}/${maxHp}">
      <div class="hp-fill" style="width:${pct}%;background:${color}"></div>
    </div>`;
}

export function xpBar(poke) {
  const cur = xpForLevel(poke.level);
  const next = xpForLevel(Math.min(100, poke.level + 1));
  const pct =
    poke.level >= 100 ? 100 : ((poke.xp - cur) / Math.max(1, next - cur)) * 100;
  return `
    <div class="xp-bar" title="XP ${poke.xp}">
      <div class="xp-fill" style="width:${Math.max(0, Math.min(100, pct))}%"></div>
    </div>`;
}

export function renderPokeCard(poke, opts = {}) {
  const sp = getSpecies(poke.speciesId);
  const name = pokeName(poke);
  const evo = canEvolve(poke);
  return `
    <article class="poke-card ${opts.selected ? 'selected' : ''} ${poke.shiny ? 'shiny' : ''}" data-uid="${poke.uid}">
      <div class="poke-card-img">
        <img src="${artUrl(poke.speciesId)}" alt="${name}" loading="lazy" />
        ${poke.shiny ? '<span class="shiny-badge">✨</span>' : ''}
        ${evo ? '<span class="evo-badge">Évoluer</span>' : ''}
      </div>
      <div class="poke-card-body">
        <div class="poke-card-title">
          <strong>${name}</strong>
          <span class="lvl">N.${poke.level}</span>
        </div>
        <div class="types">${typeBadges(sp.types)}</div>
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

  if (!wild) {
    return `<div class="battle-empty">Préparation du combat…</div>`;
  }

  const wSp = getSpecies(wild.speciesId);
  const fSp = getSpecies(fighter.speciesId);

  return `
    <div class="battle-arena" style="--zone-bg:${zone?.bg || '#1a1a2e'}">
      <div class="battle-zone-label">${zone?.name || ''}</div>
      <div class="battle-side enemy">
        <div class="battle-info">
          <div class="battle-name">${pokeName(wild)}${wild.shiny ? ' ✨' : ''} <span>N.${wild.level}</span></div>
          ${typeBadges(wSp.types)}
          ${hpBar(wild.hp, wild.maxHp)}
        </div>
        <img class="battle-sprite enemy-sprite ${wild.hp <= 0 ? 'faint' : ''}" src="${artUrl(wild.speciesId)}" alt="" />
      </div>
      <div class="battle-vs">VS</div>
      <div class="battle-side ally">
        <img class="battle-sprite ally-sprite ${fighter.hp <= 0 ? 'faint' : ''}" src="${artUrl(fighter.speciesId)}" alt="" />
        <div class="battle-info">
          <div class="battle-name">${pokeName(fighter)} <span>N.${fighter.level}</span></div>
          ${typeBadges(fSp.types)}
          ${hpBar(fighter.hp, fighter.maxHp)}
          ${xpBar(fighter)}
        </div>
      </div>
    </div>`;
}

export function renderTeam(state, handlers = {}) {
  return state.team
    .map((p, i) => {
      const actions = `
        <div class="card-actions">
          ${canEvolve(p) ? `<button data-act="evolve" data-uid="${p.uid}">Évoluer</button>` : ''}
          ${state.team.length > 1 ? `<button data-act="box" data-uid="${p.uid}">→ PC</button>` : ''}
          ${i > 0 ? `<button data-act="up" data-i="${i}">↑</button>` : ''}
        </div>`;
      return renderPokeCard(p, { actions });
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

export function renderPokedex(state) {
  const all = [];
  for (let id = 1; id <= 151; id++) {
    const sp = getSpecies(id);
    if (!sp) continue;
    const seen = !!state.seen[id];
    const caught = !!state.caught[id];
    all.push(`
      <div class="dex-entry ${caught ? 'caught' : seen ? 'seen' : 'unknown'}">
        <div class="dex-num">#${String(id).padStart(3, '0')}</div>
        <img src="${spriteUrl(id)}" alt="" class="${seen ? '' : 'silhouette'}" loading="lazy" />
        <div class="dex-name">${seen ? displayName(sp) : '???'}</div>
        ${caught ? '<span class="dex-ball">🔴</span>' : ''}
      </div>`);
  }
  const caughtCount = Object.keys(state.caught).length;
  const seenCount = Object.keys(state.seen).length;
  return `
    <div class="dex-summary">${caughtCount}/151 capturés · ${seenCount} vus</div>
    <div class="dex-grid">${all.join('')}</div>`;
}

export function renderZones(state) {
  return ZONES.map((z) => {
    const unlocked = state.unlockedZones.includes(z.id);
    const active = state.currentZone === z.id;
    return `
      <button class="zone-card ${unlocked ? 'unlocked' : 'locked'} ${active ? 'active' : ''}"
        data-zone="${z.id}" ${!unlocked && state.money < z.unlockCost ? '' : ''}>
        <div class="zone-preview" style="background:${z.bg}"></div>
        <div class="zone-meta">
          <strong>${z.name}</strong>
          <span>${z.desc}</span>
          <span class="zone-lvl">N.${z.minLevel}–${z.maxLevel}</span>
          ${
            unlocked
              ? active
                ? '<em class="tag">En cours</em>'
                : '<em class="tag go">Explorer</em>'
              : `<em class="tag cost">${z.unlockCost.toLocaleString('fr-FR')} ₽</em>`
          }
        </div>
      </button>`;
  }).join('');
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
        <button data-buy="${b.id}" data-qty="1" ${state.money < b.price ? 'disabled' : ''}>
          ${b.price} ₽
        </button>
        <button data-buy="${b.id}" data-qty="5" ${state.money < b.price * 5 ? 'disabled' : ''}>
          5× ${b.price * 5} ₽
        </button>
      </div>
    </div>`
    )
    .join('');
}

export function renderLog(state) {
  return state.log
    .slice(0, 30)
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
  $('#money').textContent = state.money.toLocaleString('fr-FR') + ' ₽';
  $('#team-count').textContent = `${state.team.length}/6`;
  $('#dex-count').textContent = `${Object.keys(state.caught).length}/151`;
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

export function renderStarterSelect() {
  const ids = [1, 4, 7];
  return `
    <div class="starter-screen">
      <h1>PokéIdle</h1>
      <p class="subtitle">Choisissez votre Pokémon de départ</p>
      <div class="starter-grid">
        ${ids
          .map((id) => {
            const sp = getSpecies(id);
            return `
            <button class="starter-card" data-starter="${id}">
              <img src="${artUrl(id)}" alt="${displayName(sp)}" />
              <strong>${displayName(sp)}</strong>
              <div class="types">${typeBadges(sp.types)}</div>
            </button>`;
          })
          .join('')}
      </div>
      ${
        localStorage.getItem('pokeidle_fan_save_v1')
          ? `<button class="btn-secondary" id="btn-continue">Continuer la partie</button>`
          : ''
      }
    </div>`;
}
