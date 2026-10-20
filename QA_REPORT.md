# QA Report — PokéIdle

**Date:** 2026-10-20  
**Agent:** QA / monitor  
**Verdict:** **PASS**

The game boots, loads 1025 species, runs 1v1 idle combat, and serves cleanly over HTTP. Node smoke tests are green; headless Chrome `?demo=1` shows a live battle UI with **no `Erreur`** and **no blank app**.

---

## A. Data readiness

| Check | Result |
|-------|--------|
| `/workspace/js/data/pokemon-all.json` exists | PASS |
| Entry count | **1025** |
| Spot IDs 1 / 151 / 252 / 650 / 906 / 1025 | bulbasaur, mew, treecko, chespin, sprigatito, pecharunt |
| Evolution edges | 444 |
| `generations.json` gens 1–9 | PASS |

Polled until the file was stable at 1025 entries (fetch agent completed).

---

## B. Node ESM smoke (`node scripts/smoke.mjs`)

| Case | Result |
|------|--------|
| `loadSpecies` (fetch mock → `pokemon-all.json`, fallback gen1) | **1025** PASS |
| `artUrl` for 1, 151, 252, 650, 906, 1025 | PASS (official-artwork URLs) |
| `createNewGame` Gen1 (1) + Gen9 (906) | PASS |
| `battleTick` ×120 without throw | PASS |
| Evolve Bulbizarre → Herbizarre | PASS |
| Dex max = `allSpecies().length` (1025) | PASS |

**Extra QA checks (ad-hoc):**

- Zone species refs vs dex: **0 missing**
- Zones: **125**, starters gens **1–9**
- Gen9 evolve 906 → 907 (Matourgeon): PASS
- Gen9 starter in late zone, 200 ticks: **0 errors**
- `node --check` on main JS modules: PASS

---

## C. HTTP (`python3 -m http.server 4173`)

Server was already listening on `0.0.0.0:4173`.

| URL | Status |
|-----|--------|
| `/index.html` | **200** |
| `/js/main.js` | **200** |
| `/js/data/pokemon-all.json` | **200** |
| `/css/style.css` | **200** |

---

## D. Headless Chrome (`?demo=1`)

Command pattern:

`google-chrome --headless=new --no-sandbox --user-data-dir=/tmp/qa-chrome …`

| Check | Result |
|-------|--------|
| Screenshot | `/opt/cursor/artifacts/qa/demo.png` — battle UI visible |
| DOM dump | `/opt/cursor/artifacts/qa/demo-dom.html` — `game-shell` + `battle-arena` |
| `Erreur` in DOM | **none** |
| Blank `#app` | **no** — combat running (Salamèche vs Rattata) |
| HUD dex | **`1/1025`** |

Note: Chrome sometimes stays alive after screenshot/dump-dom (dbus noise); process was killed after artifacts were written. Non-blocking for gameplay.

---

## E. Bugs found & fixed

| Bug | Severity | Status |
|-----|----------|--------|
| `loadSpecies` only fetched `pokemon-gen1.json` | High | **Fixed** (prefer `pokemon-all.json`, fallback gen1) |
| Hardcoded Pokédex `/151` in UI/HUD | High | **Fixed** (`speciesCount()` / `allSpecies()`) |
| Empty JSON array would be accepted as success | Low | **Fixed** (reject empty list, try next source) |
| Gen1-only zones / starters (parallel agents) | High | **Fixed by other agents** (125 zones, starters 1–9) |
| 1v1 combat / UI redesign incomplete at start of QA | Med | **Fixed by other agents**; re-verified |

---

## F. Remaining risks (non-blocking)

1. **CDN sprites** — artwork/sprites from `raw.githubusercontent.com` (PokéAPI); offline / blocked CDN → broken images, game logic still runs.
2. **Zone coverage** — ~359 unique wild IDs across 125 zones (not every of 1025 appears in the wild).
3. **No regional forms / Megas** as separate dex entries (national species only) — by design per data notes.
4. **Headless Chrome hang** after dump-dom in this environment — use timeout/kill; does not affect the browser game.
5. **Save key** moved to `pokeidle_fan_save_v2` with legacy v1 migration — worth a manual continue-save spot-check in a real browser.

---

## G. How to re-verify

```bash
python3 -m http.server 4173 --bind 0.0.0.0   # if not already up
node scripts/smoke.mjs
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4173/js/data/pokemon-all.json
# browser: http://127.0.0.1:4173/?demo=1
```
