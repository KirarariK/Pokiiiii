# QA Report — PokéIdle full dex

**Date:** 2026-10-20  
**Status:** PASS

## Checks

| Check | Result |
|-------|--------|
| `pokemon-all.json` count | **1025** OK |
| Generations 1–9 present | OK |
| Evolution links | 444 |
| Zones all gens | **125** zones |
| `node scripts/smoke.mjs` | **6/6 passed** |
| HTTP `/` + `/js/data/pokemon-all.json` | 200 |
| Headless screenshots title + battle | OK |
| Battle tick ×200 errors | **0** |

## Smoke details

- loadSpecies 1025
- artUrl ids 1, 151, 252, 650, 906, 1025
- createNewGame Gen1 + Gen9
- battleTick ×120 without throw
- evolve Bulbizarre → Herbizarre
- dex max = 1025

## Remaining risks (non-blocking)

- Sprites depend on GitHub/PokéAPI CDN (offline sans cache navigateur)
- Quelques coûts de zones endgame très élevés (volontaire)
- Pas de formes régionales / méga en entrées séparées (espèces nationales uniquement)
