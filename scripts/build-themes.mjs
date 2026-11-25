#!/usr/bin/env node
// Génère css/themes.css à partir des palettes ci-dessous et vérifie les contrastes.
//
//   node scripts/build-themes.mjs
//
// Un thème = un type. Chaque thème définit TOUTES les variables : n'importe quel
// élément portant data-theme="…" (la page entière, ou une vignette d'aperçu)
// adopte ce thème pour tout son contenu. Le script échoue si un couple
// texte/fond tombe sous le seuil de lisibilité (WCAG AA).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'css/themes.css');

const RARITY = {
  dark: { commune: '#a3acc4', peu_commune: '#3ddc97', rare: '#4da3ff', ultra_rare: '#b57bff', legendaire: '#ffc83d', mythique: '#ff6b9d' },
  light: { commune: '#596281', peu_commune: '#0a7a4e', rare: '#1763c4', ultra_rare: '#7436d6', legendaire: '#8f5f00', mythique: '#c2185b' },
};

const STATUS = {
  dark: { success: '#3ddc97', danger: '#ff6b78', warning: '#ffb020', onSuccess: '#04150d' },
  light: { success: '#0a7a4e', danger: '#c9243a', warning: '#a86200', onSuccess: '#ffffff' },
};

/** Motifs d'ambiance : formes simples sur une tuile de 120 × 120, teintées par le thème. */
const MOTIFS = {
  feu: (c) => `<g fill="${c}"><path d="M30 16c6 10 14 14 14 26a14 14 0 0 1-28 0c0-6 4-10 7-14 1 5 4 6 5 3 1-4-1-9 2-15z"/><path d="M90 74c4 7 9 9 9 17a9 9 0 0 1-18 0c0-4 2-6 4-9 1 3 3 4 3 2 1-3 0-6 2-10z"/></g>`,
  eau: (c) => `<g fill="${c}"><path d="M30 14c8 11 12 17 12 23a12 12 0 0 1-24 0c0-6 4-12 12-23z"/><circle cx="88" cy="82" r="6"/><circle cx="102" cy="62" r="3"/><circle cx="74" cy="100" r="2.5"/></g>`,
  plante: (c) => `<g fill="${c}"><path d="M30 12c16 6 20 22 0 38-20-16-16-32 0-38z"/><path d="M92 70c10 4 12 14 0 24-12-10-10-20 0-24z" transform="rotate(24 92 82)"/></g>`,
  electrik: (c) => `<g fill="${c}"><path d="M36 10 16 42h13l-7 24 24-34H33z"/><path d="M96 70 84 90h8l-4 15 15-21h-8z"/></g>`,
  psy: (c) => `<g fill="none" stroke="${c}" stroke-width="3"><circle cx="32" cy="32" r="16"/><circle cx="32" cy="32" r="6"/><circle cx="92" cy="86" r="10"/></g>`,
  tenebres: (c) => `<g fill="${c}"><path d="M40 14a18 18 0 1 0 6 33 15 15 0 1 1-6-33z"/><circle cx="92" cy="80" r="3"/><circle cx="104" cy="96" r="2"/><circle cx="80" cy="100" r="1.5"/></g>`,
  dragon: (c) => `<g fill="none" stroke="${c}" stroke-width="3"><path d="M0 60a30 30 0 0 1 60 0M60 60a30 30 0 0 1 60 0M-30 120a30 30 0 0 1 60 0M30 120a30 30 0 0 1 60 0M90 120a30 30 0 0 1 60 0M-30 0a30 30 0 0 1 60 0M30 0a30 30 0 0 1 60 0M90 0a30 30 0 0 1 60 0"/></g>`,
  glace: (c) => `<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"><path d="M32 12v40M14.7 22l34.6 20M14.7 42l34.6-20M26 16l6 6 6-6M26 48l6-6 6 6"/><path d="M92 72v22M82.5 77.5l19 11M82.5 88.5l19-11"/></g>`,
  fee: (c) => `<g fill="${c}"><path d="M30 10l4.5 15.5L50 30l-15.5 4.5L30 50l-4.5-15.5L10 30l15.5-4.5z"/><path d="M90 70l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/><circle cx="70" cy="24" r="2.5"/></g>`,
};

const THEMES = {
  electrik: {
    scheme: 'dark', motifOpacity: 0.05,
    bg: '#0a0c14', bg2: '#0e111d', surface: '#141829', surface2: '#1a2036', surface3: '#232a45', border: '#262d49', borderStrong: '#3a4470',
    text: '#eef1fb', text2: '#c7cde3', muted: '#939cbd',
    primary: '#ffd23d', primary2: '#ff9d2e', onPrimary: '#1b1200', primaryText: '#ffd23d',
    accent: '#5cb8ff', accentText: '#7cc6ff', link: '#9ecbff',
    stageA: '#1d1a47', stageB: '#07080f', cbInk: '#ffd23d',
  },
  feu: {
    scheme: 'dark', motifOpacity: 0.055,
    bg: '#130a07', bg2: '#190d09', surface: '#22120d', surface2: '#2c1811', surface3: '#3b2117', border: '#47271b', borderStrong: '#70402b',
    text: '#fff3ec', text2: '#f0d2c3', muted: '#c49d8c',
    primary: '#ff9a3d', primary2: '#ff5a2e', onPrimary: '#230c00', primaryText: '#ffa24d',
    accent: '#ffd166', accentText: '#ffd166', link: '#ffc089',
    stageA: '#4d1b0a', stageB: '#0c0503', cbInk: '#ffb15c',
  },
  eau: {
    scheme: 'dark', motifOpacity: 0.055,
    bg: '#04111c', bg2: '#061624', surface: '#0a2032', surface2: '#0e2a41', surface3: '#153753', border: '#183d5e', borderStrong: '#2a6190',
    text: '#eaf7ff', text2: '#c1dff0', muted: '#88acc6',
    primary: '#38d6ff', primary2: '#2b8cff', onPrimary: '#00182a', primaryText: '#5cdcff',
    accent: '#5ef2cf', accentText: '#5ef2cf', link: '#86dcff',
    stageA: '#0b3d61', stageB: '#020a12', cbInk: '#6fe0ff',
  },
  plante: {
    scheme: 'dark', motifOpacity: 0.05,
    bg: '#07130c', bg2: '#091810', surface: '#0e2217', surface2: '#132c1e', surface3: '#1b3a28', border: '#1f402c', borderStrong: '#346646',
    text: '#effcf2', text2: '#c8e6d0', muted: '#8fb59c',
    primary: '#a6e84f', primary2: '#35c275', onPrimary: '#0c1f00', primaryText: '#b2ec66',
    accent: '#ffd56a', accentText: '#ffd56a', link: '#b0ea92',
    stageA: '#174d2c', stageB: '#030a06', cbInk: '#b6ee6e',
  },
  psy: {
    scheme: 'dark', motifOpacity: 0.07,
    bg: '#120819', bg2: '#170b20', surface: '#20112c', surface2: '#2a173a', surface3: '#38204d', border: '#3f2456', borderStrong: '#633885',
    text: '#fbf0ff', text2: '#e1cbef', muted: '#b196c5',
    primary: '#ff7ad9', primary2: '#c56bff', onPrimary: '#26002d', primaryText: '#ff8fe0',
    accent: '#7de3ff', accentText: '#7de3ff', link: '#e6b0ff',
    stageA: '#4d1867', stageB: '#0a040f', cbInk: '#ff9de4',
  },
  tenebres: {
    scheme: 'dark', motifOpacity: 0.06,
    bg: '#060607', bg2: '#0a0a0c', surface: '#121215', surface2: '#19191e', surface3: '#23232a', border: '#28282f', borderStrong: '#40404c',
    text: '#f5f5f7', text2: '#d2d2da', muted: '#9a9aa9',
    primary: '#ff7a8d', primary2: '#ff4763', onPrimary: '#210008', primaryText: '#ff8697',
    accent: '#f5d54a', accentText: '#f5d54a', link: '#ffa3b1',
    stageA: '#3d0e1a', stageB: '#050506', cbInk: '#f5d54a',
  },
  dragon: {
    scheme: 'dark', motifOpacity: 0.07,
    bg: '#0b0919', bg2: '#0f0c21', surface: '#17132f', surface2: '#1e193e', surface3: '#292254', border: '#2e2760', borderStrong: '#49409a',
    text: '#f1efff', text2: '#cdc8f0', muted: '#9891c7',
    primary: '#a9b2ff', primary2: '#8274ff', onPrimary: '#0c0a33', primaryText: '#b3baff',
    accent: '#f6c453', accentText: '#f6c453', link: '#bcc3ff',
    stageA: '#2d2580', stageB: '#06050f', cbInk: '#f6c453',
  },
  glace: {
    scheme: 'light', motifOpacity: 0.07,
    bg: '#eef6fb', bg2: '#ffffff', surface: '#ffffff', surface2: '#eaf3f9', surface3: '#d9e8f2', border: '#cfe0ec', borderStrong: '#a9c4d8',
    text: '#0c2233', text2: '#24465c', muted: '#4d6a80',
    primary: '#0b78c8', primary2: '#075aa8', onPrimary: '#ffffff', primaryText: '#075aa8',
    accent: '#0a8f9e', accentText: '#087686', link: '#0a62b0',
    stageA: '#134a74', stageB: '#04111c', cbInk: '#bfe6ff',
  },
  fee: {
    scheme: 'light', motifOpacity: 0.08,
    bg: '#fdf3f8', bg2: '#ffffff', surface: '#ffffff', surface2: '#fbeaf3', surface3: '#f4d9e8', border: '#f0d3e3', borderStrong: '#dba9c6',
    text: '#33122a', text2: '#5a2a4a', muted: '#7d4f6c',
    primary: '#d6336c', primary2: '#b02a8a', onPrimary: '#ffffff', primaryText: '#b3205f',
    accent: '#7b4fd6', accentText: '#6a3fc4', link: '#a3238f',
    stageA: '#611c4e', stageB: '#12040e', cbInk: '#ffc2dc',
  },
};

/* ------------------------------------------------------------- contrastes */

const lum = (hex) => {
  const n = Number.parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

let failures = 0;
function check(theme, label, fg, bg, min) {
  const ratio = contrast(fg, bg);
  if (ratio < min) {
    failures++;
    console.log(`  ÉCHEC ${theme} : ${label} ${fg} sur ${bg} = ${ratio.toFixed(2)} (minimum ${min})`);
  }
}

for (const [id, t] of Object.entries(THEMES)) {
  const st = STATUS[t.scheme];
  const ra = RARITY[t.scheme];
  for (const bg of [t.bg, t.bg2, t.surface, t.surface2]) {
    check(id, 'texte', t.text, bg, 7);
    check(id, 'texte secondaire', t.text2, bg, 4.5);
    check(id, 'texte discret', t.muted, bg, 4.5);
    check(id, 'couleur principale en texte', t.primaryText, bg, 4.5);
    check(id, 'accent en texte', t.accentText, bg, 4.5);
    check(id, 'lien', t.link, bg, 4.5);
    check(id, 'succès', st.success, bg, 4.5);
    check(id, 'danger', st.danger, bg, 4.5);
    Object.entries(ra).forEach(([name, color]) => check(id, `rareté ${name}`, color, bg, 4.5));
  }
  check(id, 'texte sur surface 3', t.text, t.surface3, 7);
  check(id, 'bouton principal (début)', t.onPrimary, t.primary, 4.5);
  check(id, 'bouton principal (fin)', t.onPrimary, t.primary2, 4.5);
  check(id, 'pastille de succès', st.onSuccess, st.success, 4.5);
  check(id, 'bordure marquée', t.borderStrong, t.surface, 1.3);
}

/* ---------------------------------------------------------------- écriture */

const motif = (id, t) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" opacity="${t.motifOpacity}">${MOTIFS[id](t.scheme === 'dark' ? t.primary : t.primaryText)}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}")`;
};

const block = (id, t) => {
  const st = STATUS[t.scheme];
  const ra = RARITY[t.scheme];
  const dark = t.scheme === 'dark';
  const selector = id === 'electrik' ? `:root,\n[data-theme='${id}']` : `[data-theme='${id}']`;
  return `${selector} {
  color-scheme: ${t.scheme};
  --bg: ${t.bg};
  --bg-2: ${t.bg2};
  --surface: ${t.surface};
  --surface-2: ${t.surface2};
  --surface-3: ${t.surface3};
  --border: ${t.border};
  --border-strong: ${t.borderStrong};
  --text: ${t.text};
  --text-2: ${t.text2};
  --muted: ${t.muted};
  --primary: ${t.primary};
  --primary-2: ${t.primary2};
  --on-primary: ${t.onPrimary};
  --primary-text: ${t.primaryText};
  --accent: ${t.accent};
  --accent-text: ${t.accentText};
  --link: ${t.link};
  --success: ${st.success};
  --danger: ${st.danger};
  --warning: ${st.warning};
  --on-success: ${st.onSuccess};
  --tab-active: ${dark ? t.surface3 : t.surface};
  --shadow: ${dark ? '0 12px 34px rgba(0, 0, 0, 0.42)' : '0 12px 34px rgba(24, 28, 70, 0.1)'};
  --shadow-sm: ${dark ? '0 4px 14px rgba(0, 0, 0, 0.28)' : '0 4px 14px rgba(24, 28, 70, 0.07)'};
  --stage-a: ${t.stageA};
  --stage-b: ${t.stageB};
  --cb-ink: ${t.cbInk};
  --motif: ${motif(id, t)};
  --r-commune: ${ra.commune};
  --r-peu_commune: ${ra.peu_commune};
  --r-rare: ${ra.rare};
  --r-ultra_rare: ${ra.ultra_rare};
  --r-legendaire: ${ra.legendaire};
  --r-mythique: ${ra.mythique};
}`;
};

const css = `/* Fichier généré par scripts/build-themes.mjs — ne pas modifier à la main. */

${Object.entries(THEMES).map(([id, t]) => block(id, t)).join('\n\n')}
`;

if (failures) {
  console.log(`\n${failures} contraste(s) insuffisant(s) : css/themes.css n'a pas été réécrit.`);
  process.exit(1);
}
fs.writeFileSync(OUT, css);
console.log(`${Object.keys(THEMES).length} thèmes écrits dans css/themes.css, contrastes conformes.`);
