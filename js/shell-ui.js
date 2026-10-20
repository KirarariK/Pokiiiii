import { icon } from './icons.js';
import { speciesCount, pokeName, artUrl, spriteUrl } from './pokemon.js';
import { ZONES, BRAND, BALLS, busyPokemonUids } from './game.js';
import {
  QUEST_DEFS,
  PASS_TIERS,
  ensureDaily,
  syncQuestProgress,
  pendingQuestCount,
  pendingPassCount,
  hubBadgeCount,
} from './quests.js';
import {
  ensureExpeditions,
  getExpeditionDurations,
  expeditionRemainingMs,
  isExpeditionReady,
  pendingExpeditionCount,
  formatRemain,
  findOwnedPokemon,
} from './expedition.js';
import {
  ensureDaycare,
  getDaycareDurations,
  daycareRemainingMs,
  isDaycareReady,
  pendingDaycareCount,
} from './daycare.js';

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
  const exN = pendingExpeditionCount(state);
  const dayN = pendingDaycareCount(state);
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
            ${tile('expeditions', 'Expéditions', 'compass', exN)}
            ${tile('pension', 'Pension', 'egg', dayN)}
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


export function renderExpeditionsPanel(state) {
  ensureExpeditions(state);
  const busy = busyPokemonUids(state);
  const avail = [...state.team, ...state.box].filter((p) => !busy.has(p.uid));
  const zoneOpts = ZONES.filter((z) => state.unlockedZones.includes(z.id))
    .map(
      (z) =>
        `<option value="${z.id}" ${z.id === state.currentZone ? 'selected' : ''}>${z.name}</option>`
    )
    .join('');
  const durOpts = getExpeditionDurations()
    .map((d) => `<option value="${d.ms}">${d.label}</option>`)
    .join('');
  const picks = avail.length
    ? avail
        .slice(0, 24)
        .map(
          (p) => `
      <label class="ex-pick">
        <input type="checkbox" name="ex-uid" value="${p.uid}" />
        <img src="${artUrl(p.speciesId)}" alt="" loading="lazy"
          onerror="this.onerror=null;this.src='${spriteUrl(p.speciesId)}'" />
        <span>${pokeName(p)} <small>N.${p.level}</small></span>
      </label>`
        )
        .join('')
    : `<p class="muted">Aucun Pokémon disponible (garde au moins 1 lead).</p>`;

  const active = state.expeditions.filter((e) => !e.claimed);
  const list = active.length
    ? active
        .map((e) => {
          const left = expeditionRemainingMs(e);
          const ready = isExpeditionReady(e);
          const zone = ZONES.find((z) => z.id === e.zoneId);
          const names = (e.pokemonUids || [])
            .map((uid) => {
              const p = findOwnedPokemon(state, uid);
              return p ? pokeName(p) : '?';
            })
            .join(', ');
          return `
        <article class="ex-card ${ready ? 'ready' : ''}">
          <div class="ex-ico">${icon(ready ? 'gift' : 'compass')}</div>
          <div class="ex-body">
            <strong>${zone?.name || e.zoneId}</strong>
            <p class="muted">${names}</p>
            <p class="ex-timer">${icon('clock')} ${formatRemain(left)}</p>
          </div>
          <button type="button" class="btn-claim" data-claim-ex="${e.id}" ${ready ? '' : 'disabled'}>
            Réclamer
          </button>
        </article>`;
        })
        .join('')
    : `<p class="muted">Aucune expédition en cours.</p>`;

  return `
    <div class="panel-head">
      <h2>Expéditions</h2>
      <span class="muted">${icon('compass')} temps réel</span>
    </div>
    <div class="ex-form">
      <p class="muted">Envoie 1 à 3 Pokémon explorer une zone. Ils sont indisponibles au combat jusqu’au retour. Récompenses : argent, Balls, XP partagée, chance de capture.</p>
      <div class="ex-picks">${picks}</div>
      <div class="ex-fields">
        <label class="field">Zone
          <select id="ex-zone">${zoneOpts}</select>
        </label>
        <label class="field">Durée
          <select id="ex-dur">${durOpts}</select>
        </label>
      </div>
      <button type="button" class="btn-primary" data-start-ex>Lancer l’expédition</button>
    </div>
    <h3 class="subhead">En cours</h3>
    <div class="ex-list">${list}</div>`;
}

export function renderPensionPanel(state) {
  ensureDaycare(state);
  const busy = busyPokemonUids(state);
  const avail = [...state.team, ...state.box].filter((p) => !busy.has(p.uid));
  const durOpts = getDaycareDurations()
    .map((d) => `<option value="${d.ms}">${d.label}</option>`)
    .join('');
  const picks = avail.length
    ? avail
        .slice(0, 24)
        .map(
          (p) => `
      <label class="ex-pick">
        <input type="checkbox" name="day-uid" value="${p.uid}" />
        <img src="${artUrl(p.speciesId)}" alt="" loading="lazy"
          onerror="this.onerror=null;this.src='${spriteUrl(p.speciesId)}'" />
        <span>${pokeName(p)} <small>N.${p.level}</small></span>
      </label>`
        )
        .join('')
    : `<p class="muted">Pas assez de Pokémon libres (il faut en garder 1 en lead).</p>`;

  const jobs = state.daycare.filter((j) => !j.claimed);
  const list = jobs.length
    ? jobs
        .map((j) => {
          const left = daycareRemainingMs(j);
          const ready = isDaycareReady(j);
          const names = (j.parentUids || [])
            .map((uid) => {
              const poke =
                state.team.find((x) => x.uid === uid) ||
                state.box.find((x) => x.uid === uid);
              return poke ? pokeName(poke) : '?';
            })
            .join(' + ');
          return `
        <article class="ex-card ${ready ? 'ready' : ''}">
          <div class="ex-ico">${icon(ready ? 'egg' : 'clock')}</div>
          <div class="ex-body">
            <strong>${ready ? 'Œuf prêt !' : 'Incubation…'}</strong>
            <p class="muted">${names}</p>
            <p class="ex-timer">${icon('clock')} ${formatRemain(left)}</p>
          </div>
          <button type="button" class="btn-claim" data-claim-day="${j.id}" ${ready ? '' : 'disabled'}>
            ${ready ? 'Éclore' : 'Attendre'}
          </button>
        </article>`;
        })
        .join('')
    : `<p class="muted">Aucun couple en pension.</p>`;

  return `
    <div class="panel-head">
      <h2>Pension</h2>
      <span class="muted">${icon('egg')} œufs</span>
    </div>
    <div class="ex-form">
      <p class="muted">Dépose 2 Pokémon (pas le dernier lead). Après le délai, un œuf éclot en une forme de base de la lignée du 1er parent, ou une espèce commune de la même génération.</p>
      <div class="ex-picks">${picks}</div>
      <div class="ex-fields">
        <label class="field">Durée
          <select id="day-dur">${durOpts}</select>
        </label>
      </div>
      <button type="button" class="btn-primary" data-start-day>Déposer à la pension</button>
    </div>
    <h3 class="subhead">En pension</h3>
    <div class="ex-list">${list}</div>`;
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
