#!/usr/bin/env node
// Génère js/icons.js à partir des icônes Lucide (licence ISC).
//
//   npm install --no-save lucide-static
//   node scripts/build-icons.mjs
//
// Pour ajouter une icône : ajouter son nom Lucide à la liste ci-dessous, puis relancer.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.argv[2] || path.join(ROOT, 'node_modules/lucide-static/icons');
const out = path.join(ROOT, 'js/icons.js');
if (!fs.existsSync(dir)) {
  console.error(`Icônes introuvables dans ${dir} : lancer « npm install --no-save lucide-static » d'abord.`);
  process.exit(1);
}
const names = `house package package-open gift archive trophy user user-cog moon wallet plus minus chevron-right chevron-down x check truck clock flame sparkles shield-check info menu arrow-right arrow-left star zap lock mail circle-help log-out log-in refresh-cw ticket users eye trash-2 badge-check crown medal award trending-up banknote credit-card landmark map-pin hand-coins history globe search volume-2 volume-x shield scale triangle-alert circle-check skip-forward rotate-ccw send gem percent timer sliders-horizontal arrow-up-right arrow-down-left dices vault receipt circle-alert heart party-popper radio activity list-checks hourglass file-text circle-dollar-sign scan-face calendar user-plus droplet leaf snowflake palette chevrons-up hash key-round rotate-cw target calendar-check list fingerprint circle-x fast-forward download upload layout-dashboard boxes chevron-left gamepad-2 library swords`.split(/\s+/);
const icons = {}; const missing = [];
for (const n of names) {
  const f = `${dir}/${n}.svg`;
  if (!fs.existsSync(f)) { missing.push(n); continue; }
  const svg = fs.readFileSync(f, 'utf8');
  const inner = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*\n\s*/g, '').trim();
  icons[n] = inner;
}
const body = Object.entries(icons).map(([k, v]) => `  '${k}': '${v.replace(/'/g, "\\'")}',`).join('\n');
fs.writeFileSync(out, `// Icônes : tracés issus de Lucide (https://lucide.dev) — licence ISC.
// Copyright (c) Lucide Icons and Contributors. Fichier généré : ne pas éditer à la main.

const PATHS = {
${body}
};

/**
 * Retourne le balisage SVG d'une icône.
 * @param {string} name  nom Lucide (ex. 'trophy')
 * @param {{size?: number, cls?: string, label?: string}} [opts]
 */
export function icon(name, opts = {}) {
  const { size = 20, cls = '', label = '' } = opts;
  const inner = PATHS[name];
  if (!inner) return '';
  const a11y = label ? \`role="img" aria-label="\${label}"\` : 'aria-hidden="true"';
  return \`<svg class="ico \${cls}" width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" \${a11y}>\${inner}</svg>\`;
}

export const ICON_NAMES = Object.keys(PATHS);
`);
console.log('icons:', Object.keys(icons).length, 'missing:', missing.join(', ') || 'none');
