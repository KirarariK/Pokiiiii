// Thèmes visuels : un thème par type. Les couleurs sont dans css/themes.css
// (générées par scripts/build-themes.mjs) ; ici, seulement ce qui sert à les
// présenter et à choisir une suggestion.
//
// Les identifiants et la clé de stockage sont repris dans js/theme-init.js
// (script minuscule chargé avant le premier affichage) : les garder alignés.

export const THEME_KEY = 'pokiiiii.theme.v1';
export const DEFAULT_THEME = 'electrik';
/** Thème proposé d'office aux visiteurs dont le système est réglé en clair. */
export const LIGHT_DEFAULT = 'glace';

/**
 * `match` désigne les cartes qui peuvent illustrer le thème (la plus cotée est retenue) ;
 * `packs` les packs dont la page suggère ce thème à un nouveau visiteur.
 */
export const THEMES = [
  { id: 'electrik', name: 'Électrik', mood: 'Orage', line: 'Nuit d’orage et éclairs dorés', icon: 'zap', match: { types: ['Lightning'], names: /Pikachu/ }, packs: ['pro', 'retro'] },
  { id: 'feu', name: 'Feu', mood: 'Brasier', line: 'Braises rouges, flammes vives', icon: 'flame', match: { types: ['Fire'], names: /Charizard/ }, packs: ['brasier'] },
  { id: 'eau', name: 'Eau', mood: 'Abysses', line: 'Bleu profond, reflets turquoise', icon: 'droplet', match: { types: ['Water'], names: /Blastoise|Gyarados|Suicune/ }, packs: [] },
  { id: 'plante', name: 'Plante', mood: 'Canopée', line: 'Sous-bois sombre, feuillage clair', icon: 'leaf', match: { types: ['Grass'], names: /Venusaur|Celebi|Leafeon/ }, packs: ['master'] },
  { id: 'psy', name: 'Psy', mood: 'Psyché', line: 'Prune et rose néon', icon: 'eye', match: { types: ['Psychic'], names: /Mewtwo|Mew|Espeon/ }, packs: [] },
  { id: 'tenebres', name: 'Ténèbres', mood: 'Nocturne', line: 'Noir profond, rouge et or', icon: 'moon', match: { types: ['Darkness'], names: /Umbreon/ }, packs: ['expert'] },
  { id: 'dragon', name: 'Dragon', mood: 'Céleste', line: 'Indigo et écailles dorées', icon: 'crown', match: { types: ['Dragon'], names: /Rayquaza|Dragonite/ }, packs: ['legende'] },
  { id: 'glace', name: 'Glace', mood: 'Givre', line: 'Clair, net, bleu glacier', icon: 'snowflake', match: { names: /Glaceon|Articuno|Kyurem|Lapras/ }, packs: ['starter'] },
  { id: 'fee', name: 'Fée', mood: 'Féerie', line: 'Clair, rose poudré et lilas', icon: 'sparkles', match: { names: /Sylveon|Gardevoir|Clefairy|Togekiss/ }, packs: ['evoli'] },
];

export const themeById = (id) => THEMES.find((t) => t.id === id) || null;
