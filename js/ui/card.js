// Rendu d'une carte : visuel seul, dos de carte et vignette avec légende.

import { BRAND } from '../config.js';
import { RARITIES } from '../data/packs.js';
import { cardRef } from '../catalog.js';
import { esc, eur } from '../format.js';

/** Étiquette de rareté (« Légendaire », « Rare »…). */
export function rarityBadge(rarity, cls = '') {
  const r = RARITIES[rarity];
  if (!r) return '';
  return `<span class="badge badge--rarity ${cls}" data-rarity="${rarity}">${r.label}</span>`;
}

/**
 * Visuel d'une carte.
 * @param {import('../catalog.js').Card} card
 * @param {{ hi?: boolean, lazy?: boolean, cls?: string }} [opts]
 */
export function cardImage(card, opts = {}) {
  const { hi = false, lazy = true, cls = '' } = opts;
  return `<span class="tcg ${cls}"><img src="${hi ? card.imgHi : card.img}" alt="${esc(card.name)} — ${esc(card.set)}" width="245" height="342" ${lazy ? 'loading="lazy"' : ''} decoding="async" draggable="false"></span>`;
}

let backSeq = 0;

/** Dos de carte maison (aucun visuel officiel), teinté par le thème. */
export function cardBack(cls = '') {
  const id = `cb${++backSeq}`;
  return `<span class="tcg tcg--back ${cls}" aria-hidden="true">
    <svg class="cardback" viewBox="0 0 245 342" preserveAspectRatio="none">
      <defs>
        <radialGradient id="${id}g" cx=".5" cy=".5" r=".75">
          <stop class="cardback__a" offset="0"/><stop class="cardback__b" offset="1"/>
        </radialGradient>
        <pattern id="${id}p" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path class="cardback__line" d="M0 11h22M11 0v22" stroke-opacity=".14" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="245" height="342" rx="12" fill="url(#${id}g)"/>
      <rect width="245" height="342" rx="12" fill="url(#${id}p)"/>
      <rect class="cardback__line" x="9" y="9" width="227" height="324" rx="8" fill="none" stroke-opacity=".6" stroke-width="2"/>
      <rect class="cardback__line" x="15" y="15" width="215" height="312" rx="5" fill="none" stroke-opacity=".22" stroke-width="1"/>
      <g transform="translate(122.5 171)">
        <circle class="cardback__line cardback__disc" r="58" stroke-width="2.5"/>
        <circle class="cardback__line" r="47" fill="none" stroke-opacity=".5" stroke-dasharray="2 6"/>
        <path class="cardback__ink" d="M0-30 7-7 30 0 7 7 0 30-7 7-30 0-7-7Z"/>
        <path d="M21-25l2.6 6.4L30-16l-6.4 2.6L21-7l-2.6-6.4L12-16l6.4-2.6Z" fill="#fff" opacity=".85"/>
      </g>
      <text x="122.5" y="286" text-anchor="middle" class="pk-display cardback__ink" font-weight="700" font-size="13" letter-spacing="4" opacity=".85">${esc(BRAND.name.toUpperCase())}</text>
    </svg>
  </span>`;
}

/**
 * Vignette : visuel + nom + référence + cote.
 * @param {import('../catalog.js').Card} card
 * @param {{ rarity?: string, value?: number, showValue?: boolean, attrs?: string, tag?: string, extra?: string, cls?: string }} [opts]
 */
export function cardTile(card, opts = {}) {
  const { rarity, value = card.value, showValue = true, attrs = '', tag = 'div', extra = '', cls = '' } = opts;
  return `<${tag} class="tile ${cls}" ${rarity ? `data-rarity="${rarity}"` : ''} ${attrs}>
    <span class="tile__stage">${cardImage(card)}${rarity ? rarityBadge(rarity, 'tile__badge') : ''}</span>
    <span class="tile__body">
      <span class="tile__name" title="${esc(card.name)}">${esc(card.name)}</span>
      <span class="tile__meta"><span>${esc(cardRef(card))}</span>${showValue ? `<strong>${eur(value)}</strong>` : ''}</span>
      ${extra}
    </span>
  </${tag}>`;
}
