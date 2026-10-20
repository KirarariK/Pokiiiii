import { icon } from './icons.js';
import { speciesCount } from './pokemon.js';
import { ZONES, BRAND, BALLS } from './game.js';
import {
  QUEST_DEFS,
  PASS_TIERS,
  ensureDaily,
  syncQuestProgress,
  pendingQuestCount,
  pendingPassCount,
  hubBadgeCount,
} from './quests.js';

export function renderTopbar(state) {
  const zone = ZONES.find((z) => z.id === state.currentZone);
  const lvl = Math.max(1, ...state.team.map((p) => p.level || 1));
  const caught = Object.keys(state.caught || {}).length;
  return `
    <header class="pi-topbar">
      <div class="pi-brand">
        <span class="pi-logo">${icon('logo')}</span>
        <div>
          <strong class="pi-title">${BRAND.name}</strong>
          <small>${state.playerName || 'Dresseur'} · N.${lvl} · ${zone?.region || '—'}</small>
        </div>
      </div>
      <div class="pi-hud">
        <div class="pi-pill gold">${icon('coin')}<span id="money">${(state.money || 0).toLocaleString('fr-FR')} ₽</span></div>
        <div class="pi-pill">${icon('team')}<span id="team-count">${state.team.length}/6</span></div>
        <div class="pi-pill">${icon('dex')}<span id="dex-count">${caught}/${speciesCount()}</span></div>
      </div>
    </header>`;
}

export function renderBottomNav(active, state) {
  const hubN = hubBadgeCount(state);
  const items = [
    { id: 'battle', label: 'Combat', ico: 'swords' },
    { id: 'pokemon', label: 'Pokémon', ico: 'cube' },
    { id: 'zones', label: 'Zones', ico: 'map' },
    { id: 'shop', label: 'Boutique', ico: 'shop' },
    { id: 'pass', label: 'Pass', ico: 'pass', badge: pendingPassCount(state) },
    { id: 'hub', label: 'Hub', ico: 'hub', badge: hubN, isHub: true },
  ];
  return `
    <nav class="pi-bottom-nav" aria-label="Navigation">
      ${items
        .map((it) => {
          const on = active === it.id || (it.isHub && active === 'hub');
          const badge =
            it.badge > 0 ? `<span class="nav-badge">${it.badge}</span>` : '';
          return `<button type="button" class="nav-item ${on ? 'active' : ''}" data-nav="${it.id}">
            <span class="nav-ico">${icon(it.ico)}${badge}</span>
            <span class="nav-label">${it.label}</span>
          </button>`;
        })
        .join('')}
    </nav>`;
}

export function renderHub(state) {
  const zone = ZONES.find((z) => z.id === state.currentZone);
  const lvl = Math.max(...state.team.map((p) => p.level), 1);
  const q = pendingQuestCount(state);
  const tile = (id, label, ico, badge = 0) => `
    <button type="button" class="hub-tile" data-hub="${id}">
      <span class="hub-tile-ico">${icon(ico)}</span>
      <span class="hub-tile-label">${label}</span>
      ${badge > 0 ? `<span class="hub-badge">${badge}</span>` : ''}
    </button>`;

  return `
    <div class="hub-overlay" id="hub-overlay" hidden>
      <div class="hub-sheet">
        <div class="hub-accent"></div>
        <div class="hub-head">
          <div>
            <h2>HUB</h2>
            <p>${state.playerName} · N.${lvl} · ${zone?.region || 'Kanto'}</p>
          </div>
          <button type="button" class="hub-close" data-hub-close aria-label="Fermer">${icon('close')}</button>
        </div>

        <div class="hub-section">
          <h3>Essentiels</h3>
          <div class="hub-grid">
            ${tile('quests', 'Quêtes', 'quest', q)}
            ${tile('pass', 'Pass', 'pass', pendingPassCount(state))}
            ${tile('profile', 'Profil', 'profile')}
          </div>
        </div>

        <div class="hub-section">
          <h3>Aventure</h3>
          <div class="hub-grid">
            ${tile('zones', 'Zones', 'map')}
            ${tile('battle', 'Combat', 'swords')}
            ${tile('pokemon', 'Équipe / PC', 'cube')}
          </div>
        </div>

        <div class="hub-section">
          <h3>Gestion</h3>
          <div class="hub-grid">
            ${tile('shop', 'Boutique', 'shop')}
            ${tile('dex', 'Pokédex', 'dex')}
            ${tile('bonus', 'Bonus', 'bolt')}
            ${tile('settings', 'Options', 'settings')}
          </div>
        </div>

        <div class="hub-section">
          <h3>Raccourcis</h3>
          <div class="hub-shortcuts">
            <button type="button" class="hub-chip" data-hub="heal">${icon('heal')} Centre</button>
            <button type="button" class="hub-chip" data-hub="dex">${icon('dex')} Dex</button>
            <button type="button" class="hub-chip" data-hub="settings">${icon('settings')} Options</button>
          </div>
        </div>
      </div>
    </div>`;
}

export function renderQuestsPanel(state) {
  ensureDaily(state);
  syncQuestProgress(state);
  const rows = state.daily.quests
    .map((q) => {
      const def = QUEST_DEFS.find((d) => d.id === q.id);
      if (!def) return '';
      const pct = Math.min(100, (q.progress / def.target) * 100);
      const ready = !q.claimed && q.progress >= def.target;
      return `
      <article class="quest-card ${q.claimed ? 'done' : ready ? 'ready' : ''}">
        <div class="quest-ico">${icon(def.icon)}</div>
        <div class="quest-body">
          <strong>${def.title}</strong>
          <p>${def.desc}</p>
          <div class="quest-bar"><div style="width:${pct}%"></div></div>
          <span class="quest-prog">${Math.min(q.progress, def.target)} / ${def.target}</span>
        </div>
        <button type="button" class="btn-claim" data-claim-quest="${q.id}" ${ready ? '' : 'disabled'}>
          ${q.claimed ? icon('check') + ' OK' : 'Réclamer'}
        </button>
      </article>`;
    })
    .join('');

  return `
    <div class="panel-head"><h2>Quêtes du jour</h2><span class="muted">${state.daily.day}</span></div>
    <div class="quest-list">${rows}</div>`;
}

export function renderPassPanel(state) {
  ensureDaily(state);
  const xp = state.daily.passXp;
  const maxNeed = PASS_TIERS[PASS_TIERS.length - 1].need;
  const pct = Math.min(100, (xp / maxNeed) * 100);
  const tiers = PASS_TIERS.map((t) => {
    const claimed = state.daily.claimedTiers.includes(t.id);
    const unlocked = xp >= t.need;
    const rewardBits = [];
    if (t.reward.money) rewardBits.push(`${t.reward.money.toLocaleString('fr-FR')} ₽`);
    if (t.reward.balls) {
      for (const [k, v] of Object.entries(t.reward.balls)) {
        rewardBits.push(`${v}× ${BALLS[k]?.name || k}`);
      }
    }
    return `
      <button type="button" class="pass-tier ${claimed ? 'claimed' : unlocked ? 'ready' : 'locked'}"
        data-claim-pass="${t.id}" ${unlocked && !claimed ? '' : 'disabled'}>
        <span class="pass-num">${t.id}</span>
        <span class="pass-need">${t.need} XP pass</span>
        <span class="pass-reward">${rewardBits.join(' · ')}</span>
        <span class="pass-state">${claimed ? 'Récupéré' : unlocked ? 'Réclamer' : 'Verrouillé'}</span>
      </button>`;
  }).join('');

  return `
    <div class="panel-head">
      <h2>Pass journalier</h2>
      <span class="muted">${xp} XP pass</span>
    </div>
    <div class="pass-hero">
      <div class="pass-hero-ico">${icon('pass')}</div>
      <div>
        <strong>Progression du jour</strong>
        <p class="muted">Termine des quêtes pour monter le pass et débloquer des récompenses.</p>
        <div class="pass-bar"><div style="width:${pct}%"></div></div>
      </div>
    </div>
    <div class="pass-track">${tiers}</div>`;
}

export function renderProfile(state) {
  const zone = ZONES.find((z) => z.id === state.currentZone);
  const caught = Object.keys(state.caught).length;
  return `
    <div class="panel-head"><h2>Profil</h2></div>
    <div class="profile-card">
      <div class="profile-avatar">${icon('profile')}</div>
      <div>
        <strong>${state.playerName}</strong>
        <p class="muted">Région : ${new Date(state.startedAt).toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
    <div class="stat-grid">
      <div class="stat-box"><span>Combats</span><strong>${state.stats.battles}</strong></div>
      <div class="stat-box"><span>Captures</span><strong>${state.stats.catches}</strong></div>
      <div class="stat-box"><span>Argent gagné</span><strong>${state.stats.moneyEarned.toLocaleString('fr-FR')} ₽</strong></div>
      <div class="stat-box"><span>Pokédex</span><strong>${caught}/${speciesCount()}</strong></div>
      <div class="stat-box"><span>Zone</span><strong>${zone?.name || '—'}</strong></div>
      <div class="stat-box"><span>Temps</span><strong>${Math.floor(state.stats.playTime / 60)} min</strong></div>
    </div>`;
}

export function renderBonus(state) {
  return `
    <div class="panel-head"><h2>Bonus</h2></div>
    <div class="bonus-card">
      <div class="bonus-ico">${icon('bolt')}</div>
      <div>
        <strong>Boost idle</strong>
        <p class="muted">Vitesse de combat actuelle : ×${state.battleSpeed}. Change-la dans Combat.</p>
      </div>
    </div>
    <div class="bonus-card">
      <div class="bonus-ico">${icon('gift')}</div>
      <div>
        <strong>Récompenses journalières</strong>
        <p class="muted">Via Quêtes + Pass — disponibles dans le Hub.</p>
      </div>
    </div>`;
}
