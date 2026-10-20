import { loadSpecies, pokeName, artUrl, displayName, getSpecies, speciesCount, createPokemon } from './pokemon.js';
import {
  createNewGame,
  saveGame,
  loadGame,
  hasSave,
  clearSave,
  createBattle,
  battleTick,
  attemptCatch,
  healTeam,
  unlockZone,
  setZone,
  buyBall,
  moveToBox,
  moveToTeam,
  swapTeam,
  tryEvolvePokemon,
  autoEvolveAll,
  applyOfflineProgress,
  unlockGen,
  currentPlayGen,
  isGenUnlocked,
  BALLS,
  BRAND,
} from './game.js';
import {
  claimQuest,
  claimPassTier,
  syncQuestProgress,
  initDailyBaselines,
} from './quests.js';
import * as UI from './ui.js';
import * as Shell from './shell-ui.js';
import { challengeGym, renderArenasPanel, ensureArena } from './arena.js';
import {
  startExpedition,
  claimExpedition,
  claimAllReadyExpeditions,
  expeditionBusyUids,
} from './expedition.js';
import {
  depositDaycare,
  claimDaycare,
  claimAllReadyDaycare,
  daycareBusyUids,
} from './daycare.js';
import {
  pullOnce,
  pullMulti,
  buyTickets,
  claimDailyFreeTickets,
  takePendingDailyTicketGrant,
  resetPoolsCache,
} from './summon.js';
import * as Audio from './audio.js';
import {
  shouldShowTutorial,
  renderTutorial,
  tutorialStepCount,
} from './tutorial.js';
import {
  canAscend,
  performAscension,
  renderAscensionPanel,
  renderAscendConfirmModal,
} from './ascension.js';
import { icon } from './icons.js';
import { renderMinigamePanel, bindMinigameHandlers, ensureMinigame } from './minigame.js';
import { renderLeaderboardPanel, pushLeaderboard } from './leaderboard.js';

function handleGymChallenge(gymId) {
  ensureArena(state);
  const res = challengeGym(state, gymId);
  if (!res.ok) {
    const msg =
      res.reason === 'already'
        ? 'Insigne déjà obtenu'
        : res.reason === 'no-gen-fighter'
          ? res.message || `Il faut un shinobi Saga ${res.needGen}`
          : res.reason === 'locked'
            ? res.needLeader
              ? `Battre ${res.needLeader} ou N.${res.need}`
              : `Niveau N.${res.need} requis`
            : 'Défi impossible';
    UI.toast(msg);
  } else if (res.win) {
    const label = res.badgeName || res.badgeId || res.badge || 'Insigne';
    UI.toast(`Victoire ! ${label} · +${(res.money || res.reward || 0).toLocaleString('fr-FR')} 両`);
    Audio.play('win');
    // Kage de village → débloque la saga suivante
    if (res.gym?.champion) {
      const next = (Number(res.gym.gen) || 1) + 1;
      const unlocked = unlockGen(state, next);
      if (unlocked.ok) {
        UI.toast(
          `Saga ${unlocked.meta?.roman || next} (${unlocked.meta?.name || ''}) débloquée · ${unlocked.pokemon ? 'recrue offerte' : ''}`,
        );
      }
    }
  } else {
    UI.toast(`Défaite contre ${res.gym?.leaderName || 'le champion'}…`);
  }
  saveGame(state);
  refreshAll();
}

let state = null;
let battle = null;
let tickTimer = null;
let saveTimer = null;
let tab = 'battle';
let starterGen = 1;
let dexGen = 0;
let dexQuery = '';
let hubOpen = false;
let tutorialStep = 0;
let logFilter = 'all';
/** Pause courte après KO pour éviter le « flash » nouveau combat. */
let victoryHoldUntil = 0;

const TICK_BASE_MS = 750;

async function boot() {
  UI.$('#app').innerHTML = `<div class="loading"><div class="loading-orb"></div><span>Chargement ${BRAND.name}…</span></div>`;
  await loadSpecies();
  resetPoolsCache();

  const params = new URLSearchParams(location.search);
  const demo = params.get('demo');
  if (
    demo === '1' ||
    demo === 'hub' ||
    demo === 'pass' ||
    demo === 'quests' ||
    demo === 'ascension' ||
    demo === 'tutorial' ||
    demo === 'expeditions' ||
    demo === 'pension' ||
    demo === 'arenas' ||
    demo === 'summon' ||
    demo === 'minigame' ||
    demo === 'leaderboard'
  ) {
    startNew(4);
    if (demo !== 'tutorial') {
      state.tutorialDone = true;
      hideTutorialOverlay();
    } else {
      state.tutorialDone = false;
      tutorialStep = 0;
      setTimeout(() => showTutorialOverlay(), 80);
    }
    if (demo === 'hub' || demo === 'ascension') setTimeout(() => openHub(), 50);
    if (demo === 'pass') setTimeout(() => setTab('pass'), 50);
    if (demo === 'quests') setTimeout(() => setTab('quests'), 50);
    if (demo === 'ascension') setTimeout(() => setTab('ascension'), 80);
    if (demo === 'expeditions') setTimeout(() => setTab('expeditions'), 50);
    if (demo === 'pension') setTimeout(() => setTab('pension'), 50);
    if (demo === 'arenas') setTimeout(() => setTab('arenas'), 50);
    if (demo === 'summon') setTimeout(() => setTab('summon'), 50);
    if (demo === 'minigame') setTimeout(() => setTab('minigame'), 50);
    if (demo === 'leaderboard') setTimeout(() => setTab('leaderboard'), 50);
    return;
  }

  showTitle();
}

function showTitle() {
  UI.$('#app').innerHTML = `<div id="title-root">${UI.renderStarterSelect(starterGen)}</div>`;
  bindTitle();
}

function bindTitle() {
  UI.$$('[data-starter-gen]').forEach((btn) => {
    btn.addEventListener('click', () => {
      starterGen = Number(btn.dataset.starterGen);
      UI.$('#title-root').innerHTML = UI.renderStarterSelect(starterGen);
      bindTitle();
    });
  });
  UI.$$('[data-starter]').forEach((btn) => {
    btn.addEventListener('click', () => startNew(Number(btn.dataset.starter)));
  });
  const cont = UI.$('#btn-continue');
  if (cont) {
    cont.addEventListener('click', () => {
      const s = loadGame();
      if (s) startExisting(s);
    });
  }
}

function startNew(starterId) {
  state = createNewGame(starterId);
  Audio.syncMuteFromState(state);
  seedDemoRoster(state);
  saveGame(state);
  enterGame();
}

function seedDemoRoster(state) {
  if (!new URLSearchParams(location.search).has('demo')) return;
  for (const sid of [7, 10, 16, 19, 25]) {
    try {
      const poke = createPokemon(sid, 5 + Math.floor(Math.random() * 5));
      state.caught[sid] = true;
      state.seen[sid] = true;
      if (state.team.length < 6) state.team.push(poke);
      else state.box.push(poke);
    } catch (_) {}
  }
}

function startExisting(s) {
  state = s;
  Audio.syncMuteFromState(state);
  initDailyBaselines(state);
  const offline = applyOfflineProgress(state);
  const expClaim = claimAllReadyExpeditions(state);
  const dayClaim = claimAllReadyDaycare(state);
  if (expClaim.count || dayClaim.count) saveGame(state);
  enterGame();
  if (offline) {
    UI.toast(`Hors-ligne : ${offline.battles} combats · +${offline.xpGain} XP · +${offline.moneyGain}両`);
  }
  if (expClaim.count || dayClaim.count) {
    const bits = [];
    if (expClaim.count) bits.push(`${expClaim.count} expédition${expClaim.count > 1 ? 's' : ''}`);
    if (dayClaim.count) bits.push(`${dayClaim.count} dojo`);
    UI.toast(`Récompenses prêtes : ${bits.join(' · ')}`);
  }
}

function enterGame() {
  // Ticket quotidien (idempotent) — toast si crédit pendant ce boot
  let ticketGrant = takePendingDailyTicketGrant();
  if (!ticketGrant) {
    const daily = claimDailyFreeTickets(state);
    if (daily.ok) ticketGrant = daily.granted;
  }
  renderShell();
  battle = createBattle(state);
  bindShell();
  setTab('battle');
  startLoop();
  saveTimer = setInterval(() => saveGame(state), 8000);
  if (shouldShowTutorial(state)) {
    tutorialStep = 0;
    showTutorialOverlay();
  }
  if (ticketGrant) {
    UI.toast(`+${ticketGrant} ticket d’invocation quotidien`);
  }
}

function renderShell() {
  UI.$('#app').innerHTML = `
    <div class="game-shell pi-shell">
      <div id="side-nav-host">${Shell.renderSideNav(tab, state)}</div>
      <div class="pi-main">
      ${Shell.renderTopbar(state)}
      <main class="content pi-content">
        <section id="panel-battle" class="panel">
          <div id="battle-view"></div>
          <div class="battle-controls">
            <div id="catch-btns" class="catch-row"></div>
            <div class="control-dock">
              <label class="pi-toggle" title="Sceau auto sous 25% PV">
                <input type="checkbox" id="auto-catch" />
                <span class="pi-toggle-track"><span class="pi-toggle-knob"></span></span>
                <span class="pi-toggle-copy">
                  <strong>Auto-sceau</strong>
                  <small>sous 25% PV</small>
                </span>
              </label>
              <label class="pi-field">
                <span class="pi-field-label">${icon('scroll')} Sceau</span>
                <select id="auto-ball" class="pi-select">
                  ${Object.values(BALLS)
                    .filter((b) => b.id !== 'masterball')
                    .map((b) => `<option value="${b.id}">${b.name}</option>`)
                    .join('')}
                </select>
              </label>
              <label class="pi-field">
                <span class="pi-field-label">${icon('bolt')} Vitesse</span>
                <select id="battle-speed" class="pi-select">
                  <option value="0.75">0.75×</option>
                  <option value="1" selected>1×</option>
                  <option value="1.5">1.5×</option>
                  <option value="2">2×</option>
                  <option value="3">3×</option>
                  <option value="5">5×</option>
                </select>
              </label>
              <button id="btn-heal" class="btn-heal" type="button">${icon('heal')} Infirmerie</button>
            </div>
          </div>
          <div class="log-panel">
            <div class="log-panel-head">
              <h3>Journal</h3>
            </div>
            <div id="log-toolbar">${UI.renderLogToolbar(logFilter)}</div>
            <div id="log"></div>
          </div>
        </section>

        <section id="panel-pokemon" class="panel">
          <div class="panel-head">
            <h2>Shinobi</h2>
            <button id="btn-evolve-all" class="btn-secondary" type="button">Tout progresser</button>
          </div>
          <h3 class="subhead">Escouade <small class="muted">(avant-garde = duel 1v1)</small></h3>
          <div id="team-grid" class="card-grid"></div>
          <h3 class="subhead">Réserve</h3>
          <div id="box-grid" class="card-grid"></div>
        </section>

        <section id="panel-zones" class="panel">
          <div class="panel-head"><h2>Zones</h2></div>
          <div id="zones-list"></div>
        </section>

        <section id="panel-shop" class="panel">
          <div class="panel-head"><h2>Boutique</h2></div>
          <div id="shop-list" class="shop-list"></div>
        </section>

        <section id="panel-pass" class="panel">
          <div id="pass-view"></div>
        </section>

        <section id="panel-quests" class="panel">
          <div id="quests-view"></div>
        </section>

        <section id="panel-dex" class="panel">
          <div class="panel-head"><h2>Bingo Book</h2></div>
          <div id="dex-view"></div>
        </section>

        <section id="panel-profile" class="panel">
          <div id="profile-view"></div>
        </section>

        <section id="panel-expeditions" class="panel">
          <div id="expeditions-view"></div>
        </section>

        <section id="panel-pension" class="panel">
          <div id="pension-view"></div>
        </section>

        <section id="panel-arenas" class="panel">
          <div id="arenas-view"></div>
        </section>

        <section id="panel-bonus" class="panel">
          <div id="bonus-view"></div>
        </section>

        <section id="panel-summon" class="panel">
          <div id="summon-view"></div>
        </section>

        <section id="panel-ascension" class="panel">
          <div id="ascension-view"></div>
        </section>

        <section id="panel-minigame" class="panel">
          <div id="minigame-view"></div>
        </section>

        <section id="panel-leaderboard" class="panel">
          <div id="leaderboard-view"></div>
        </section>

        <section id="panel-settings" class="panel">
          <div class="panel-head"><h2>${icon('settings')} Options</h2></div>
          <div class="settings settings-board">
            <div class="settings-hero">
              <span class="settings-hero-ico">${icon('logo')}</span>
              <div>
                <strong>${BRAND.name}</strong>
                <p>Sauvegarde auto · ${speciesCount()} shinobi Sagas I–IV</p>
              </div>
            </div>

            <div class="settings-card">
              <h3 class="settings-card-title">Ninja</h3>
              <label class="pi-field block">
                <span class="pi-field-label">${icon('profile')} Nom</span>
                <input id="player-name" class="pi-input" type="text" maxlength="16" value="${state.playerName || 'Ninja'}" />
              </label>
            </div>

            <div class="settings-card">
              <h3 class="settings-card-title">Audio & sceaux</h3>
              <label class="pi-toggle settings-mute" title="Couper le son">
                <input type="checkbox" id="opt-mute" ${state.settings?.mute ? 'checked' : ''} />
                <span class="pi-toggle-track"><span class="pi-toggle-knob"></span></span>
                <span class="pi-toggle-copy">
                  <strong>${icon(state.settings?.mute ? 'mute' : 'volume')} Son</strong>
                  <small>${state.settings?.mute ? 'Coupé' : 'Activé'}</small>
                </span>
              </label>
              <label class="pi-toggle" title="Sceau auto sous 25% PV">
                <input type="checkbox" id="opt-auto-catch" ${state.autoCatch ? 'checked' : ''} />
                <span class="pi-toggle-track"><span class="pi-toggle-knob"></span></span>
                <span class="pi-toggle-copy">
                  <strong>Auto-sceau</strong>
                  <small>sous 25% PV adversaire</small>
                </span>
              </label>
              <div class="settings-grid-2">
                <label class="pi-field">
                  <span class="pi-field-label">${icon('ball')} Sceau auto</span>
                  <select id="opt-auto-ball" class="pi-select">
                    ${Object.values(BALLS)
                      .filter((b) => b.id !== 'masterball')
                      .map(
                        (b) =>
                          `<option value="${b.id}" ${state.autoCatchBall === b.id ? 'selected' : ''}>${b.name}</option>`,
                      )
                      .join('')}
                  </select>
                </label>
                <label class="pi-field">
                  <span class="pi-field-label">${icon('bolt')} Vitesse</span>
                  <select id="opt-battle-speed" class="pi-select">
                    ${[0.75, 1, 1.5, 2, 3, 5]
                      .map(
                        (v) =>
                          `<option value="${v}" ${Number(state.battleSpeed || 1) === v ? 'selected' : ''}>${v}×</option>`,
                      )
                      .join('')}
                  </select>
                </label>
              </div>
            </div>

            <div class="settings-card">
              <h3 class="settings-card-title">Raccourcis</h3>
              <p class="settings-keys-row">
                <kbd>1</kbd>–<kbd>6</kbd> catégories · <kbd>H</kbd> Hub · <kbd>M</kbd> mute
              </p>
              <p class="muted tiny">Menu compact : le reste via le Hub, ou « Tout afficher ».</p>
            </div>

            <div class="settings-actions">
              <button id="btn-save" class="btn-primary" type="button">${icon('check')} Sauvegarder</button>
              <button id="btn-replay-tutorial" class="btn-ghost" type="button">${icon('help')} Tutoriel</button>
              <button id="btn-reset" class="btn-danger" type="button">${icon('close')} Réinitialiser</button>
            </div>
            <p class="muted disclaimer">Fan-game non officiel. Art AniList · Naruto © Kishimoto / Shueisha / Pierrot.</p>
          </div>
        </section>
      </main>
      </div>
      ${Shell.renderHub(state)}
    </div>
    <div id="toasts"></div>
    <div id="modal-overlay" hidden><div class="modal" id="modal-body"></div></div>
    <div id="tutorial-host"></div>
  `;
}

function syncBattleControlsFromState() {
  const autoCatch = UI.$('#auto-catch');
  const autoBall = UI.$('#auto-ball');
  const battleSpeed = UI.$('#battle-speed');
  const optAutoCatch = UI.$('#opt-auto-catch');
  const optAutoBall = UI.$('#opt-auto-ball');
  const optSpeed = UI.$('#opt-battle-speed');
  if (autoCatch) autoCatch.checked = !!state.autoCatch;
  if (optAutoCatch) optAutoCatch.checked = !!state.autoCatch;
  if (autoBall) autoBall.value = state.autoCatchBall || 'pokeball';
  if (optAutoBall) optAutoBall.value = state.autoCatchBall || 'pokeball';
  if (battleSpeed) battleSpeed.value = String(state.battleSpeed || 1);
  if (optSpeed) optSpeed.value = String(state.battleSpeed || 1);
}

function setAutoCatch(on) {
  state.autoCatch = !!on;
  syncBattleControlsFromState();
  saveGame(state);
}

function setAutoCatchBall(id) {
  // Sceau Kage interdit en auto (trop fort / trop cher)
  if (id === 'masterball') id = 'pokeball';
  state.autoCatchBall = id || 'pokeball';
  syncBattleControlsFromState();
  saveGame(state);
}

function setBattleSpeed(v) {
  state.battleSpeed = Number(v) || 1;
  syncBattleControlsFromState();
  startLoop();
  saveGame(state);
}

function bindShell() {
  syncBattleControlsFromState();
  UI.$('#auto-catch')?.addEventListener('change', (e) => setAutoCatch(e.target.checked));
  UI.$('#opt-auto-catch')?.addEventListener('change', (e) => setAutoCatch(e.target.checked));
  UI.$('#auto-ball')?.addEventListener('change', (e) => setAutoCatchBall(e.target.value));
  UI.$('#opt-auto-ball')?.addEventListener('change', (e) => setAutoCatchBall(e.target.value));
  UI.$('#battle-speed')?.addEventListener('change', (e) => setBattleSpeed(e.target.value));
  UI.$('#opt-battle-speed')?.addEventListener('change', (e) => setBattleSpeed(e.target.value));

  UI.$('#btn-heal')?.addEventListener('click', () => {
    Audio.play('ui');
    healTeam(state);
    refreshAll();
    UI.toast('Équipe soignée');
  });

  UI.$('#btn-evolve-all')?.addEventListener('click', () => {
    Audio.play('ui');
    const n = autoEvolveAll(state);
    UI.toast(n ? `${n} progression(s)` : 'Aucune progression disponible');
    refreshAll();
  });

  UI.$('#opt-mute')?.addEventListener('change', (e) => {
    if (!state.settings) state.settings = { mute: false, navExpanded: !!state.settings?.navExpanded };
    state.settings.mute = !!e.target.checked;
    Audio.syncMuteFromState(state);
    saveGame(state);
    const copy = UI.$('.settings-mute .pi-toggle-copy');
    if (copy) {
      copy.innerHTML = `<strong>${icon(state.settings.mute ? 'mute' : 'volume')} Son</strong><small>${state.settings.mute ? 'Coupé' : 'Activé'}</small>`;
    }
    if (!state.settings.mute) Audio.play('ui');
  });

  UI.$('#btn-save')?.addEventListener('click', () => {
    Audio.play('ui');
    const name = UI.$('#player-name')?.value?.trim();
    if (name) state.playerName = name.slice(0, 16);
    saveGame(state);
    UI.toast('Partie sauvegardée');
    refreshChrome();
  });

  UI.$('#btn-replay-tutorial')?.addEventListener('click', () => {
    Audio.play('ui');
    state.tutorialDone = false;
    tutorialStep = 0;
    saveGame(state);
    showTutorialOverlay();
  });

  UI.$('#btn-reset')?.addEventListener('click', () => {
    if (confirm('Supprimer la sauvegarde et recommencer ?')) {
      clearInterval(tickTimer);
      clearInterval(saveTimer);
      clearSave();
      location.href = location.pathname;
    }
  });

  UI.$('#modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') UI.hideModal();
  });

  UI.$('#app').addEventListener('click', onClick);
  UI.$('#app').addEventListener('input', onInput);
  document.addEventListener('keydown', onKeydown);
}

function toggleMute() {
  if (!state.settings) state.settings = { mute: false, navExpanded: false };
  state.settings.mute = !state.settings.mute;
  Audio.syncMuteFromState(state);
  saveGame(state);
  const cb = UI.$('#opt-mute');
  if (cb) cb.checked = state.settings.mute;
  const copy = UI.$('.settings-mute .pi-toggle-copy');
  if (copy) {
    copy.innerHTML = `<strong>${icon(state.settings.mute ? 'mute' : 'volume')} Son</strong><small>${state.settings.mute ? 'Coupé' : 'Activé'}</small>`;
  }
  UI.toast(state.settings.mute ? 'Son coupé' : 'Son activé');
  if (!state.settings.mute) Audio.play('ui');
}

function onKeydown(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = (e.target?.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
  if (UI.$('#modal-overlay') && !UI.$('#modal-overlay').hidden) return;
  if (UI.$('#tutorial-host')?.querySelector('.tutorial-card')) return;

  const key = e.key;
  const navMap = {
    '1': 'battle',
    '2': 'quests',
    '3': 'zones',
    '4': 'arenas',
    '5': 'shop',
    '6': 'dex',
  };
  if (navMap[key]) {
    e.preventDefault();
    Audio.play('ui');
    const id = navMap[key];
    if (id === 'hub') {
      if (hubOpen) closeHub();
      else openHub();
    } else {
      setTab(id);
    }
    return;
  }
  if (key === 'h' || key === 'H') {
    e.preventDefault();
    Audio.play('ui');
    if (hubOpen) closeHub();
    else openHub();
    return;
  }
  if (key === 'm' || key === 'M') {
    e.preventDefault();
    toggleMute();
  }
}

function setTab(id) {
  tab = id;
  hubOpen = false;
  const hub = UI.$('#hub-overlay');
  if (hub) hub.hidden = true;

  const map = {
    battle: 'battle',
    pokemon: 'pokemon',
    team: 'pokemon',
    box: 'pokemon',
    zones: 'zones',
    shop: 'shop',
    pass: 'pass',
    quests: 'quests',
    dex: 'dex',
    profile: 'profile',
    bonus: 'bonus',
    summon: 'summon',
    ascension: 'ascension',
    arenas: 'arenas',
    arena: 'arenas',
    expeditions: 'expeditions',
    pension: 'pension',
    minigame: 'minigame',
    leaderboard: 'leaderboard',
    settings: 'settings',
    heal: 'battle',
  };
  const panelId = map[id] || 'battle';
  tab = panelId === 'battle' ? 'battle' : id === 'hub' ? tab : panelId;

  UI.$$('.panel').forEach((p) => {
    p.classList.toggle('active', p.id === `panel-${panelId}`);
  });

  refreshAll();
}

function refreshSideNav(active = tab) {
  const host = UI.$('#side-nav-host');
  if (!host) return;
  host.innerHTML = Shell.renderSideNav(hubOpen ? 'hub' : active, state);
  host.hidden = !!hubOpen;
  host.setAttribute('aria-hidden', hubOpen ? 'true' : 'false');
  document.body.classList.toggle('hub-open', !!hubOpen);
}

function openHub() {
  hubOpen = true;
  const hub = UI.$('#hub-overlay');
  if (hub) {
    // re-render hub content for badges
    hub.outerHTML = Shell.renderHub(state);
    UI.$('#hub-overlay').hidden = false;
  }
  refreshSideNav('hub');
}

function closeHub() {
  hubOpen = false;
  const hub = UI.$('#hub-overlay');
  if (hub) hub.hidden = true;
  refreshSideNav(tab);
}

function refreshChrome() {
  const top = UI.$('.pi-topbar');
  if (top) {
    const tmp = document.createElement('div');
    tmp.innerHTML = Shell.renderTopbar(state);
    top.replaceWith(tmp.firstElementChild);
  }
  refreshSideNav(tab);
}

function onInput(e) {
  if (e.target.id === 'dex-search') {
    dexQuery = e.target.value;
    UI.$('#dex-view').innerHTML = UI.renderBingoBook(state, { gen: dexGen, query: dexQuery });
  }
}

function showTutorialOverlay() {
  const host = UI.$('#tutorial-host');
  if (!host) return;
  host.innerHTML = renderTutorial(tutorialStep);
}

function hideTutorialOverlay() {
  const host = UI.$('#tutorial-host');
  if (host) host.innerHTML = '';
}

function finishTutorial() {
  state.tutorialDone = true;
  saveGame(state);
  hideTutorialOverlay();
  Audio.play('ui');
}

function onClick(e) {
  const tut = e.target.closest('[data-tut]');
  if (tut) {
    const a = tut.dataset.tut;
    if (a === 'next') {
      tutorialStep = Math.min(tutorialStepCount() - 1, tutorialStep + 1);
      Audio.play('ui');
      showTutorialOverlay();
    } else if (a === 'prev') {
      tutorialStep = Math.max(0, tutorialStep - 1);
      Audio.play('ui');
      showTutorialOverlay();
    } else if (a === 'skip' || a === 'done') {
      finishTutorial();
    }
    return;
  }

  if (e.target.closest('[data-ascend-open]')) {
    Audio.play('ui');
    if (!canAscend(state)) {
      UI.toast('Conditions d’ascension non remplies');
      return;
    }
    UI.showModal(renderAscendConfirmModal(state));
    return;
  }
  if (e.target.closest('[data-ascend-cancel]')) {
    Audio.play('ui');
    UI.hideModal();
    return;
  }
  if (e.target.closest('[data-ascend-confirm]')) {
    const res = performAscension(state);
    UI.hideModal();
    if (!res.ok) {
      UI.toast('Ascension impossible');
      return;
    }
    Audio.play('levelup');
    battle = createBattle(state);
    saveGame(state);
    UI.toast(`Ascension N.${res.level} !`);
    setTab('ascension');
    refreshAll();
    return;
  }

  const logChip = e.target.closest('[data-log-filter]');
  if (logChip) {
    Audio.play('ui');
    logFilter = logChip.dataset.logFilter || 'all';
    if (UI.$('#log-toolbar')) UI.$('#log-toolbar').innerHTML = UI.renderLogToolbar(logFilter);
    if (typeof UI.resetLogPatch === 'function') UI.resetLogPatch();
    if (UI.$('#log')) UI.$('#log').innerHTML = UI.renderLog(state, logFilter);
    return;
  }
  if (e.target.closest('[data-log-clear]')) {
    Audio.play('ui');
    state.log = [];
    saveGame(state);
    if (typeof UI.resetLogPatch === 'function') UI.resetLogPatch();
    if (UI.$('#log')) UI.$('#log').innerHTML = '';
    UI.toast('Journal effacé');
    return;
  }

  const navExpand = e.target.closest('[data-nav-expand]');
  if (navExpand) {
    Audio.play('ui');
    if (!state.settings) state.settings = { mute: false, navExpanded: false };
    state.settings.navExpanded = !state.settings.navExpanded;
    saveGame(state);
    refreshSideNav();
    UI.toast(state.settings.navExpanded ? 'Menu complet' : 'Menu compact — reste dans le Hub');
    return;
  }

  const nav = e.target.closest('[data-nav]');
  if (nav) {
    Audio.play('ui');
    const id = nav.dataset.nav;
    if (id === 'hub') {
      if (hubOpen) closeHub();
      else openHub();
    } else {
      setTab(id);
    }
    return;
  }

  if (e.target.closest('[data-hub-close]')) {
    Audio.play('ui');
    closeHub();
    return;
  }

  const hubTile = e.target.closest('[data-hub]');
  if (hubTile) {
    Audio.play('ui');
    const id = hubTile.dataset.hub;
    if (id === 'heal') {
      healTeam(state);
      closeHub();
      setTab('battle');
      UI.toast('Équipe soignée');
      return;
    }
    closeHub();
    setTab(id);
    return;
  }

  const claimQ = e.target.closest('[data-claim-quest]');
  if (claimQ) {
    const res = claimQuest(state, claimQ.dataset.claimQuest);
    UI.toast(res.ok ? 'Récompense de quête récupérée' : 'Quête non disponible');
    refreshAll();
    return;
  }

  const startEx = e.target.closest('[data-start-ex]');
  if (startEx) {
    const uids = [...document.querySelectorAll('input[name="ex-uid"]:checked')].map((el) => el.value);
    const durationMs = Number(UI.$('#ex-dur')?.value || 0);
    const zoneId = UI.$('#ex-zone')?.value;
    const res = startExpedition(state, { pokemonUids: uids, durationMs, zoneId }, daycareBusyUids(state));
    const msgs = {
      count: 'Choisis 1 à 3 shinobi',
      duration: 'Durée invalide',
      zone: 'Zone verrouillée',
      'last-team': 'Garde au moins 1 avant-garde disponible',
      busy: 'Shinobi déjà occupé',
      missing: 'Shinobi introuvable',
    };
    UI.toast(res.ok ? 'Expédition lancée' : msgs[res.reason] || 'Impossible');
    if (res.ok) { saveGame(state); refreshAll(); }
    return;
  }

  const claimEx = e.target.closest('[data-claim-ex]');
  if (claimEx) {
    const res = claimExpedition(state, claimEx.dataset.claimEx);
    if (res.ok) {
      const r = res.reward;
      let msg = `+${r.money}両 · +${r.xpEach} XP`;
      if (r.pokemon) msg += ` · ${pokeName(r.pokemon)}`;
      UI.toast(msg);
      saveGame(state);
    } else UI.toast(res.reason === 'not-ready' ? 'Pas encore prêt' : 'Indisponible');
    refreshAll();
    return;
  }

  const startDay = e.target.closest('[data-start-day]');
  if (startDay) {
    const uids = [...document.querySelectorAll('input[name="day-uid"]:checked')].map((el) => el.value);
    const durationMs = Number(UI.$('#day-dur')?.value || 0);
    const res = depositDaycare(state, { parentUids: uids, durationMs }, expeditionBusyUids(state));
    const msgs = {
      count: 'Choisis exactement 2 shinobi',
      duration: 'Durée invalide',
      'last-team': 'Garde au moins 1 avant-garde disponible',
      busy: 'Shinobi déjà occupé',
      missing: 'Shinobi introuvable',
    };
    UI.toast(res.ok ? 'Envoyés au dojo' : msgs[res.reason] || 'Impossible');
    if (res.ok) { saveGame(state); refreshAll(); }
    return;
  }

  const claimDay = e.target.closest('[data-claim-day]');
  if (claimDay) {
    const res = claimDaycare(state, claimDay.dataset.claimDay);
    if (res.ok) {
      UI.toast(`Éclosion : ${pokeName(res.pokemon)}`);
      saveGame(state);
    } else UI.toast(res.reason === 'not-ready' ? 'Pas encore prêt' : 'Indisponible');
    refreshAll();
    return;
  }

  const claimP = e.target.closest('[data-claim-pass]');
  if (claimP) {
    const res = claimPassTier(state, Number(claimP.dataset.claimPass));
    UI.toast(res.ok ? 'Palier du pass récupéré' : 'Palier verrouillé');
    refreshAll();
    return;
  }

  const genChip = e.target.closest('[data-dex-gen]');
  if (genChip) {
    dexGen = Number(genChip.dataset.dexGen);
    UI.$('#dex-view').innerHTML = UI.renderBingoBook(state, { gen: dexGen, query: dexQuery });
    return;
  }

  const catchBtn = e.target.closest('[data-catch]');
  if (catchBtn) {
    const res = attemptCatch(state, battle, catchBtn.dataset.catch);
    if (!res.ok) UI.toast(res.reason === 'no-ball' ? 'Plus de sceaux' : 'Sceau impossible');
    else if (res.success) {
      Audio.play('catch');
      UI.toast(`Scellé ${pokeName(res.pokemon)}`);
      showCatchModal(res.pokemon);
      battle = createBattle(state);
    } else {
      Audio.play('hit');
      UI.toast(`${res.ball.name} a échoué`);
    }
    refreshAll();
    return;
  }


  const summonPull = e.target.closest('[data-summon-pull]');
  if (summonPull) {
    const n = Number(summonPull.dataset.summonPull) || 1;
    const stage = UI.$('#summon-stage');
    stage?.classList.add('is-summoning');
    const res = n >= 10 ? pullMulti(state, n) : pullOnce(state);
    if (!res.ok) {
      stage?.classList.remove('is-summoning');
      UI.toast(res.reason === 'no-ticket' ? 'Pas assez de tickets' : 'Kuchiyose impossible');
      refreshAll();
      return;
    }
    const results = res.results || [res];
    UI.toast(n >= 10 ? `${results.length} invocations` : `Kuchiyose : ${pokeName(res.pokemon)}`);
    Audio.play('catch');
    // Laisse le burst du portail, puis reveal
    setTimeout(() => {
      refreshAll();
      showSummonReveal(results);
      UI.$('#summon-stage')?.classList.remove('is-summoning');
    }, 420);
    return;
  }
  const summonBuy = e.target.closest('[data-summon-buy]');
  if (summonBuy) {
    const qty = Number(summonBuy.dataset.summonBuy) || 1;
    const res = buyTickets(state, qty);
    UI.toast(res.ok ? `+${qty} ticket(s)` : 'Pas assez d’argent');
    refreshAll();
    return;
  }

  const buy = e.target.closest('[data-buy]');
  if (buy) {
    const ok = buyBall(state, buy.dataset.buy, Number(buy.dataset.qty));
    UI.toast(ok ? 'Achat effectué' : 'Pas assez d’argent');
    refreshAll();
    return;
  }

  const zoneBtn = e.target.closest('[data-zone]');
  if (zoneBtn) {
    const id = zoneBtn.dataset.zone;
    if (state.unlockedZones.includes(id)) {
      if (!setZone(state, id)) {
        UI.toast('Saga verrouillée');
      } else {
        battle = createBattle(state);
        UI.toast(`Zone Saga ${currentPlayGen(state)}`);
      }
    } else {
      const res = unlockZone(state, id);
      if (!res?.ok) {
        UI.toast(
          res?.reason === 'gen-locked'
            ? `Saga ${res.gen} verrouillée — battez le Kage précédent`
            : res?.reason === 'no-money'
              ? 'Fonds insuffisants'
              : 'Zone indisponible',
        );
      } else {
        UI.toast('Zone débloquée');
        setZone(state, id);
        battle = createBattle(state);
      }
    }
    refreshAll();
    return;
  }

  const act = e.target.closest('[data-act]');
  if (act) {
    const { act: a, uid, i } = act.dataset;
    if (a === 'evolve') {
      const neu = tryEvolvePokemon(state, uid);
      if (neu) UI.toast(`Progression : ${neu.nameFr}`);
    } else if (a === 'box') moveToBox(state, uid);
    else if (a === 'team') {
      if (!moveToTeam(state, uid)) UI.toast('Équipe pleine (6 max)');
    } else if (a === 'up') swapTeam(state, Number(i), Number(i) - 1);
    refreshAll();
  }
}


function showSummonReveal(results) {
  const host = UI.$('#summon-reveal');
  if (!host || !results?.length) return;
  host.hidden = false;
  host.classList.remove('is-animating', 'is-revealed');
  host.innerHTML = `<div class="summon-reveal-head"><strong>Résultat</strong><span class="muted">${results.length} carte${results.length > 1 ? 's' : ''}</span></div>
    <div class="summon-reveal-grid">${results
      .map((r, i) => Shell.renderSummonRevealCard(r, 80 + i * 110))
      .join('')}</div>`;
  // reflow pour relancer l’anim de flip
  void host.offsetWidth;
  host.classList.add('is-animating');
  host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  const holdMs = 1100 + results.length * 110;
  setTimeout(() => {
    // Garde la face visible après la fin de l’animation
    host.classList.add('is-revealed');
    host.classList.remove('is-animating');
  }, holdMs);
}

function showCatchModal(poke) {
  const sp = getSpecies(poke.speciesId);
  UI.showModal(`
    <div class="catch-modal">
      <h2>${displayName(sp)} scellé</h2>
      <img src="${artUrl(poke.speciesId)}" alt="" />
      <p><strong>N.${poke.level}</strong> · Saga ${sp.generation}${poke.shiny ? ' · Aura rare' : ''}</p>
      <button class="btn-primary" id="close-modal" type="button">Continuer</button>
    </div>
  `);
  UI.$('#close-modal').onclick = () => UI.hideModal();
}

/** Mise à jour légère combat — jamais de rebuild nav / Hub / autres panneaux. */
function refreshBattleLive({ syncQuests = false } = {}) {
  if (!state) return;
  if (syncQuests) syncQuestProgress(state);
  UI.updateHud(state);

  // Patch DOM in-place : pas de innerHTML sur l’défi (évite le flicker sprites)
  const patched = typeof UI.patchBattle === 'function' && UI.patchBattle(state, battle);
  if (!patched && UI.$('#battle-view')) {
    UI.$('#battle-view').innerHTML = UI.renderBattle(state, battle);
    if (typeof UI.resetLogPatch === 'function') UI.resetLogPatch();
  }

  const catchOk = typeof UI.patchCatchButtons === 'function' && UI.patchCatchButtons(state, battle);
  if (!catchOk && UI.$('#catch-btns')) {
    UI.$('#catch-btns').innerHTML = UI.renderCatchButtons(state, battle);
  }

  if (typeof UI.patchLog === 'function') UI.patchLog(state, logFilter);
  else if (UI.$('#log')) UI.$('#log').innerHTML = UI.renderLog(state, logFilter);
}

/** Ne rafraîchit que le panneau de l’onglet actif. */
function refreshActivePanel() {
  if (!state) return;
  const t = tab === 'arena' ? 'arenas' : tab === 'team' || tab === 'box' ? 'pokemon' : tab;

  if (t === 'battle') {
    if (UI.$('#battle-view')) UI.$('#battle-view').innerHTML = UI.renderBattle(state, battle);
    if (UI.$('#catch-btns')) UI.$('#catch-btns').innerHTML = UI.renderCatchButtons(state, battle);
    if (UI.$('#log-toolbar')) UI.$('#log-toolbar').innerHTML = UI.renderLogToolbar(logFilter);
    if (typeof UI.resetLogPatch === 'function') UI.resetLogPatch();
    if (UI.$('#log')) UI.$('#log').innerHTML = UI.renderLog(state, logFilter);
    syncBattleControlsFromState();
    return;
  }
  if (t === 'pokemon') {
    if (UI.$('#team-grid')) UI.$('#team-grid').innerHTML = UI.renderTeam(state);
    if (UI.$('#box-grid')) UI.$('#box-grid').innerHTML = UI.renderBox(state);
    return;
  }
  if (t === 'zones' && UI.$('#zones-list')) UI.$('#zones-list').innerHTML = UI.renderZones(state);
  if (t === 'shop' && UI.$('#shop-list')) UI.$('#shop-list').innerHTML = UI.renderShop(state);
  if (t === 'pass' && UI.$('#pass-view')) UI.$('#pass-view').innerHTML = Shell.renderPassPanel(state);
  if (t === 'quests' && UI.$('#quests-view')) UI.$('#quests-view').innerHTML = Shell.renderQuestsPanel(state);
  if (t === 'profile' && UI.$('#profile-view')) UI.$('#profile-view').innerHTML = Shell.renderProfile(state);
  if (t === 'bonus' && UI.$('#bonus-view')) UI.$('#bonus-view').innerHTML = Shell.renderBonus(state);
  if (t === 'summon' && UI.$('#summon-view')) UI.$('#summon-view').innerHTML = Shell.renderSummonPanel(state);
  if (t === 'expeditions' && UI.$('#expeditions-view') && Shell.renderExpeditionsPanel) {
    UI.$('#expeditions-view').innerHTML = Shell.renderExpeditionsPanel(state);
  }
  if (t === 'pension' && UI.$('#pension-view') && Shell.renderDojoPanel) {
    UI.$('#pension-view').innerHTML = Shell.renderDojoPanel(state);
  }
  if (t === 'ascension' && UI.$('#ascension-view')) {
    UI.$('#ascension-view').innerHTML = renderAscensionPanel(state);
  }
  if (t === 'arenas') {
    const arenasRoot = UI.$('#arenas-view');
    if (arenasRoot) renderArenasPanel(arenasRoot, state, { onChallenge: handleGymChallenge });
  }
  if (t === 'dex' && UI.$('#dex-view')) {
    UI.$('#dex-view').innerHTML = UI.renderBingoBook(state, { gen: dexGen, query: dexQuery });
  }
  if (t === 'leaderboard' && UI.$('#leaderboard-view')) {
    UI.$('#leaderboard-view').innerHTML = renderLeaderboardPanel(state);
  }

  const mgView = UI.$('#minigame-view');
  if (mgView) {
    ensureMinigame(state);
    if (t === 'minigame') {
      if (mgView.dataset.live !== '1') {
        mgView.innerHTML = renderMinigamePanel(state);
        bindMinigameHandlers(mgView, state, (res) => {
          if (res?.ok) {
            saveGame(state);
            pushLeaderboard(state);
            UI.toast(
              `Score ${res.score} · +${res.money}両${res.balls ? ` · +${res.balls} sceau` : ''}${res.xp ? ` · +${res.xp} XP` : ''}`,
            );
            UI.updateHud(state);
          }
        });
        mgView.dataset.live = '1';
      }
    } else {
      mgView.dataset.live = '';
    }
  }
}

function refreshAll({ chrome = true } = {}) {
  if (!state) return;
  syncQuestProgress(state);
  if (chrome) refreshChrome();
  UI.updateHud(state);
  refreshActivePanel();
}

function startLoop() {
  clearInterval(tickTimer);
  const ms = TICK_BASE_MS / (state.battleSpeed || 1);
  tickTimer = setInterval(gameTick, ms);
}

function gameTick() {
  if (!state || !battle) return;
  state.stats.playTime += TICK_BASE_MS / 1000 / (state.battleSpeed || 1);

  if (battle.over) {
    if (!victoryHoldUntil) {
      victoryHoldUntil = Date.now() + 520;
      refreshBattleLive({ syncQuests: true });
      return;
    }
    if (Date.now() < victoryHoldUntil) return;
    victoryHoldUntil = 0;
    battle = createBattle(state);
    refreshBattleLive({ syncQuests: true });
    return;
  }

  if (state.autoCatch && battle.wild.hp > 0) {
    const hpPct = battle.wild.hp / battle.wild.maxHp;
    // Auto-sceau seulement très bas PV — moins de farming gratuit
    if (hpPct <= 0.25) {
      let ballId = state.autoCatchBall || 'pokeball';
      // Sceau Kage : jamais en auto (combat continue normalement)
      if (ballId === 'masterball') ballId = 'pokeball';
      if ((state.balls[ballId] || 0) > 0) {
        const res = attemptCatch(state, battle, ballId);
        if (res.ok && res.success) {
          Audio.play('catch');
          UI.toast(`Auto-sceau : ${pokeName(res.pokemon)}`);
          victoryHoldUntil = Date.now() + 480;
          refreshBattleLive({ syncQuests: true });
          return;
        }
      }
    }
  }

  const events = battleTick(state, battle);
  if (events.length) {
    Audio.playFromEvents(events);
    const major = events.some((ev) =>
      ['win', 'lose', 'catch', 'levelup', 'faint'].includes(ev.type),
    );
    refreshBattleLive({ syncQuests: major });
    if (typeof UI.applyBattleFx === 'function') UI.applyBattleFx(events);
  }
}

boot().catch((err) => {
  console.error(err);
  document.getElementById('app').innerHTML = `<div class="loading">Erreur : ${err.message}</div>`;
});
