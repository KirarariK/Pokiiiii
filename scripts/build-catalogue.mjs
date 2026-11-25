#!/usr/bin/env node
// Génère assets/data/catalogue.json : toutes les cartes de la base Pokémon TCG
// (pokemontcg.io), toutes extensions confondues.
//
//   node scripts/build-catalogue.mjs [--cache <dossier>]
//
// Ce fichier n'est pas chargé au démarrage du site : il est lu à la demande
// par la page Cartes et par le tableau du stock de l'espace admin.
//
// Format compact (un tableau par carte) pour rester léger :
//   sets  : [identifiant, nom, série, code, date de sortie]
//   cards : [n° d'extension, numéro, nom imprimé, nature, n° de type, n° de rareté,
//            cote en centimes, n° de Pokédex, identifiant s'il n'est pas « extension-numéro »]
//   nature : 0 Pokémon, 1 Dresseur, 2 Énergie
// Une cote à 0 signifie « inconnue » : la carte ne peut entrer dans un pack
// qu'après qu'une cote lui a été donnée dans l'espace admin.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SETS as SETS_FR } from './sets-fr.mjs';
import { fetchSetCards, fetchSets } from './tcg-api.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/data/catalogue.json');
const args = process.argv.slice(2);
const CACHE = args.includes('--cache') ? args[args.indexOf('--cache') + 1] : path.join(ROOT, '.cache/tcg');

const KINDS = { Pokémon: 0, Trainer: 1, Energy: 2 };
/** Dollar -> euro, pour les rares cartes cotées seulement outre-Atlantique. */
const USD_TO_EUR = 0.92;

/** Cote retenue en centimes d'euro, 0 si aucune cote exploitable. */
function valueOf(card) {
  const p = card.cardmarket?.prices;
  const eur = p && [p.avg30, p.trendPrice, p.averageSellPrice].find((x) => x > 0);
  if (eur) return Math.round(eur * 100);
  const variants = Object.values(card.tcgplayer?.prices || {});
  const usd = variants.map((v) => v.market || v.mid).filter((x) => x > 0);
  return usd.length ? Math.round(Math.min(...usd) * USD_TO_EUR * 100) : 0;
}

const index = (list, value) => {
  let i = list.indexOf(value);
  if (i < 0) i = list.push(value) - 1;
  return i;
};

const sets = await fetchSets(CACHE);
const types = [''];
const rarities = [''];
const outSets = [];
const outCards = [];
let priced = 0;
let pricesDate = '';
const missing = [];

for (const set of sets) {
  let cards;
  try {
    cards = await fetchSetCards(CACHE, set.id);
  } catch {
    missing.push(set.id);
    continue;
  }
  const fr = SETS_FR[set.id];
  const setIndex = outSets.push([set.id, fr?.name || set.name, set.series, fr?.code || set.ptcgoCode || set.id.toUpperCase(), (set.releaseDate || '').replace(/\//g, '-')]) - 1;
  cards.sort((a, b) => a.number.localeCompare(b.number, 'en', { numeric: true }));
  for (const c of cards) {
    const value = valueOf(c);
    if (value) priced++;
    const updated = (c.cardmarket?.updatedAt || '').replace(/\//g, '-');
    if (updated > pricesDate) pricesDate = updated;
    const row = [setIndex, c.number, c.name, KINDS[c.supertype] ?? 1, index(types, c.types?.[0] || ''), index(rarities, c.rarity || ''), value, c.nationalPokedexNumbers?.[0] || 0];
    // L'identifiant et l'image suivent presque toujours « extension-numéro » : on ne note que les exceptions.
    if (c.id !== `${set.id}-${c.number}` || c.images?.small !== `https://images.pokemontcg.io/${set.id}/${c.number}.png`) row.push(c.id, c.images?.small || '');
    outCards.push(row);
  }
  process.stdout.write(`\r${outSets.length}/${sets.length} extensions, ${outCards.length} cartes`);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ source: 'pokemontcg.io', date: pricesDate, types, rarities, sets: outSets, cards: outCards }));
const size = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`\n${outCards.length} cartes (${priced} avec une cote) dans ${outSets.length} extensions -> ${path.relative(ROOT, OUT)} (${size} Ko, cotes du ${pricesDate})`);
if (missing.length) console.warn(`! extensions indisponibles, à relancer : ${missing.join(', ')}`);
