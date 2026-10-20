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
} from './game.js';
import * as UI from './ui.js';

let state = null;
let battle = null;
let tickTimer = null;
let saveTimer = null;
let tab = 'battle';
let starterGen = 1;
let dexGen = 0;
let dexQuery = '';

const TICK_BASE_MS = 750;

async function boot() {
  UI.$('#app').innerHTML = `<div class="loading">Chargement des ${'Pokémon'} (toutes générations)…</div>`;
  await loadSpecies();
  UI.$('#app').innerHTML = `<div class="loading">${speciesCount()} Pokémon chargés…</div>`;

  const params = new URLSearchParams(location.search);
  if (params.get('demo') === '1') {
    startNew(4);
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
  const offline = applyOfflineProgress(state);
  enterGame();
  if (offline) {
    UI.toast(
      `Hors-ligne : ${offline.battles} combats · +${offline.xpGain} XP · +${offline.moneyGain}₽`
    );
  }
}

function enterGame() {
  renderShell();
  battle = createBattle(state);
  bindShell();
  refreshAll();
  startLoop();
  saveTimer = setInterval(() => saveGame(state), 8000);
}

function renderShell() {
  UI.$('#app').innerHTML = `
    <div class="game-shell">
      <header class="topbar">
        <div class="brand">
          <span class="logo">⚡</span>
          <div>
            <strong>PokéIdle</strong>
            <small>Fan idle · ${speciesCount()} Pokémon · 1v1</small>
          </div>
        </div>
        <div class="hud">
          <div class="hud-item"><span id="money">0 ₽</span></div>
          <div class="hud-item">👥 <span id="team-count">0/6</span></div>
          <div class="hud-item">📕 <span id="dex-count">0/0</span></div>
          <div class="hud-item">📍 <span id="zone-name">—</span></div>
        </div>
      </header>

      <nav class="tabs">
        <button data-tab="battle" class="active">Combat 1v1</button>
        <button data-tab="team">Équipe</button>
        <button data-tab="box">PC</button>
        <button data-tab="zones">Zones</button>
        <button data-tab="shop">Boutique</button>
        <button data-tab="dex">Pokédex</button>
        <button data-tab="settings">Options</button>
      </nav>

      <main class="content">
        <section id="panel-battle" class="panel active">
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
              <button id="btn-heal" class="btn-secondary">Centre Pokémon</button>
            </div>
          </div>
          <div class="log-panel">
            <h3>Journal</h3>
            <div id="log"></div>
          </div>
        </section>

        <section id="panel-team" class="panel">
          <div class="panel-head">
            <h2>Équipe <small class="muted">(le 1er est le lead du 1v1)</small></h2>
            <button id="btn-evolve-all" class="btn-secondary">Tout évoluer</button>
          </div>
          <div id="team-grid" class="card-grid"></div>
        </section>

        <section id="panel-box" class="panel">
          <div class="panel-head"><h2>Boîte PC</h2></div>
          <div id="box-grid" class="card-grid"></div>
        </section>

        <section id="panel-zones" class="panel">
          <div class="panel-head"><h2>Zones — toutes les régions</h2></div>
          <div id="zones-list"></div>
        </section>

        <section id="panel-shop" class="panel">
          <div class="panel-head"><h2>Boutique</h2></div>
          <div id="shop-list" class="shop-list"></div>
        </section>

        <section id="panel-dex" class="panel">
          <div class="panel-head"><h2>Pokédex National</h2></div>
          <div id="dex-view"></div>
        </section>

        <section id="panel-settings" class="panel">
          <div class="panel-head"><h2>Options</h2></div>
          <div class="settings">
            <p>Sauvegarde automatique (localStorage). Données : ${speciesCount()} espèces Gen I–IX.</p>
            <button id="btn-save" class="btn-primary">Sauvegarder maintenant</button>
            <button id="btn-reset" class="btn-danger">Réinitialiser la partie</button>
            <p class="muted disclaimer">Fan-game non officiel. Sprites © Pokémon / Nintendo / Creatures / Game Freak — via PokéAPI.</p>
          </div>
        </section>
      </main>
    </div>
    <div id="toasts"></div>
    <div id="modal-overlay" hidden><div class="modal" id="modal-body"></div></div>
  `;
}

function bindShell() {
  UI.$$('.tabs [data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      tab = btn.dataset.tab;
      UI.$$('.tabs [data-tab]').forEach((b) => b.classList.toggle('active', b === btn));
      UI.$$('.panel').forEach((p) => p.classList.toggle('active', p.id === `panel-${tab}`));
      refreshAll();
    });
  });

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

  UI.$('#btn-heal').addEventListener('click', () => {
    healTeam(state);
    refreshAll();
    UI.toast('Équipe soignée !');
  });

  UI.$('#btn-evolve-all')?.addEventListener('click', () => {
    const n = autoEvolveAll(state);
    UI.toast(n ? `${n} évolution(s)` : 'Aucune évolution disponible');
    refreshAll();
  });

  UI.$('#btn-save').addEventListener('click', () => {
    saveGame(state);
    UI.toast('Partie sauvegardée');
  });

  UI.$('#btn-reset').addEventListener('click', () => {
    if (confirm('Supprimer la sauvegarde et recommencer ?')) {
      clearInterval(tickTimer);
      clearInterval(saveTimer);
      clearSave();
      location.href = location.pathname;
    }
  });

  UI.$('#modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') UI.hideModal();
  });

  UI.$('#app').addEventListener('click', onClick);
  UI.$('#app').addEventListener('input', onInput);
}

function onInput(e) {
  if (e.target.id === 'dex-search') {
    dexQuery = e.target.value;
    UI.$('#dex-view').innerHTML = UI.renderPokedex(state, { gen: dexGen, query: dexQuery });
  }
}

function onClick(e) {
  const genChip = e.target.closest('[data-dex-gen]');
  if (genChip) {
    dexGen = Number(genChip.dataset.dexGen);
    UI.$('#dex-view').innerHTML = UI.renderPokedex(state, { gen: dexGen, query: dexQuery });
    return;
  }

  const catchBtn = e.target.closest('[data-catch]');
  if (catchBtn) {
    const res = attemptCatch(state, battle, catchBtn.dataset.catch);
    if (!res.ok) UI.toast(res.reason === 'no-ball' ? 'Plus de Balls !' : 'Capture impossible');
    else if (res.success) {
      UI.toast(`Capturé ${pokeName(res.pokemon)} !`);
      showCatchModal(res.pokemon);
      battle = createBattle(state);
    } else UI.toast(`${res.ball.name} a échoué…`);
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
      UI.toast(ok ? 'Zone débloquée !' : 'Fonds insuffisants');
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
      if (neu) UI.toast(`Évolution en ${neu.nameFr} !`);
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
      <h2>${displayName(sp)} capturé !</h2>
      <img src="${artUrl(poke.speciesId)}" alt="" />
      <p><strong>N.${poke.level}</strong> · Gen ${sp.generation}${poke.shiny ? ' · ✨ Chromatique !' : ''}</p>
      <button class="btn-primary" id="close-modal">Super !</button>
    </div>
  `);
  UI.$('#close-modal').onclick = () => UI.hideModal();
}

function refreshAll() {
  if (!state) return;
  UI.updateHud(state);
  UI.$('#battle-view').innerHTML = UI.renderBattle(state, battle);
  UI.$('#catch-btns').innerHTML = UI.renderCatchButtons(state, battle);
  UI.$('#log').innerHTML = UI.renderLog(state);
  UI.$('#team-grid').innerHTML = UI.renderTeam(state);
  UI.$('#box-grid').innerHTML = UI.renderBox(state);
  UI.$('#zones-list').innerHTML = UI.renderZones(state);
  UI.$('#shop-list').innerHTML = UI.renderShop(state);
  if (tab === 'dex') {
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
    const hit = events.find((e) => e.type === 'attack');
    if (hit) {
      const sel = hit.who === 'player' ? '.enemy-sprite' : '.ally-sprite';
      const el = UI.$(sel);
      if (el) {
        el.classList.add('hit');
        setTimeout(() => el.classList.remove('hit'), 180);
      }
      /* damage numbers animate via .dmg-num CSS */
    }
  }
}

boot().catch((err) => {
  console.error(err);
  document.getElementById('app').innerHTML = `<div class="loading">Erreur : ${err.message}</div>`;
});
