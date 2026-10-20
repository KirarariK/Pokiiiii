import { icon } from './icons.js';
import { speciesCount, allSpecies, artUrl, displayName, getSpecies, pokeName, spriteUrl } from './pokemon.js';
import { ZONES, BRAND, BALLS, busyPokemonUids, currentPlayGen } from './game.js';
import { GEN_META } from './data/starters.js';
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
  SUMMON,
  RARITY_LABELS,
  ensureSummon,
  pityProgress,
  poolStats,
} from './summon.js';
import { getDailyEvent } from './events.js';
import { ascensionBonuses } from './ascension.js';
import { readyGymCount, badgeCount as ownedBadgeCount } from './arena.js';
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
  const ev = getDailyEvent();
  const asc = ascensionBonuses(state);
  return `
    <header class="pi-topbar">
      <div class="pi-brand">
        <span class="pi-logo">${icon('logo')}</span>
        <div>
          <strong class="pi-title">${BRAND.name}</strong>
          <small>${state.playerName || 'Dresseur'} · N.${lvl} · Gen ${zone?.gen || 1} · ${zone?.region || '—'}${asc.level ? ` · Asc.${asc.level}` : ''}</small>
        </div>
      </div>
      <div class="pi-hud">
        <div class="pi-pill event" title="${ev.desc}">${icon('sparkle')}<span>${ev.short}</span></div>
        <div class="pi-pill gold">${icon('coin')}<span id="money">${(state.money || 0).toLocaleString('fr-FR')} ₽</span></div>
        <div class="pi-pill">${icon('team')}<span id="team-count">${state.team.length}/6</span></div>
        <div class="pi-pill">${icon('dex')}<span id="dex-count">${caught}/${speciesCount()}</span></div>
      </div>
    </header>`;
}

/** Menu catégories à gauche (remplace l’ancienne barre bas). */
export function renderSideNav(active, state) {
  const q = pendingQuestCount(state);
  const arenaN = readyGymCount(state);
  const exN = pendingExpeditionCount(state);
  const dayN = pendingDaycareCount(state);
  const hubN = hubBadgeCount(state);
  const sections = [
    {
      title: 'Essentiels',
      items: [
        { id: 'battle', label: 'Combat', ico: 'swords' },
        { id: 'quests', label: 'Quêtes', ico: 'quest', badge: q },
        { id: 'pass', label: 'Pass', ico: 'pass', badge: pendingPassCount(state) },
        { id: 'summon', label: 'Invocation', ico: 'summon', badge: state.summon?.tickets || 0 },
        { id: 'profile', label: 'Profil', ico: 'profile' },
      ],
    },
    {
      title: 'Aventure',
      items: [
        { id: 'zones', label: 'Zones', ico: 'map' },
        { id: 'arenas', label: 'Arènes', ico: 'arena', badge: arenaN },
        { id: 'pokemon', label: 'Équipe / PC', ico: 'cube' },
        { id: 'expeditions', label: 'Expéditions', ico: 'compass', badge: exN },
        { id: 'pension', label: 'Pension', ico: 'egg', badge: dayN },
      ],
    },
    {
      title: 'Gestion',
      items: [
        { id: 'shop', label: 'Boutique', ico: 'shop' },
        { id: 'dex', label: 'Pokédex', ico: 'dex' },
        { id: 'bonus', label: 'Bonus', ico: 'bolt' },
        { id: 'ascension', label: 'Ascension', ico: 'crown' },
        { id: 'minigame', label: 'Mini-jeu', ico: 'dice' },
        { id: 'leaderboard', label: 'Classement', ico: 'trophy' },
        { id: 'settings', label: 'Options', ico: 'settings' },
      ],
    },
  ];

  const itemBtn = (it) => {
    const on = active === it.id || (it.id === 'pokemon' && (active === 'team' || active === 'box'));
    const badge = it.badge > 0 ? `<span class="nav-badge">${it.badge}</span>` : '';
    return `<button type="button" class="side-nav-item ${on ? 'active' : ''}" data-nav="${it.id}" title="${it.label}">
      <span class="nav-ico">${icon(it.ico)}${badge}</span>
      <span class="nav-label">${it.label}</span>
    </button>`;
  };

  return `
    <nav class="pi-side-nav" aria-label="Catégories">
      <div class="side-nav-brand" title="${BRAND.name}">
        <span class="side-nav-logo">${icon('logo')}</span>
        <span class="side-nav-brand-text">${BRAND.name}</span>
      </div>
      <div class="side-nav-scroll">
      ${sections
        .map(
          (sec) => `
        <div class="side-nav-section">
          <h3 class="side-nav-title">${sec.title}</h3>
          <div class="side-nav-list">${sec.items.map(itemBtn).join('')}</div>
        </div>`,
        )
        .join('')}
      </div>
      <div class="side-nav-foot">
        <button type="button" class="side-nav-item hub-launch ${active === 'hub' ? 'active' : ''}" data-nav="hub" title="Hub">
          <span class="nav-ico">${icon('hub')}${hubN > 0 ? `<span class="nav-badge">${hubN}</span>` : ''}</span>
          <span class="nav-label">Hub</span>
        </button>
        <button type="button" class="side-nav-item" data-hub="heal" title="Centre Pokémon">
          <span class="nav-ico">${icon('heal')}</span>
          <span class="nav-label">Centre</span>
        </button>
      </div>
    </nav>`;
}

/** @deprecated alias — navigations utilisent renderSideNav */
export function renderBottomNav(active, state) {
  return renderSideNav(active, state);
}

export function renderHub(state) {
  const zone = ZONES.find((z) => z.id === state.currentZone);
  const lvl = Math.max(...state.team.map((p) => p.level), 1);
  const q = pendingQuestCount(state);
  const arenaN = readyGymCount(state);
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
            ${tile('summon', 'Invocation', 'summon', state.summon?.tickets || 0)}
            ${tile('profile', 'Profil', 'profile')}
          </div>
        </div>

        <div class="hub-section">
          <h3>Aventure</h3>
          <div class="hub-grid">
            ${tile('zones', 'Zones', 'map')}
            ${tile('arenas', 'Arènes', 'arena', arenaN)}
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
            ${tile('ascension', 'Ascension', 'crown')}
            ${tile('minigame', 'Mini-jeu', 'dice')}
            ${tile('leaderboard', 'Classement', 'trophy')}
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
              const p =
                state.team.find((x) => x.uid === uid) ||
                state.box.find((x) => x.uid === uid);
              return p ? pokeName(p) : '?';
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

export function collectionByGen(state) {
  const totals = Object.create(null);
  const caught = Object.create(null);
  for (let g = 1; g <= 9; g++) {
    totals[g] = 0;
    caught[g] = 0;
  }
  for (const sp of allSpecies()) {
    const g = Number(sp.generation) || 1;
    if (!totals[g]) totals[g] = 0;
    if (!caught[g]) caught[g] = 0;
    totals[g]++;
    if (state.caught?.[sp.id]) caught[g]++;
  }
  return { totals, caught };
}

export function renderProfile(state) {
  const zone = ZONES.find((z) => z.id === state.currentZone);
  const total = speciesCount() || 1;
  const caughtN = Object.keys(state.caught || {}).length;
  const pct = Math.min(100, Math.round((caughtN / total) * 1000) / 10);
  const byGen = collectionByGen(state);
  const genBars = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((g) => {
      const t = byGen.totals[g] || 0;
      const c = byGen.caught[g] || 0;
      const p = t ? Math.round((c / t) * 100) : 0;
      const meta = GEN_META[g] || { name: `Gen ${g}` };
      return `
        <div class="dex-region-row" title="${meta.name} : ${c}/${t}">
          <span class="dex-region-label"><em>G${g}</em> ${meta.name}</span>
          <div class="dex-region-bar"><div style="width:${p}%"></div></div>
          <span class="dex-region-pct">${c}/${t}</span>
        </div>`;
    })
    .join('');
  return `
    <div class="panel-head"><h2>Profil</h2></div>
    <div class="profile-card">
      <div class="profile-avatar">${icon('profile')}</div>
      <div>
        <strong>${state.playerName}</strong>
        <p class="muted">Début : ${new Date(state.startedAt).toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
    <div class="collection-card">
      <div class="collection-head">
        <strong>Collection nationale</strong>
        <span class="collection-pct">${pct}%</span>
      </div>
      <div class="quest-bar collection-bar"><div style="width:${pct}%"></div></div>
      <p class="muted tiny">${caughtN} / ${total} espèces capturées</p>
      <div class="dex-region-list">${genBars}</div>
    </div>
    <div class="stat-grid">
      <div class="stat-box"><span>Combats</span><strong>${state.stats.battles}</strong></div>
      <div class="stat-box"><span>Captures</span><strong>${state.stats.catches}</strong></div>
      <div class="stat-box"><span>Argent gagné</span><strong>${state.stats.moneyEarned.toLocaleString('fr-FR')} ₽</strong></div>
      <div class="stat-box"><span>Pokédex</span><strong>${caughtN}/${total}</strong></div>
      <div class="stat-box"><span>Zone</span><strong>${zone?.name || '—'}</strong></div>
      <div class="stat-box"><span>Temps</span><strong>${Math.floor(state.stats.playTime / 60)} min</strong></div>
      <div class="stat-box"><span>Badges</span><strong>${ownedBadgeCount(state)}</strong></div>
    </div>`;
}

export function renderBonus(state) {
  const ev = getDailyEvent();
  const asc = ascensionBonuses(state);
  return `
    <div class="panel-head"><h2>Bonus</h2></div>
    <div class="bonus-card">
      <div class="bonus-ico">${icon('sparkle')}</div>
      <div>
        <strong>Événement du jour — ${ev.title}</strong>
        <p class="muted">${ev.desc}</p>
      </div>
    </div>
    <div class="bonus-card">
      <div class="bonus-ico">${icon('crown')}</div>
      <div>
        <strong>Ascension N.${asc.level}</strong>
        <p class="muted">XP ×${asc.xpMult.toFixed(2)} · Argent ×${asc.moneyMult.toFixed(2)} — Hub → Ascension.</p>
      </div>
    </div>
    <div class="bonus-card">
      <div class="bonus-ico">${icon('bolt')}</div>
      <div>
        <strong>Boost idle</strong>
        <p class="muted">Vitesse de combat actuelle : ×${state.battleSpeed}. Réglable dans Combat ou Options.</p>
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


export function renderSummonPanel(state) {
  ensureSummon(state);
  const sm = state.summon;
  const pity = pityProgress(state);
  const playGen = currentPlayGen(state);
  const pools = poolStats(playGen);
  const price = SUMMON.TICKET_PRICE.toLocaleString('fr-FR');
  const canPull = sm.tickets >= 1;
  const canMulti = sm.tickets >= SUMMON.MULTI_COUNT;
  const canBuy = state.money >= SUMMON.TICKET_PRICE;
  return `
    <div class="panel-head"><h2>Invocation</h2><span class="muted">${sm.totalPulls} tirages · Gen ${playGen}</span></div>
    <div class="summon-hero">
      <div class="summon-hero-ico">${icon('summon')}</div>
      <div>
        <strong>Portail Pokiiiii</strong>
        <p class="muted">Invoque un Pokémon de la <strong>Gen ${playGen}</strong> (zone actuelle). Ticket gratuit chaque jour.</p>
        <div class="summon-stats">
          <span class="pi-pill">${icon('gift')} ${sm.tickets} ticket${sm.tickets !== 1 ? 's' : ''}</span>
          <span class="pi-pill">${icon('crown')} Pity ${pity.pity}/${SUMMON.PITY_LEGENDARY}</span>
        </div>
      </div>
    </div>
    <div class="pity-block">
      <div class="pity-row"><span>Rare+ garanti</span><strong class="${pity.untilRare === 0 ? 'pity-ready' : ''}">${pity.untilRare === 0 ? 'Prêt' : `dans ${pity.untilRare}`}</strong></div>
      <div class="pity-bar ${pity.untilRare === 0 ? 'is-ready' : ''}" role="progressbar" aria-valuenow="${Math.round(pity.rarePct)}" aria-valuemin="0" aria-valuemax="100"><div class="pity-fill pity-fill-rare" style="width:${pity.rarePct}%"></div></div>
      <div class="pity-row"><span>Légendaire garanti</span><strong class="${pity.untilLegendary === 0 ? 'pity-ready' : ''}">${pity.untilLegendary === 0 ? 'Prêt' : `dans ${pity.untilLegendary}`}</strong></div>
      <div class="pity-bar ${pity.untilLegendary === 0 ? 'is-ready' : ''}" role="progressbar" aria-valuenow="${Math.round(pity.legendaryPct)}" aria-valuemin="0" aria-valuemax="100"><div class="pity-fill pity-fill-legendary" style="width:${pity.legendaryPct}%"></div></div>
    </div>
    <div class="summon-actions">
      <button type="button" class="btn-primary summon-pull" data-summon-pull="1" ${canPull ? '' : 'disabled'}>${icon('summon')} Invoquer ×1</button>
      <button type="button" class="btn-secondary summon-pull" data-summon-pull="10" ${canMulti ? '' : 'disabled'}>${icon('dice')} Invoquer ×${SUMMON.MULTI_COUNT}</button>
    </div>
    <div class="summon-buy">
      <p class="muted">Ticket : ${price} ₽ · Gratuit / jour : ${SUMMON.FREE_DAILY}</p>
      <div class="summon-buy-row">
        <button type="button" class="btn-secondary" data-summon-buy="1" ${canBuy ? '' : 'disabled'}>Acheter ×1</button>
        <button type="button" class="btn-secondary" data-summon-buy="10" ${state.money >= SUMMON.TICKET_PRICE * 10 ? '' : 'disabled'}>Acheter ×10</button>
      </div>
    </div>
    <div class="summon-pools"><h3 class="subhead">Pools</h3><div class="stat-grid">
      ${Object.entries(RARITY_LABELS).map(([k, label]) => `<div class="stat-box rarity-${k}"><span>${label}</span><strong>${pools[k] ?? 0}</strong></div>`).join('')}
    </div></div>
    <div id="summon-reveal" class="summon-reveal" hidden></div>`;
}

export function renderSummonRevealCard(result, delayMs = 0) {
  const poke = result.pokemon;
  const sp = result.species || getSpecies(poke.speciesId);
  const rarity = result.rarity || 'common';
  const label = RARITY_LABELS[rarity] || rarity;
  return `<article class="summon-card rarity-${rarity}" style="animation-delay:${delayMs}ms">
      <div class="summon-card-inner">
        <div class="summon-card-back"><span class="summon-flash">${icon('summon')}</span></div>
        <div class="summon-card-front">
          <span class="summon-rarity">${label}</span>
          <img src="${artUrl(poke.speciesId)}" alt="" loading="lazy" />
          <strong>${displayName(sp)}</strong>
          <small>N.${poke.level}${poke.shiny ? ' · Chromatique' : ''} · Gen ${sp?.generation ?? '?'}</small>
        </div>
      </div>
    </article>`;
}
