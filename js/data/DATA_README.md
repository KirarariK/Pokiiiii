# Pokemon data

Source: [PokéAPI](https://pokeapi.co/). Generated for PokéIdle.

## Totals

- **Species:** 1025
- **API species count:** 1025
- **Evolution links:** 444

## Counts per generation

| Gen | Name | Region | Count | ID range |
| --- | ---- | ------ | ----- | -------- |
| 1 | Kanto | Kanto | 151 | 1–151 |
| 2 | Johto | Johto | 100 | 152–251 |
| 3 | Hoenn | Hoenn | 135 | 252–386 |
| 4 | Sinnoh | Sinnoh | 107 | 387–493 |
| 5 | Unova | Unova | 156 | 494–649 |
| 6 | Kalos | Kalos | 72 | 650–721 |
| 7 | Alola | Alola | 88 | 722–809 |
| 8 | Galar | Galar | 96 | 810–905 |
| 9 | Paldea | Paldea | 120 | 906–1025 |

## Files

- `pokemon-all.json` — all national-dex species (array, national dex order)
- `generations.json` — gens 1–9 metadata and id ranges
- `pokemon-gen1.json` — legacy Gen 1-only file (kept for compatibility)

## Schema (per species)

`id`, `name`, `nameFr`, `types[]`, `hp`, `atk`, `def`, `spa`, `spd`, `spe`, `baseExp`, `captureRate`, `generation` (1–9), optional `evolvesTo: { to, level, trigger, item }`.

Evolution notes: only edges where both ends are in the national dex. Trade evolutions use level ≈ 36; stone/item evolutions use level ≈ 30 when no `min_level` is set. Branching evolutions keep the first valid target (same convention as gen1 Eevee → Vaporeon).
