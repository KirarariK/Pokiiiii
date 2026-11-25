// Catalogue complet : toutes les cartes de la base, chargées à la demande.
// (Le fonds de démonstration, lui, est embarqué : voir js/data/cards.js.)

import { nameFr } from './data/names-fr.js';

const IMG = 'https://images.pokemontcg.io';
export const KINDS = ['Pokémon', 'Dresseur', 'Énergie'];

/** Minuscules sans accents, pour la recherche. */
export const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

let loading = null;

/**
 * @returns {Promise<{ date: string, sets: Array<{id: string, name: string, series: string, code: string, date: string, count: number}>, cards: object[] }>}
 * Chaque carte a la forme utilisée partout dans le site (voir js/catalog.js),
 * plus : kind (0 Pokémon, 1 Dresseur, 2 Énergie), dex, q (texte de recherche).
 */
export function loadCatalogue() {
  if (!loading) {
    loading = fetch('assets/data/catalogue.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Catalogue indisponible (${res.status})`);
        return res.json();
      })
      .then((raw) => {
        const sets = raw.sets.map(([id, name, series, code, date]) => ({ id, name, series, code, date, count: 0 }));
        const cards = raw.cards.map(([si, number, nameEn, kind, ti, ri, value, dex, idAlt, imgAlt]) => {
          const set = sets[si];
          set.count += 1;
          const img = imgAlt || `${IMG}/${set.id}/${number}.png`;
          const name = kind === 0 ? nameFr(nameEn) : nameEn;
          return {
            id: idAlt || `${set.id}-${number}`,
            name,
            nameEn,
            setId: set.id,
            set: set.name,
            code: set.code,
            number,
            value,
            type: raw.types[ti] || 'Colorless',
            tcgRarity: raw.rarities[ri] || '',
            img,
            imgHi: img.replace(/\.png$/, '_hires.png'),
            kind,
            dex,
            q: fold(`${name} ${nameEn} ${set.name} ${set.code} ${number}`),
          };
        });
        return { date: raw.date, sets, cards };
      })
      .catch((err) => {
        loading = null;
        throw err;
      });
  }
  return loading;
}

/** Fiche à enregistrer dans le stock : la carte sans les champs propres au catalogue. */
export function cardRecord({ id, name, nameEn, setId, set, code, number, value, type, tcgRarity, img, imgHi }) {
  return { id, name, nameEn, setId, set, code, number, value, type, tcgRarity, img, imgHi };
}
