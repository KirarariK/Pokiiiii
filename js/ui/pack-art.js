// Illustrations des boosters, dessinées en SVG (aucune image externe).
// Chaque thème définit ses couleurs et son emblème ; le sachet, les soudures
// et les reflets sont communs.

import { BRAND } from '../config.js';
import { esc } from '../format.js';

const THEMES = {
  glacier: {
    body: ['#f2fbff', '#a8dcff', '#4f9df0'],
    band: '#2f6fc4',
    ink: '#0b2a55',
    sub: '#1d4d8f',
    emblemBg: '#ffffff',
    emblem: '#2f7fe0',
    glyph: 'M0-34C20-8 28 6 28 18a28 28 0 1 1-56 0C-28 6-20-8 0-34Z',
    glow: '#7cc4ff',
  },
  orage: {
    body: ['#1a0f3d', '#5b2bd0', '#ff4fc8'],
    band: '#14092f',
    ink: '#ffffff',
    sub: '#f1d9ff',
    emblemBg: '#170b38',
    emblem: '#ffe45c',
    glyph: 'M8-36-22 6h20l-8 30L22-8H2Z',
    glow: '#c06bff',
  },
  jungle: {
    body: ['#03241c', '#0b8a5d', '#8dffbe'],
    band: '#021a14',
    ink: '#ffffff',
    sub: '#d2ffe6',
    emblemBg: '#04281f',
    emblem: '#8dffbe',
    glyph: 'M0-34C30-20 34 14 0 36-34 14-30-20 0-34ZM-1.6-18h3.2v46h-3.2Z',
    glyphRule: 'evenodd',
    glow: '#3ddc97',
  },
  zenith: {
    body: ['#08080c', '#1c1810', '#3a2e12'],
    band: '#c9a23a',
    ink: '#ffd978',
    sub: '#e9c979',
    emblemBg: '#0c0b10',
    emblem: '#ffd978',
    glyph: 'M-32 20-38-16-15 2 0-30 15 2 38-16 32 20ZM-32 26h64v8h-64Z',
    glow: '#ffc83d',
    foil: true,
  },
  brasier: {
    body: ['#2a0500', '#d3350a', '#ffb224'],
    band: '#1c0300',
    ink: '#ffffff',
    sub: '#ffe3bd',
    emblemBg: '#240400',
    emblem: '#ffb224',
    glyph: 'M0-38C6-22 26-12 26 10a26 26 0 0 1-52 0c0-12 8-20 14-28 2 10 8 12 10 6 2-8-2-16 2-26Z',
    glow: '#ff7a1a',
  },
  prisme: {
    body: ['#3a2314', '#a9683a', '#f3d3a2'],
    band: '#27160b',
    ink: '#ffffff',
    sub: '#ffe9cf',
    emblemBg: '#2a180d',
    emblem: '#f6d9ae',
    glyph: 'M-26 16 0-10 26 16 18 24 0 6-18 24ZM-26-8 0-34 26-8 18 0 0-18-18 0Z',
    glow: '#e6a368',
  },
  millesime: {
    body: ['#fbf2d6', '#f0cf7a', '#d9485c'],
    band: '#7a1f2b',
    ink: '#3b0d14',
    sub: '#6b1a24',
    emblemBg: '#fff8e6',
    emblem: '#b3263a',
    glyph: 'M0-34 9-11 34-11 14 4 21 28 0 14-21 28-14 4-34-11-9-11Z',
    glow: '#f0c36b',
  },
  joyau: {
    body: ['#0b0620', '#3a1f86', '#d06bff'],
    band: '#f0d98a',
    ink: '#ffffff',
    sub: '#ecdcff',
    emblemBg: '#0b0620',
    emblem: '#ffd978',
    glyph: 'M-16-30h32l18 20L0 36-34-10ZM-34-10h68',
    glow: '#c06bff',
    foil: true,
  },
};

export const themeGlow = (theme) => (THEMES[theme] || THEMES.glacier).glow;

let seq = 0;

/** Bord supérieur ou inférieur en dents de scie (soudure du sachet). */
function zigzag(y, fromX, toX, amplitude) {
  const step = 9;
  const dir = toX > fromX ? 1 : -1;
  const pts = [];
  let up = true;
  for (let x = fromX; dir > 0 ? x <= toX : x >= toX; x += step * dir) {
    pts.push(`${x},${up ? y - amplitude : y + amplitude}`);
    up = !up;
  }
  return pts.join(' L');
}

/**
 * Illustrations des boosters (assets/packs/<pack>.webp) : largeur et hauteur en pixels.
 * Un pack sans illustration est dessiné en SVG (voir drawnPack).
 */
const ART = {
  rosee: [506, 960],
  prisme: [498, 960],
  orage: [492, 960],
  millesime: [502, 960],
  brasier: [471, 960],
  canopee: [477, 960],
  zenith: [468, 960],
  joyau: [468, 960],
};

/** Proportions du cadre réservé à un booster dans la mise en page (largeur / hauteur). */
const FRAME = 240 / 340;

/**
 * Visuel d'un booster : son illustration, avec son nom posé sur le bandeau du bas.
 * @param {object} pack  pack de js/data/packs.js (slug, theme, short)
 * @param {{ title?: string, lazy?: boolean }} [opts]
 * @returns {string} balisage HTML
 */
export function packArt(pack, opts = {}) {
  const art = ART[pack.slug];
  if (!art) return drawnPack(pack, opts);
  const [w, h] = art;
  const src = `assets/packs/${pack.slug}.webp`;
  const label = esc((pack.short || pack.name).toUpperCase());
  // Le booster occupe toute la hauteur du cadre ; sa largeur s'en déduit.
  const width = ((w / h / FRAME) * 100).toFixed(2);
  return `<span class="pack-art pack-art--img" role="img" aria-label="${esc(opts.title || pack.name)}">
    <span class="pack-art__in" style="width:${width}%;aspect-ratio:${w}/${h}">
      <img src="${src}" alt="" width="${w}" height="${h}" ${opts.lazy === false ? '' : 'loading="lazy"'} decoding="async" draggable="false">
      <span class="pack-art__shine" aria-hidden="true" style="-webkit-mask-image:url(${src});mask-image:url(${src})"></span>
      <span class="pack-art__label ${label.length > 6 ? 'is-long' : ''}" aria-hidden="true"><b>${label}</b><i>1 carte mystère</i></span>
    </span>
  </span>`;
}

/**
 * Booster dessiné en SVG, pour un pack qui n'a pas encore d'illustration.
 * @param {object} pack  pack de js/data/packs.js (theme, short)
 * @param {{ title?: string }} [opts]
 * @returns {string} balisage SVG
 */
function drawnPack(pack, opts = {}) {
  const t = THEMES[pack.theme] || THEMES.glacier;
  const id = `pk${++seq}`;
  const label = esc((pack.short || pack.name).toUpperCase());
  const fontSize = label.length > 7 ? 27 : label.length > 6 ? 30 : 34;
  const outline = `M${zigzag(7, 12, 228, 3)} L228,333 L${zigzag(333, 228, 12, 3)} Z`;
  const title = esc(opts.title || pack.name);

  return `<svg class="pack-art" viewBox="0 0 240 340" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.body[0]}"/><stop offset=".55" stop-color="${t.body[1]}"/><stop offset="1" stop-color="${t.body[2]}"/>
    </linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".12" stop-color="#000" stop-opacity="0"/>
      <stop offset=".5" stop-color="#fff" stop-opacity=".1"/><stop offset=".88" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".32"/>
    </linearGradient>
    <linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1">
      <stop offset=".18" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff" stop-opacity=".34"/>
      <stop offset=".38" stop-color="#fff" stop-opacity="0"/><stop offset=".58" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".66" stop-color="#fff" stop-opacity=".16"/><stop offset=".72" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id}g" cx=".5" cy=".46" r=".5">
      <stop offset="0" stop-color="${t.glow}" stop-opacity=".55"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="${id}r" width="5" height="26" patternUnits="userSpaceOnUse">
      <rect width="2.2" height="26" fill="#000" opacity=".2"/>
    </pattern>
    <pattern id="${id}d" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <circle cx="9" cy="9" r="1.5" fill="${t.ink}" opacity=".13"/>
    </pattern>
    <clipPath id="${id}c"><path d="${outline}"/></clipPath>
  </defs>
  <g clip-path="url(#${id}c)">
    <rect width="240" height="340" fill="url(#${id}b)"/>
    <rect width="240" height="340" fill="url(#${id}d)"/>
    <rect width="240" height="340" fill="url(#${id}g)"/>
    ${t.foil ? `<path d="M-20 120 260 40v34L-20 154Z" fill="${t.band}" opacity=".5"/><path d="M-20 262 260 182v12L-20 274Z" fill="${t.band}" opacity=".35"/>` : ''}
    <rect y="0" width="240" height="30" fill="${t.band}"/><rect y="0" width="240" height="30" fill="url(#${id}r)"/>
    <rect y="310" width="240" height="30" fill="${t.band}"/><rect y="310" width="240" height="30" fill="url(#${id}r)"/>
    <path d="M12 36h216" stroke="${t.ink}" stroke-opacity=".35" stroke-width="1" stroke-dasharray="3 4"/>
    <text x="120" y="62" text-anchor="middle" class="pk-display" font-weight="700" font-size="11" letter-spacing="3.4" fill="${t.sub}">${esc(BRAND.name.toUpperCase())}</text>
    <g transform="translate(120 152)">
      <circle r="60" fill="${t.emblemBg}" opacity=".92"/>
      <circle r="60" fill="none" stroke="${t.emblem}" stroke-width="2.5" opacity=".9"/>
      <circle r="51" fill="none" stroke="${t.emblem}" stroke-width="1" stroke-dasharray="2 5" opacity=".7"/>
      <path d="${t.glyph}" fill="${t.emblem}"${t.glyphRule ? ` fill-rule="${t.glyphRule}"` : ''}/>
    </g>
    <text x="120" y="258" text-anchor="middle" class="pk-display" font-weight="800" font-size="${fontSize}" letter-spacing="1" fill="${t.ink}">${label}</text>
    <text x="120" y="284" text-anchor="middle" class="pk-body" font-weight="700" font-size="10.5" letter-spacing="2.6" fill="${t.sub}">1 CARTE MYSTÈRE</text>
    <rect width="240" height="340" fill="url(#${id}s)"/>
    <rect class="pack-art__foil" x="-240" width="720" height="340" fill="url(#${id}f)"/>
  </g>
  <path d="${outline}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.2"/>
</svg>`;
}
