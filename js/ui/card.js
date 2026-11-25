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

/** Dos de carte maison (aucun visuel officiel). */
export function cardBack(cls = '') {
  const id = `cb${++backSeq}`;
  return `<span class="tcg tcg--back ${cls}" aria-hidden="true">
    <svg viewBox="0 0 245 342" preserveAspectRatio="none">
      <defs>
        <radialGradient id="${id}g" cx=".5" cy=".5" r=".75">
          <stop offset="0" stop-color="#3a2a7a"/><stop offset=".6" stop-color="#171233"/><stop offset="1" stop-color="#0a0817"/>
        </radialGradient>
        <pattern id="${id}p" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="22" height="22" fill="none"/><path d="M0 11h22M11 0v22" stroke="#ffc83d" stroke-opacity=".12" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="245" height="342" rx="12" fill="url(#${id}g)"/>
      <rect width="245" height="342" rx="12" fill="url(#${id}p)"/>
      <rect x="9" y="9" width="227" height="324" rx="8" fill="none" stroke="#ffc83d" stroke-opacity=".55" stroke-width="2"/>
      <rect x="15" y="15" width="215" height="312" rx="5" fill="none" stroke="#ffc83d" stroke-opacity=".2" stroke-width="1"/>
      <g transform="translate(122.5 171)">
        <circle r="58" fill="#0a0817" stroke="#ffc83d" stroke-width="2.5"/>
        <circle r="47" fill="none" stroke="#ffc83d" stroke-opacity=".5" stroke-dasharray="2 6"/>
        <path d="M0-30 7-7 30 0 7 7 0 30-7 7-30 0-7-7Z" fill="#ffc83d"/>
        <path d="M21-25l2.6 6.4L30-16l-6.4 2.6L21-7l-2.6-6.4L12-16l6.4-2.6Z" fill="#fff" opacity=".85"/>
      </g>
      <text x="122.5" y="286" text-anchor="middle" class="pk-display" font-weight="700" font-size="13" letter-spacing="4" fill="#ffc83d" opacity=".85">${esc(BRAND.name.toUpperCase())}</text>
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
