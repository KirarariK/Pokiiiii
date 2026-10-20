/** Icônes SVG exclusives Pokiiiii — aucun emoji */
const S = (body, view = '0 0 24 24') =>
  `<svg class="ico" viewBox="${view}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICO = {
  logo: S(
    `<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>`,
  ),
  swords: S(`<path d="M4 20L14 10M10 14L20 4M14 4h6v6M4 14v6h6"/>`),
  cube: S(`<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 21V12M12 12L4 7.5M12 12l8-4.5"/>`),
  map: S(`<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><path d="M9 3v15M15 6v15"/>`),
  shop: S(`<path d="M4 9h16l-1 11H5L4 9z"/><path d="M8 9V7a4 4 0 018 0v2"/>`),
  pass: S(`<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M8 14h4"/>`),
  hub: S(`<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>`),
  quest: S(`<path d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M14 3v4h4M9 13h6M9 17h4"/>`),
  profile: S(`<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5"/>`),
  dex: S(`<path d="M5 4h9a2 2 0 012 2v14l-4-2-4 2V6a2 2 0 00-2-2H5z"/><path d="M8 8h5M8 12h5"/>`),
  bolt: S(`<path d="M13 2L4 14h7l-1 8 10-14h-7l1-6z"/>`),
  summon: S(`<path d="M12 3l2.2 4.5L19 8.2l-3.5 3.4.8 4.9L12 14.2 7.7 16.5l.8-4.9L5 8.2l4.8-.7L12 3z"/><circle cx="12" cy="12" r="9" opacity=".35"/>`),
  dice: S(`<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none"/>`),
  badge: S(`<circle cx="12" cy="10" r="5"/><path d="M9 14l-2 7 5-3 5 3-2-7"/>`),
  crown: S(`<path d="M3 17h18l-1.5-9-4.5 4L12 5l-3 7-4.5-4L3 17z"/><path d="M5 17h14v2H5z"/>`),
  trophy: S(`<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M7 6H5a2 2 0 000 4h2M17 6h2a2 2 0 010 4h-2"/>`),
  users: S(`<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c1-3 3.5-4.5 6-4.5S14 16 15 19M14 14.5c1.5.2 3 1.2 4 3.5"/>`),
  help: S(`<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 114 2c-.7.5-1.5 1-1.5 2.5"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>`),
  chat: S(`<path d="M5 5h14a2 2 0 012 2v8a2 2 0 01-2 2H9l-4 3v-3H5a2 2 0 01-2-2V7a2 2 0 012-2z"/>`),
  logout: S(`<path d="M10 4H6a2 2 0 00-2 2v12a2 2 0 002 2h4"/><path d="M15 16l4-4-4-4M10 12h9"/>`),
  coin: S(`<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5c.6-1 1.5-1.5 2.5-1.5s2 .7 2 2-1 2-2.5 2.5-2.5.8-2.5 2.2 1.1 2.3 2.5 2.3 2-.6 2.5-1.6"/>`),
  team: S(`<circle cx="8" cy="9" r="2.8"/><circle cx="16" cy="9" r="2.8"/><path d="M3.5 19c.8-2.8 2.8-4 4.5-4s3.7 1.2 4.5 4M11.5 19c.8-2.8 2.8-4 4.5-4s3.7 1.2 4.5 4"/>`),
  pin: S(`<path d="M12 21s6-5.2 6-10a6 6 0 10-12 0c0 4.8 6 10 6 10z"/><circle cx="12" cy="11" r="2.2"/>`),
  close: S(`<path d="M6 6l12 12M18 6L6 18"/>`),
  heal: S(`<path d="M12 4v16M4 12h16"/><rect x="8" y="3" width="8" height="4" rx="1"/><rect x="3" y="8" width="4" height="8" rx="1"/><rect x="17" y="8" width="4" height="8" rx="1"/><rect x="8" y="17" width="8" height="4" rx="1"/>`),
  ball: S(
    `<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><circle cx="12" cy="12" r="2.6"/>`,
  ),
  greatball: S(
    `<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M7 8h2M15 8h2"/><circle cx="12" cy="12" r="2.6"/>`,
  ),
  ultraball: S(
    `<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M8 7l2 2M16 7l-2 2"/><circle cx="12" cy="12" r="2.6"/>`,
  ),
  masterball: S(
    `<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M9 7l3 3 3-3"/><circle cx="12" cy="12" r="2.6"/>`,
  ),
  check: S(`<path d="M5 12l5 5L20 7"/>`),
  gift: S(`<rect x="4" y="10" width="16" height="10" rx="1"/><path d="M12 10v10M4 14h16M12 10c-2-3-5-3-5-1s2 2 5 1c3 1 5 0 5-1s-3 0-5 1z"/>`),
  flame: S(`<path d="M12 3c2 4-2 5-2 8a4 4 0 008 0c0-4-3-5-2-8 3 2 6 5 6 9a8 8 0 11-16 0c0-3 2-6 6-9z"/>`),
  box: S(`<path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M3 8v8l9 4 9-4V8M12 12v8"/>`),
  settings: S(
    `<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>`,
  ),
  lang: S(`<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>`),
  volume: S(
    `<path d="M4 10v4h3l5 4V6L7 10H4z"/><path d="M16 9a4 4 0 010 6M18.5 7a7 7 0 010 10"/>`,
  ),
  mute: S(
    `<path d="M4 10v4h3l5 4V6L7 10H4z"/><path d="M17 9l5 5M22 9l-5 5"/>`,
  ),
  sparkle: S(
    `<path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/>`,
  ),
  compass: S(
    `<circle cx="12" cy="12" r="9"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/><path d="M14.5 9.5L10 14l-2.5-.5L12 8.5l2.5 1z" fill="currentColor" fill-opacity=".35"/><path d="M9.5 14.5L14 10l2.5.5L12 15.5l-2.5-1z"/>`,
  ),
  egg: S(
    `<path d="M12 3c4.5 0 8 5.2 8 10.5S15.5 21 12 21 4 18.8 4 13.5 7.5 3 12 3z"/><path d="M9 11c.4-.8 1-.8 1.4 0M13.5 9.5c.35-.7.9-.7 1.25 0M11 15c.3-.55.75-.55 1.05 0"/>`,
  ),
  clock: S(`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>`),
};

export function icon(name, cls = '') {
  const raw = ICO[name] || ICO.help;
  return cls ? raw.replace('class="ico"', `class="ico ${cls}"`) : raw;
}
