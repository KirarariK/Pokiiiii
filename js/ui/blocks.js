// Blocs réutilisés par plusieurs pages.

import { cardRef } from '../catalog.js';
import { ago, esc, eur, eurShort, pct } from '../format.js';
import { icon } from '../icons.js';
import { RARITIES } from '../data/packs.js';
import { cardImage, rarityBadge } from './card.js';
import { packArt, themeGlow } from './pack-art.js';

/** En-tête de page : pastille d'icône, titre, sous-titre. */
export function pageHead({ icon: name, title, lead = '', actions = '' }) {
  return `<header class="page-head">
    ${name ? `<span class="page-head__ico">${icon(name, { size: 28 })}</span>` : ''}
    <h1>${esc(title)}</h1>
    ${lead ? `<p class="page-head__lead">${lead}</p>` : ''}
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
export const packRange = (pack) => `${pack.tiers[0].min} à ${eurShort(pack.tiers[pack.tiers.length - 1].max * 100)}`;

/** Vignette d'un pack (listes et accueil). */
export function packTile(pack) {
  return `<a class="pack-tile" href="#/packs/${pack.slug}" style="--glow:${themeGlow(pack.theme)}">
    ${pack.event ? `<span class="badge badge--event">${icon('flame', { size: 13 })}Événement</span>` : ''}
    <span class="pack-tile__stage">${packArt(pack)}</span>
    <span class="pack-tile__body">
      <span class="pack-tile__name">${esc(pack.name)}</span>
      <span class="pack-tile__tag">Cartes de ${packRange(pack)}</span>
      <span class="pack-tile__foot"><strong>${eur(pack.price)}</strong><span class="pack-tile__go">Voir${icon('arrow-right', { size: 15 })}</span></span>
    </span>
  </a>`;
}

/** Grille des répartitions d'un pack. */
export function oddsGrid(pack) {
  return `<div class="odds">
    ${pack.tiers
      .map(
        (t) => `<div class="odds__cell" data-rarity="${t.rarity}">
          <span class="odds__range">${t.min} € – ${t.max} €</span>
          <strong class="odds__p">${pct(t.p)}</strong>
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
export function emptyState({ iconName = 'package-open', title, text = '', action = '' }) {
  return `<div class="empty">
    <span class="empty__ico">${icon(iconName, { size: 30 })}</span>
    <h2>${esc(title)}</h2>
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
