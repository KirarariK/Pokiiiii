import { loadSpecies, pokeName, artUrl, displayName, getSpecies, speciesCount } from './pokemon.js';
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

let state = null;
let battle = null;
let tickTimer = null;
let saveTimer = null;
let tab = 'battle';
let starterGen = 1;
let dexGen = 0;
let dexQuery = '';
let hubOpen = false;

const TICK_BASE_MS = 750;

async function boot() {
  UI.$('#app').innerHTML = `<div class="loading"><div class="loading-orb"></div><span>Chargement ${BRAND.name}…</span></div>`;
  await loadSpecies();

  const params = new URLSearchParams(location.search);
  const demo = params.get('demo');
  if (demo === '1' || demo === 'hub' || demo === 'pass' || demo === 'quests') {
    startNew(4);
    if (demo === 'hub') setTimeout(() => openHub(), 50);
    if (demo === 'pass') setTimeout(() => setTab('pass'), 50);
    if (demo === 'quests') setTimeout(() => setTab('quests'), 50);
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
  saveGame(state);
  enterGame();
}

function startExisting(s) {
  state = s;
  initDailyBaselines(state);
  const offline = applyOfflineProgress(state);
  enterGame();
  if (offline) {
    UI.toast(`Hors-ligne : ${offline.battles} combats · +${offline.xpGain} XP · +${offline.moneyGain}₽`);
  }
}

function enterGame() {
  renderShell();
  battle = createBattle(state);
  bindShell();
  setTab('battle');
  startLoop();
  saveTimer = setInterval(() => saveGame(state), 8000);
}

function renderShell() {
  UI.$('#app').innerHTML = `
    <div class="game-shell pi-shell">
      ${Shell.renderTopbar(state)}
      <main class="content pi-content">
        <section id="panel-battle" class="panel">
          <div id="battle-view"></div>
          <div class="battle-controls">
            <div id="catch-btns" class="catch-row"></div>
            <div class="control-row">
              <label class="chk"><input type="checkbox" id="auto-catch" /> Auto-capture</label>
              <select id="auto-ball">
                ${Object.values(BALLS)
                  .map((b) => `<option value="${b.id}">${b.name}</option>`)
                  .join('')}
              </select>
              <label class="speed">Vitesse
                <select id="battle-speed">
                  <option value="0.75">0.75×</option>
                  <option value="1" selected>1×</option>
                  <option value="1.5">1.5×</option>
                  <option value="2">2×</option>
                  <option value="3">3×</option>
                  <option value="5">5×</option>
                </select>
              </label>
              <button id="btn-heal" class="btn-secondary" type="button">Centre Pokémon</button>
            </div>
          </div>
          <div class="log-panel">
            <h3>Journal</h3>
            <div id="log"></div>
          </div>
        </section>

        <section id="panel-pokemon" class="panel">
          <div class="panel-head">
            <h2>Pokémon</h2>
            <button id="btn-evolve-all" class="btn-secondary" type="button">Tout évoluer</button>
          </div>
          <h3 class="subhead">Équipe <small class="muted">(lead = combat 1v1)</small></h3>
          <div id="team-grid" class="card-grid"></div>
          <h3 class="subhead">Boîte PC</h3>
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
          <div class="panel-head"><h2>Pokédex National</h2></div>
          <div id="dex-view"></div>
        </section>

        <section id="panel-profile" class="panel">
          <div id="profile-view"></div>
        </section>

        <section id="panel-bonus" class="panel">
          <div id="bonus-view"></div>
        </section>

        <section id="panel-settings" class="panel">
          <div class="panel-head"><h2>Options</h2></div>
          <div class="settings">
            <p>Sauvegarde auto · ${speciesCount()} espèces Gen I–IX · ${BRAND.name}</p>
            <label class="field">Nom du dresseur
              <input id="player-name" type="text" maxlength="16" value="${state.playerName || 'Dresseur'}" />
            </label>
            <button id="btn-save" class="btn-primary" type="button">Sauvegarder</button>
            <button id="btn-reset" class="btn-danger" type="button">Réinitialiser la partie</button>
            <p class="muted disclaimer">Fan-game non officiel. Sprites © Pokémon / Nintendo / Creatures / Game Freak — via PokéAPI.</p>
          </div>
        </section>
      </main>
      <div id="bottom-nav-host">${Shell.renderBottomNav(tab, state)}</div>
      ${Shell.renderHub(state)}
    </div>
    <div id="toasts"></div>
    <div id="modal-overlay" hidden><div class="modal" id="modal-body"></div></div>
  `;
}

function bindShell() {
  UI.$('#auto-catch').checked = !!state.autoCatch;
  UI.$('#auto-catch').addEventListener('change', (e) => {
    state.autoCatch = e.target.checked;
  });
  UI.$('#auto-ball').value = state.autoCatchBall || 'pokeball';
  UI.$('#auto-ball').addEventListener('change', (e) => {
    state.autoCatchBall = e.target.value;
  });
  UI.$('#battle-speed').value = String(state.battleSpeed || 1);
  UI.$('#battle-speed').addEventListener('change', (e) => {
    state.battleSpeed = Number(e.target.value);
    startLoop();
  });

  UI.$('#btn-heal')?.addEventListener('click', () => {
    healTeam(state);
    refreshAll();
    UI.toast('Équipe soignée');
  });

  UI.$('#btn-evolve-all')?.addEventListener('click', () => {
    const n = autoEvolveAll(state);
    UI.toast(n ? `${n} évolution(s)` : 'Aucune évolution disponible');
    refreshAll();
  });

  UI.$('#btn-save')?.addEventListener('click', () => {
    const name = UI.$('#player-name')?.value?.trim();
    if (name) state.playerName = name.slice(0, 16);
    saveGame(state);
    UI.toast('Partie sauvegardée');
    refreshChrome();
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

function openHub() {
  hubOpen = true;
  const hub = UI.$('#hub-overlay');
  if (hub) {
    // re-render hub content for badges
    hub.outerHTML = Shell.renderHub(state);
    UI.$('#hub-overlay').hidden = false;
  }
  UI.$('#bottom-nav-host').innerHTML = Shell.renderBottomNav('hub', state);
}

function closeHub() {
  hubOpen = false;
  const hub = UI.$('#hub-overlay');
  if (hub) hub.hidden = true;
  UI.$('#bottom-nav-host').innerHTML = Shell.renderBottomNav(tab, state);
}

function refreshChrome() {
  const top = UI.$('.pi-topbar');
  if (top) {
    const tmp = document.createElement('div');
    tmp.innerHTML = Shell.renderTopbar(state);
    top.replaceWith(tmp.firstElementChild);
  }
  if (!hubOpen) {
    UI.$('#bottom-nav-host').innerHTML = Shell.renderBottomNav(tab, state);
  }
}

function onInput(e) {
  if (e.target.id === 'dex-search') {
    dexQuery = e.target.value;
    UI.$('#dex-view').innerHTML = UI.renderPokedex(state, { gen: dexGen, query: dexQuery });
  }
}

function onClick(e) {
  const nav = e.target.closest('[data-nav]');
  if (nav) {
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
    closeHub();
    return;
  }

  const hubTile = e.target.closest('[data-hub]');
  if (hubTile) {
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
    UI.$('#dex-view').innerHTML = UI.renderPokedex(state, { gen: dexGen, query: dexQuery });
    return;
  }

  const catchBtn = e.target.closest('[data-catch]');
  if (catchBtn) {
    const res = attemptCatch(state, battle, catchBtn.dataset.catch);
    if (!res.ok) UI.toast(res.reason === 'no-ball' ? 'Plus de Balls' : 'Capture impossible');
    else if (res.success) {
      UI.toast(`Capturé ${pokeName(res.pokemon)}`);
      showCatchModal(res.pokemon);
      battle = createBattle(state);
    } else UI.toast(`${res.ball.name} a échoué`);
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
      setZone(state, id);
      battle = createBattle(state);
      UI.toast('Nouvelle zone');
    } else {
      const ok = unlockZone(state, id);
      UI.toast(ok ? 'Zone débloquée' : 'Fonds insuffisants');
      if (ok) {
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
      if (neu) UI.toast(`Évolution en ${neu.nameFr}`);
    } else if (a === 'box') moveToBox(state, uid);
    else if (a === 'team') {
      if (!moveToTeam(state, uid)) UI.toast('Équipe pleine (6 max)');
    } else if (a === 'up') swapTeam(state, Number(i), Number(i) - 1);
    refreshAll();
  }
}

function showCatchModal(poke) {
  const sp = getSpecies(poke.speciesId);
  UI.showModal(`
    <div class="catch-modal">
      <h2>${displayName(sp)} capturé</h2>
      <img src="${artUrl(poke.speciesId)}" alt="" />
      <p><strong>N.${poke.level}</strong> · Gen ${sp.generation}${poke.shiny ? ' · Chromatique' : ''}</p>
      <button class="btn-primary" id="close-modal" type="button">Continuer</button>
    </div>
  `);
  UI.$('#close-modal').onclick = () => UI.hideModal();
}

function refreshAll() {
  if (!state) return;
  syncQuestProgress(state);
  UI.updateHud(state);
  refreshChrome();

  if (UI.$('#battle-view')) UI.$('#battle-view').innerHTML = UI.renderBattle(state, battle);
  if (UI.$('#catch-btns')) UI.$('#catch-btns').innerHTML = UI.renderCatchButtons(state, battle);
  if (UI.$('#log')) UI.$('#log').innerHTML = UI.renderLog(state);
  if (UI.$('#team-grid')) UI.$('#team-grid').innerHTML = UI.renderTeam(state);
  if (UI.$('#box-grid')) UI.$('#box-grid').innerHTML = UI.renderBox(state);
  if (UI.$('#zones-list')) UI.$('#zones-list').innerHTML = UI.renderZones(state);
  if (UI.$('#shop-list')) UI.$('#shop-list').innerHTML = UI.renderShop(state);
  if (UI.$('#pass-view')) UI.$('#pass-view').innerHTML = Shell.renderPassPanel(state);
  if (UI.$('#quests-view')) UI.$('#quests-view').innerHTML = Shell.renderQuestsPanel(state);
  if (UI.$('#profile-view')) UI.$('#profile-view').innerHTML = Shell.renderProfile(state);
  if (UI.$('#bonus-view')) UI.$('#bonus-view').innerHTML = Shell.renderBonus(state);
  if (tab === 'dex' && UI.$('#dex-view')) {
    UI.$('#dex-view').innerHTML = UI.renderPokedex(state, { gen: dexGen, query: dexQuery });
  }
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
    battle = createBattle(state);
    refreshAll();
    return;
  }

  if (state.autoCatch && battle.wild.hp > 0) {
    const hpPct = battle.wild.hp / battle.wild.maxHp;
    if (hpPct <= 0.4) {
      const ballId = state.autoCatchBall || 'pokeball';
      if ((state.balls[ballId] || 0) > 0) {
        const res = attemptCatch(state, battle, ballId);
        if (res.ok && res.success) {
          UI.toast(`Auto-capture : ${pokeName(res.pokemon)}`);
          battle = createBattle(state);
          refreshAll();
          return;
        }
      }
    }
  }

  const events = battleTick(state, battle);
  if (events.length) {
    refreshAll();
    if (typeof UI.applyBattleFx === 'function') UI.applyBattleFx(events);
  }
}

boot().catch((err) => {
  console.error(err);
  document.getElementById('app').innerHTML = `<div class="loading">Erreur : ${err.message}</div>`;
});
