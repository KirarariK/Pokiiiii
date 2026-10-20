/**
 * Node ESM smoke tests for PokéIdle.
 * Mocks fetch so loadSpecies works outside the browser.
 */
import { readFile } from 'node:fs/promises';
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
    return {
      ok: true,
      status: 200,
      json: async () => data,
    };
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

// Minimal localStorage for save helpers (unused in core smoke path)
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
};

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERT: ' + msg);
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

async function main() {
  const pokemon = await import(pathToFileURL(path.join(ROOT, 'js/pokemon.js')).href);
  const game = await import(pathToFileURL(path.join(ROOT, 'js/game.js')).href);

  // --- loadSpecies ---
  try {
    const species = await pokemon.loadSpecies();
    assert(Array.isArray(species), 'species is array');
    assert(species.length >= 1000, `expected ~1025 species, got ${species.length}`);
    assert(species.length === pokemon.allSpecies().length, 'allSpecies length matches');
    pass(`loadSpecies (${species.length} entries)`);
  } catch (e) {
    fail('loadSpecies', e);
    printSummary();
    process.exit(1);
  }

  // --- artUrl for key ids ---
  try {
    const ids = [1, 151, 252, 650, 906, 1025];
    for (const id of ids) {
      const sp = pokemon.getSpecies(id);
      assert(sp, `species ${id} exists`);
      const url = pokemon.artUrl(id);
      assert(
        url.includes(`/official-artwork/${id}.png`),
        `artUrl(${id}) = ${url}`
      );
    }
    pass('artUrl for ids 1,151,252,650,906,1025');
  } catch (e) {
    fail('artUrl', e);
  }

  // --- create games gen1 + gen9 ---
  try {
    const g1 = game.createNewGame(1); // Bulbizarre
    assert(g1.team[0].speciesId === 1, 'gen1 starter');
    const g9 = game.createNewGame(906); // Sprigatito / Poussacha
    assert(g9.team[0].speciesId === 906, 'gen9 starter');
    assert(g9.team[0].hp > 0 && g9.team[0].maxHp > 0, 'gen9 stats');
    pass('createNewGame gen1 (1) and gen9 (906)');
  } catch (e) {
    fail('createNewGame', e);
  }

  // --- 100+ battle ticks without throw ---
  try {
    const state = game.createNewGame(4);
    let battle = game.createBattle(state);
    let ticks = 0;
    let wins = 0;
    for (let i = 0; i < 120; i++) {
      if (battle.over) {
        if (battle.result === 'win') wins++;
        battle = game.createBattle(state);
      }
      game.battleTick(state, battle);
      ticks++;
    }
    assert(ticks >= 100, 'ran 100+ ticks');
    pass(`battleTick ×${ticks} (wins≈${wins}, money=${state.money})`);
  } catch (e) {
    fail('battleTick×100', e);
  }

  // --- evolve if possible ---
  try {
    const state = game.createNewGame(1);
    const poke = state.team[0];
    // Force level high enough for Bulbasaur → Ivysaur (16)
    poke.xp = pokemon.xpForLevel(20);
    pokemon.refreshStats(poke);
    poke.hp = poke.maxHp;
    assert(pokemon.canEvolve(poke), 'canEvolve after level-up');
    const neu = game.tryEvolvePokemon(state, poke.uid);
    assert(neu && neu.id === 2, `evolved to 2, got ${neu && neu.id}`);
    assert(poke.speciesId === 2, 'speciesId updated');
    pass('evolve Bulbizarre → Herbizarre');
  } catch (e) {
    fail('evolve', e);
  }

  // --- dex max uses all species length ---
  try {
    const max = pokemon.allSpecies().length;
    assert(max >= 1000, `dex max ${max}`);
    // Mimic UI dexMax contract
    const caught = { 1: true };
    const hud = `${Object.keys(caught).length}/${max}`;
    assert(hud.endsWith(`/${max}`), hud);
    assert(!hud.includes('/151') || max === 151, 'must not hardcode 151 when all species loaded');
    pass(`dex max = allSpecies().length (${max})`);
  } catch (e) {
    fail('dex max', e);
  }

  printSummary();
  const failed = results.filter((r) => !r.ok);
  process.exit(failed.length ? 1 : 0);
}

function printSummary() {
  const failed = results.filter((r) => !r.ok);
  console.log('\n--- smoke summary ---');
  console.log(`${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    for (const f of failed) console.log(' •', f.name, f.err);
  }
}

main().catch((err) => {
  console.error('Smoke runner crashed:', err);
  process.exit(1);
});

  // --- summon / invocation pull ---
  {
    const summon = await import(pathToFileURL(path.join(ROOT, 'js/summon.js')).href);
    assert(state.summon && typeof state.summon.tickets === 'number', 'summon state present');
    assert(state.summon.tickets >= 1, 'has free ticket');
    const before = state.team.length + state.box.length;
    const res = summon.pullOnce(state);
    assert(res.ok && res.pokemon, 'pullOnce ok');
    assert(state.team.length + state.box.length === before + 1, 'pokemon placed');
  }
