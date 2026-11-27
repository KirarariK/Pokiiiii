// Blocs réutilisés par plusieurs pages.

import { CARDS, cardRef, packAvailable, packTiers, topHits } from '../catalog.js';
import { ago, esc, eur, eurShort, pct } from '../format.js';
import { icon } from '../icons.js';
import { PACKS, RARITIES } from '../data/packs.js';
import { stockVersion } from '../stock.js';
import { cardImage, rarityBadge } from './card.js';
import { packArt, themeGlow } from './pack-art.js';

/** En-tête de page : pastille d'icône, titre, sous-titre. */
export function pageHead({ icon: name, title, lead = '', actions = '' }) {
  return `<header class="page-head">
    ${name ? `<span class="page-head__ico">${icon(name, { size: 24 })}</span>` : ''}
    <div class="page-head__text">
      <h1>${esc(title)}</h1>
      ${lead ? `<p class="page-head__lead">${lead}</p>` : ''}
    </div>
    ${actions ? `<div class="page-head__actions">${actions}</div>` : ''}
  </header>`;
}

/** Titre de section avec lien optionnel à droite. */
export function sectionHead(title, { iconName = '', link = '', note = '' } = {}) {
  return `<div class="section__head">
    <h2>${iconName ? icon(iconName, { size: 22 }) : ''}<span>${esc(title)}</span></h2>
    ${note ? `<span class="simulated" title="Contenu généré pour la démonstration">${icon('radio', { size: 14 })}${esc(note)}</span>` : ''}
    ${link}
  </div>`;
}

/** Étendue des cotes d'un pack : « 4 à 275 € ». */
/** Fourchette de cotes d'un pack : celle des cartes qui peuvent en sortir en ce moment. */
export function packRange(pack) {
  const drops = topHits(pack, Infinity);
  if (!drops.length) return `${pack.tiers[0].min} à ${eurShort(pack.tiers[pack.tiers.length - 1].max * 100)}`;
  return `${Math.floor(drops[drops.length - 1].card.value / 100)} à ${eurShort(Math.floor(drops[0].card.value / 100) * 100)}`;
}

/** Vignette d'un pack (listes et accueil). */
let peeks = null;
let peeksVersion = -1;
/**
 * Carte qui dépasse derrière le booster d'une tuile : une des plus grosses
 * cartes du pack, différente d'un pack à l'autre pour que les tuiles se distinguent.
 */
function peekCard(pack) {
  if (!peeks || peeksVersion !== stockVersion()) {
    peeksVersion = stockVersion();
    peeks = new Map();
    const taken = new Set();
    for (const p of PACKS) {
      const hits = topHits(p, 8).map((d) => d.card);
      const card = hits.find((c) => !taken.has(c.nameEn)) || hits[0];
      if (!card) continue;
      taken.add(card.nameEn);
      peeks.set(p.slug, card);
    }
  }
  // Pack en rupture : pas de table, on garde l'habillage avec une carte du fonds.
  return peeks.get(pack.slug) || topHits(pack, 1)[0]?.card || CARDS[0];
}

export function packTile(pack) {
  const open = packAvailable(pack);
  return `<a class="pack-tile ${open ? '' : 'is-out'}" href="#/packs/${pack.slug}" style="--glow:${themeGlow(pack.theme)}">
    ${!open ? `<span class="badge badge--out">Rupture</span>` : pack.event ? `<span class="badge badge--event">${icon('flame', { size: 13 })}Événement</span>` : ''}
    <span class="pack-tile__stage">
      <span class="pack-tile__peek" aria-hidden="true">${cardImage(peekCard(pack))}</span>
      ${packArt(pack)}
    </span>
    <span class="pack-tile__body">
      <span class="pack-tile__name">${esc(pack.name)}</span>
      <span class="pack-tile__tag">Cartes de ${packRange(pack)}</span>
      <span class="pack-tile__foot"><strong>${eur(pack.price)}</strong><span class="pack-tile__go"><span>Voir</span>${icon('arrow-right', { size: 15 })}</span></span>
    </span>
  </a>`;
}

/** Grille des répartitions d'un pack. */
export function oddsGrid(pack) {
  return `<div class="odds">
    ${packTiers(pack)
      .map(
        (t) => `<div class="odds__cell ${t.count ? '' : 'is-empty'}" data-rarity="${t.rarity}">
          <span class="odds__range">${t.min} € – ${t.max} €</span>
          <strong class="odds__p">${t.count ? pct(t.p * 100) : '—'}</strong>
          <span class="odds__rarity">${RARITIES[t.rarity].label}</span>
        </div>`,
      )
      .join('')}
  </div>`;
}

/** Une ligne du flux « dernières ouvertures ». */
export function openingItem({ at, pseudo, pack, card, rarity }, now = Date.now()) {
  return `<article class="pull" data-rarity="${rarity}">
    <span class="pull__img">${cardImage(card)}${rarityBadge(rarity)}</span>
    <span class="pull__body">
      <span class="pull__name">${esc(card.name)}</span>
      <span class="pull__meta">${esc(cardRef(card))} · <strong>${eur(card.value)}</strong></span>
      <span class="pull__who">${esc(pseudo)} · ${esc(pack.short)} · ${ago(at, now)}</span>
    </span>
  </article>`;
}

/** État vide. */
export function emptyState({ iconName = 'package-open', title, text = '', action = '', level = 2 }) {
  return `<div class="empty">
    <span class="empty__ico">${icon(iconName, { size: 30 })}</span>
    <h${level}>${esc(title)}</h${level}>
    ${text ? `<p>${text}</p>` : ''}
    ${action}
  </div>`;
}

/** Tuile de chiffre clé. */
export function statTile({ iconName, label, value, hint = '' }) {
  return `<div class="stat">
    <span class="stat__label">${icon(iconName, { size: 16 })}${esc(label)}</span>
    <strong class="stat__value">${value}</strong>
    ${hint ? `<span class="stat__hint">${hint}</span>` : ''}
  </div>`;
}

/** Bandeau d'information. type : 'demo' | 'info' | 'warn'. */
export function note(html, type = 'info') {
  const names = { demo: 'info', info: 'info', warn: 'triangle-alert' };
  return `<p class="note note--${type}">${icon(names[type] || 'info', { size: 16 })}<span>${html}</span></p>`;
}
