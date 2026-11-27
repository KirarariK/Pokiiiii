// Accès à l'API publique Pokémon TCG (pokemontcg.io), avec cache sur disque.
// Un fichier par réponse : sets.json, puis cards_<extension>_<page>.json.
// L'API renvoie souvent des erreurs 5xx passagères : chaque appel est réessayé.

import fs from 'node:fs';
import path from 'node:path';

const API = 'https://api.pokemontcg.io/v2';
const SELECT = 'id,name,number,rarity,supertype,subtypes,types,nationalPokedexNumbers,images,cardmarket,tcgplayer';
const PAGE = 250;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Avec --offline, seul le cache est lu : une réponse absente est une erreur immédiate. */
const OFFLINE = process.argv.includes('--offline');

async function getJson(url, file) {
  if (fs.existsSync(file)) {
    try {
      const json = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(json.data)) return json;
    } catch {
      /* cache illisible : on retélécharge */
    }
  }
  if (OFFLINE) throw new Error(`Absent du cache : ${path.basename(file)}`);
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, JSON.stringify(json));
          await sleep(1200);
          return json;
        }
      }
    } catch {
      /* réseau ou 5xx : on réessaie */
    }
    await sleep(4000);
  }
  throw new Error(`API indisponible : ${url}`);
}

/** Toutes les extensions, de la plus ancienne à la plus récente. */
export async function fetchSets(cache) {
  return (await getJson(`${API}/sets?pageSize=250&orderBy=releaseDate`, path.join(cache, 'sets.json'))).data;
}

/** Toutes les cartes d'une extension (plusieurs pages au besoin). */
export async function fetchSetCards(cache, id) {
  const cards = [];
  for (let page = 1; ; page++) {
    const { data } = await getJson(`${API}/cards?q=set.id:${id}&page=${page}&pageSize=${PAGE}&select=${SELECT}`, path.join(cache, `cards_${id}_${page}.json`));
    cards.push(...data);
    if (data.length < PAGE) return cards;
  }
}
