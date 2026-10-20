/**
 * Node ESM smoke tests for Nindō (no browser).
 * Polyfills: fetch (JSON from disk), localStorage, minimal location.
 */
import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const fileCache = new Map();

async function readJson(rel) {
  const abs = path.join(ROOT, rel);
  if (!fileCache.has(abs)) {
    const raw = await readFile(abs, 'utf8');
    fileCache.set(abs, JSON.parse(raw));
  }
  return fileCache.get(abs);
}

globalThis.fetch = async (url) => {
  const u = String(url).replace(/^\.\//, '');
  const rel = u.startsWith('js/') ? u : path.posix.normalize(u);
  try {
    const data = await readJson(rel);
    return { ok: true, status: 200, json: async () => data };
  } catch (err) {
    return {
      ok: false,
      status: 404,
      json: async () => {
        throw err;
      },
    };
  }
};

globalThis.localStorage = {
  _d: new Map(),
  getItem(k) {
    return this._d.has(k) ? this._d.get(k) : null;
  },
  setItem(k, v) {
    this._d.set(k, String(v));
  },
  removeItem(k) {
    this._d.delete(k);
  },
  clear() {
    this._d.clear();
  },
};

if (typeof globalThis.location === 'undefined') {
  globalThis.location = { search: '', href: 'http://localhost/', pathname: '/' };
}

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERT: ' + msg);
}

function isHtml(s) {
  return typeof s === 'string' && s.includes('<') && s.length > 20;
}

const results = [];

function pass(name) {
  results.push({ name, ok: true });
  console.log('PASS', name);
}

function fail(name, err) {
  results.push({ name, ok: false, err: String(err?.stack || err) });
  console.error('FAIL', name, err);
}

async function checkSyntaxAll() {
  const jsDir = path.join(ROOT, 'js');
  const dataDir = path.join(ROOT, 'js/data');
  const files = [
    ...(await readdir(jsDir)).filter((f) => f.endsWith('.js')).map((f) => path.join('js', f)),
    ...(await readdir(dataDir)).filter((f) => f.endsWith('.js')).map((f) => path.join('js/data', f)),
  ];
  for (const rel of files) {
    execFileSync(process.execPath, ['--check', path.join(ROOT, rel)], { stdio: 'pipe' });
  }
  return files.length;
}

async function main() {
  // 1) Syntax check
  try {
    const n = await checkSyntaxAll();
    pass(`node --check (${n} files in js/ + js/data/)`);
  } catch (e) {
    fail('node --check', e);
  }

  const pokemon = await import(pathToFileURL(path.join(ROOT, 'js/pokemon.js')).href);
  const game = await import(pathToFileURL(path.join(ROOT, 'js/game.js')).href);
  const zones = await import(pathToFileURL(path.join(ROOT, 'js/data/zones.js')).href);
  const summon = await import(pathToFileURL(path.join(ROOT, 'js/summon.js')).href);
  const arena = await import(pathToFileURL(path.join(ROOT, 'js/arena.js')).href);
  const expedition = await import(pathToFileURL(path.join(ROOT, 'js/expedition.js')).href);
  const daycare = await import(pathToFileURL(path.join(ROOT, 'js/daycare.js')).href);
  const minigame = await import(pathToFileURL(path.join(ROOT, 'js/minigame.js')).href);
  const leaderboard = await import(pathToFileURL(path.join(ROOT, 'js/leaderboard.js')).href);
  const shell = await import(pathToFileURL(path.join(ROOT, 'js/shell-ui.js')).href);
  const ascension = await import(pathToFileURL(path.join(ROOT, 'js/ascension.js')).href);

  // Species bootstrap (required by createPokemon)
  try {
    const species = await pokemon.loadSpecies();
    assert(Array.isArray(species) && species.length >= 500, `species count ${species.length}`);
    pass(`loadSpecies (${species.length})`);
  } catch (e) {
    fail('loadSpecies', e);
    printSummary();
    process.exit(1);
  }

  const STARTER_ID = 14; // Naruto Uzumaki — Enfant (saga I)

  // 2) createNewGame + loadGame with localStorage
  let state;
  try {
    localStorage.clear();
    state = game.createNewGame(STARTER_ID);
    assert(state.team?.[0]?.speciesId === STARTER_ID, 'starter');
    game.saveGame(state);
    const loaded = game.loadGame();
    assert(loaded, 'loadGame returns state');
    assert(loaded.team?.[0]?.speciesId === STARTER_ID, 'loaded starter');
    assert(loaded.version === 3, 'version 3');
    state = loaded;
    pass('createNewGame / saveGame / loadGame');
  } catch (e) {
    fail('createNewGame/loadGame', e);
    state = game.createNewGame(STARTER_ID);
  }

  // 3) ensure* helpers
  try {
    const s1 = summon.ensureSummon(state);
    const s2 = arena.ensureArena(state);
    const s3 = expedition.ensureExpeditions(state);
    const s4 = daycare.ensureDaycare(state);
    const s5 = minigame.ensureMinigame(state);
    assert(s1 && typeof s1.tickets === 'number', 'ensureSummon');
    assert(s2 && typeof state.badges === 'object', 'ensureArena');
    assert(Array.isArray(s3), 'ensureExpeditions');
    assert(Array.isArray(s4), 'ensureDaycare');
    assert(s5 && typeof s5.playsToday === 'number', 'ensureMinigame');
    pass('ensureSummon/Arena/Expeditions/Daycare/Minigame');
  } catch (e) {
    fail('ensure*', e);
  }

  // 4) challengeGym on first gym with leveled team
  try {
    const gymState = game.createNewGame(STARTER_ID);
    for (const p of gymState.team) {
      p.xp = pokemon.xpForLevel(25);
      pokemon.refreshStats(p);
      p.hp = p.maxHp;
    }
    // Pad team so gym fights are survivable (still may lose — must not throw)
    while (gymState.team.length < 3) {
      const extra = pokemon.createPokemon(29, 25); // Sasuke enfant
      gymState.team.push(extra);
      gymState.caught[extra.speciesId] = true;
      gymState.seen[extra.speciesId] = true;
    }
    const first = arena.GYMS[0];
    const res = arena.challengeGym(gymState, first.id);
    assert(res && typeof res.ok === 'boolean', 'challengeGym returns result');
    pass(`challengeGym ${first.id} (ok=${res.ok}, win=${res.win ?? 'n/a'})`);
  } catch (e) {
    fail('challengeGym', e);
  }

  // 5) startExpedition + claim (time skip)
  try {
    const exState = game.createNewGame(STARTER_ID);
    // Keep a lead on team; send a box mon so last-team rule passes
    const scout = pokemon.createPokemon(23, 8); // Sakura enfant
    exState.box.push(scout);
    exState.caught[23] = true;
    exState.seen[23] = true;
    const dur = expedition.EXPEDITION_DURATIONS[0].ms;
    const zoneId = exState.currentZone;
    const started = expedition.startExpedition(exState, {
      pokemonUids: [scout.uid],
      durationMs: dur,
      zoneId,
    });
    assert(started.ok, `startExpedition: ${started.reason || 'ok'}`);
    const exp = started.expedition;
    exp.startedAt = Date.now() - dur - 1000;
    assert(expedition.isExpeditionReady(exp), 'expedition ready after time skip');
    const claimed = expedition.claimExpedition(exState, exp.id);
    assert(claimed.ok, `claimExpedition: ${claimed.reason || 'ok'}`);
    pass('startExpedition + claimExpedition');
  } catch (e) {
    fail('expedition start/claim', e);
  }

  // 6) pullOnce with tickets
  try {
    const pullState = game.createNewGame(STARTER_ID);
    summon.ensureSummon(pullState);
    if (pullState.summon.tickets < 1) pullState.summon.tickets = 1;
    const before = pullState.team.length + pullState.box.length;
    const res = summon.pullOnce(pullState);
    assert(res.ok && res.pokemon, `pullOnce: ${res.reason || 'ok'}`);
    assert(pullState.team.length + pullState.box.length === before + 1, 'pokemon placed');
    pass(`pullOnce (${res.rarity})`);
  } catch (e) {
    fail('pullOnce', e);
  }

  // 7) resolveMinigame
  try {
    const mgState = game.createNewGame(STARTER_ID);
    minigame.ensureMinigame(mgState);
    const res = minigame.resolveMinigame(mgState, 72);
    assert(res.ok, `resolveMinigame: ${res.reason || 'ok'}`);
    assert(res.score === 72, 'score');
    assert(mgState.minigame.playsToday === 1, 'playsToday');
    pass('resolveMinigame');
  } catch (e) {
    fail('resolveMinigame', e);
  }

  // 8) pushLeaderboard
  try {
    const lbState = game.createNewGame(STARTER_ID);
    lbState.playerName = 'SmokeTest';
    lbState.stats.catches = 3;
    const list = leaderboard.pushLeaderboard(lbState);
    assert(Array.isArray(list) && list.length >= 1, 'leaderboard list');
    assert(list.some((e) => e.name === 'SmokeTest'), 'entry present');
    pass('pushLeaderboard');
  } catch (e) {
    fail('pushLeaderboard', e);
  }

  // 9) resolveZoneBgClass
  try {
    const z0 = zones.ZONES[0];
    const cls = zones.resolveZoneBgClass(z0);
    assert(typeof cls === 'string' && cls.startsWith('bg-zone-'), `got ${cls}`);
    assert(zones.resolveZoneBgClass(null) === 'bg-zone-route', 'null fallback');
    const samples = zones.ZONES.slice(0, 20).map((z) => zones.resolveZoneBgClass(z));
    assert(samples.every((c) => c.startsWith('bg-zone-')), 'sample zones');
    pass(`resolveZoneBgClass (${cls})`);
  } catch (e) {
    fail('resolveZoneBgClass', e);
  }

  // 10) Hub panel render functions → HTML strings
  try {
    const renderState = game.createNewGame(STARTER_ID);
    summon.ensureSummon(renderState);
    arena.ensureArena(renderState);
    expedition.ensureExpeditions(renderState);
    daycare.ensureDaycare(renderState);
    minigame.ensureMinigame(renderState);

    const panels = [
      ['renderHub', () => shell.renderHub(renderState)],
      ['renderExpeditionsPanel', () => shell.renderExpeditionsPanel(renderState)],
      ['renderPensionPanel', () => shell.renderPensionPanel(renderState)],
      ['renderQuestsPanel', () => shell.renderQuestsPanel(renderState)],
      ['renderPassPanel', () => shell.renderPassPanel(renderState)],
      ['renderProfile', () => shell.renderProfile(renderState)],
      ['renderBonus', () => shell.renderBonus(renderState)],
      ['renderSummonPanel', () => shell.renderSummonPanel(renderState)],
      ['renderMinigamePanel', () => minigame.renderMinigamePanel(renderState)],
      ['renderLeaderboardPanel', () => leaderboard.renderLeaderboardPanel(renderState)],
      ['renderArenaPanelHtml', () => arena.renderArenaPanelHtml(renderState)],
      ['renderAscensionPanel', () => ascension.renderAscensionPanel(renderState)],
    ];
    const names = [];
    for (const [name, fn] of panels) {
      const html = fn();
      assert(isHtml(html), `${name} not HTML`);
      names.push(name);
    }
    pass(`hub panels HTML (${names.length}: ${names.join(', ')})`);
  } catch (e) {
    fail('hub panel renders', e);
  }

  // Legacy regression checks (kept cheap)
  try {
    // Nouvelle partie force saga I même si on passe un id Boruto (saga IV)
    const g9 = game.createNewGame(1);
    assert(g9.team[0].speciesId === 14, 'new game forces saga I starter');
    assert(Array.isArray(g9.unlockedGens) && g9.unlockedGens.length === 1 && g9.unlockedGens[0] === 1, 'only saga I unlocked');
    assert(game.currentPlayGen(g9) === 1, 'play gen 1');
    const unlocked = game.unlockGen(g9, 2);
    assert(unlocked.ok, 'unlock saga II');
    assert(g9.unlockedGens.includes(2), 'saga II in list');
    assert([15, 31, 24].includes(unlocked.pokemon?.speciesId), 'saga II starter gift');
    pass('gen lock: new game saga I + unlockGen(2)');
  } catch (e) {
    fail('gen lock', e);
  }

  try {
    const battleState = game.createNewGame(STARTER_ID);
    let battle = game.createBattle(battleState);
    let ticks = 0;
    for (let i = 0; i < 120; i++) {
      if (battle.over) battle = game.createBattle(battleState);
      game.battleTick(battleState, battle);
      ticks++;
    }
    pass(`battleTick ×${ticks}`);
  } catch (e) {
    fail('battleTick×100', e);
  }

  printSummary();
  const failed = results.filter((r) => !r.ok);
  process.exit(failed.length ? 1 : 0);
}

function printSummary() {
  const failed = results.filter((r) => !r.ok);
  console.log('\n--- smoke summary ---');
  console.log(`${results.length - failed.length}/${results.length} passed`);
  for (const r of results) {
    console.log(`${r.ok ? '✓' : '✗'} ${r.name}`);
  }
  if (failed.length) {
    for (const f of failed) console.log(' •', f.name, '\n', f.err);
  }
}

main().catch((err) => {
  console.error('Smoke runner crashed:', err);
  process.exit(1);
});
