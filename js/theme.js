// Thème visuel : application, mémorisation, suggestion et écran de choix.
//
// Le choix est proposé une seule fois, à la toute première visite, que le
// visiteur ait un compte ou non. Il est gardé sur l'appareil, indépendamment du
// compte démo, et reste modifiable depuis le menu ou les paramètres.

import { CARDS } from './catalog.js';
import { MARK_PATH } from './ui/logo-mark.js';
import { DEFAULT_THEME, LIGHT_DEFAULT, THEME_KEY, THEMES, themeById } from './data/themes.js';
import { RULES } from './config.js';
import { esc } from './format.js';
import { icon } from './icons.js';
import { cardImage } from './ui/card.js';

/** Thème déjà choisi sur cet appareil, ou null s'il n'y en a pas encore. */
export function savedTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem(THEME_KEY) || 'null');
    return saved && themeById(saved.id) ? saved.id : null;
  } catch {
    return null;
  }
}

export const currentTheme = () => themeById(document.documentElement.dataset.theme) || themeById(DEFAULT_THEME);

/** Icône d'onglet aux couleurs du thème : la marque sur un carré arrondi. */
function favicon(v) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${v('--primary')}"/><stop offset="1" stop-color="${v('--primary-2')}"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="${v('--stage-b')}"/><path fill="url(#g)" fill-rule="evenodd" d="${MARK_PATH}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Applique un thème à la page (sans le mémoriser). */
export function applyTheme(id) {
  const theme = themeById(id) || themeById(DEFAULT_THEME);
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  const css = getComputedStyle(root);
  const v = (name) => css.getPropertyValue(name).trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', v('--bg'));
  document.querySelector('link[rel="icon"]')?.setAttribute('href', favicon(v));
  document.querySelectorAll('[data-theme-name]').forEach((el) => {
    el.textContent = theme.name;
  });
  return theme;
}

/** Mémorise le thème sur l'appareil : l'écran de choix ne sera plus proposé. */
export function saveTheme(id) {
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify({ id, at: Date.now() }));
  } catch {
    // Stockage indisponible : le thème vaudra pour cette visite seulement.
  }
  document.documentElement.removeAttribute('data-theme-pending');
}

/**
 * Thème mis en avant à la première visite :
 * 1. celui du pack par lequel le visiteur arrive (lien partagé, publicité) ;
 * 2. un thème clair si son système est réglé en clair ;
 * 3. le thème par défaut.
 */
export function suggestTheme() {
  const slug = location.hash.match(/^#\/(?:packs|giveaways)\/([a-z]+)/)?.[1];
  const byPack = slug && THEMES.find((t) => t.packs.includes(slug));
  if (byPack) return byPack.id;
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return LIGHT_DEFAULT;
  return DEFAULT_THEME;
}

const signatures = new Map();

/** Carte du catalogue qui illustre un thème : la plus cotée parmi celles qui lui correspondent. */
export function signatureCard(theme) {
  if (signatures.has(theme.id)) return signatures.get(theme.id);
  const { types, names } = theme.match;
  const ofType = (c) => !types || types.includes(c.type);
  const card = CARDS.find((c) => ofType(c) && names?.test(c.nameEn)) || CARDS.find((c) => (types ? ofType(c) : names?.test(c.nameEn))) || CARDS[0];
  signatures.set(theme.id, card);
  return card;
}

/**
 * Vignette d'un thème. L'attribut data-theme lui fait porter ses propres
 * couleurs : l'aperçu est fidèle quel que soit le thème de la page.
 */
export function themeCard(theme, { selected = false, suggested = false } = {}) {
  return `<button class="theme-card" type="button" role="radio" aria-checked="${selected}" tabindex="${selected ? 0 : -1}" data-theme="${theme.id}" data-theme-pick="${theme.id}">
    <span class="theme-card__scene">
      <span class="theme-card__img">${cardImage(signatureCard(theme))}</span>
      <span class="theme-card__ui" aria-hidden="true"><i></i><i></i><b></b></span>
      ${suggested ? '<span class="theme-card__tag">Suggéré</span>' : ''}
      <span class="theme-card__check" aria-hidden="true">${icon('check', { size: 16 })}</span>
    </span>
    <span class="theme-card__label">
      <span class="theme-card__ico">${icon(theme.icon, { size: 20 })}</span>
      <span><strong>${esc(theme.name)}</strong><small>${esc(theme.mood)} · ${esc(theme.line)}</small></span>
    </span>
  </button>`;
}

/** Branche la sélection au clavier (flèches) et à la souris sur une grille de vignettes. */
export function wireThemeGrid(grid, { onPreview, onSelect }) {
  const cards = () => [...grid.querySelectorAll('[data-theme-pick]')];
  const mark = (id) => {
    cards().forEach((c) => {
      const on = c.dataset.themePick === id;
      c.setAttribute('aria-checked', String(on));
      c.tabIndex = on ? 0 : -1;
    });
  };
  const onClick = (e) => {
    const card = e.target.closest('[data-theme-pick]');
    if (!card) return;
    mark(card.dataset.themePick);
    onSelect(card.dataset.themePick);
  };
  const onKey = (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    const list = cards();
    const from = list.indexOf(document.activeElement);
    if (from === -1) return;
    e.preventDefault();
    const next = list[(from + step + list.length) % list.length];
    next.focus();
    next.click();
  };
  // Survol à la souris : aperçu immédiat, sans changer la sélection.
  const onOver = (e) => {
    if (e.pointerType !== 'mouse') return;
    const card = e.target.closest('[data-theme-pick]');
    if (card) onPreview?.(card.dataset.themePick);
  };
  const onLeave = (e) => {
    if (e.pointerType === 'mouse') onPreview?.(null);
  };
  grid.addEventListener('click', onClick);
  grid.addEventListener('keydown', onKey);
  grid.addEventListener('pointerover', onOver);
  grid.addEventListener('pointerleave', onLeave);
  return { mark };
}

let open = false;

/**
 * Écran de choix du thème.
 * @param {{ first?: boolean }} [opts]  first : première visite (pas d'annulation possible, on entre sur le site)
 * @returns {Promise<string>} identifiant du thème retenu
 */
export function openThemeChooser({ first = false } = {}) {
  if (open) return Promise.resolve(currentTheme().id);
  open = true;
  const original = currentTheme().id;
  const suggestion = first ? suggestTheme() : null;
  let selected = first ? suggestion : original;
  const previousFocus = document.activeElement;

  const host = document.getElementById('overlays');
  const el = document.createElement('div');
  el.className = 'chooser';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'chooser-title');
  el.innerHTML = `
    <div class="chooser__panel">
      <header class="chooser__head">
        <p class="eyebrow">${icon('palette', { size: 15 })}${first ? 'Bienvenue' : 'Apparence'}</p>
        <h2 id="chooser-title">${first ? 'Choisis ton univers' : 'Changer de thème'}</h2>
        <p class="muted">Neuf ambiances, une par type : essaie-les. ${first ? 'Ton choix est gardé sur cet appareil et tu pourras en changer quand tu veux.' : 'Ton choix est gardé sur cet appareil.'}</p>
      </header>
      <div class="chooser__grid" role="radiogroup" aria-label="Thèmes">
        ${THEMES.map((t) => themeCard(t, { selected: t.id === selected, suggested: t.id === suggestion })).join('')}
      </div>
      <footer class="chooser__foot">
        ${first ? `<p class="small"><span class="age-pill">${RULES.minAge}+</span><strong>Réservé aux majeurs.</strong> En entrant, tu confirmes avoir ${RULES.minAge} ans ou plus.</p>` : `<button class="btn btn--secondary btn--lg" type="button" data-chooser-cancel>Annuler</button>`}
        <button class="btn btn--primary btn--lg" type="button" data-chooser-confirm>${first ? 'Entrer avec le thème' : 'Garder le thème'} <span data-chooser-name></span>${icon('arrow-right', { size: 18 })}</button>
      </footer>
    </div>`;

  return new Promise((resolve) => {
    const nameEl = el.querySelector('[data-chooser-name]');
    const paint = (id) => {
      applyTheme(id);
      nameEl.textContent = themeById(selected).name;
    };
    const close = (keep) => {
      const result = keep ? selected : original;
      if (keep) saveTheme(result);
      applyTheme(result);
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('has-modal');
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 220);
      open = false;
      if (previousFocus instanceof HTMLElement && document.contains(previousFocus)) previousFocus.focus({ preventScroll: true });
      resolve(result);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // À la première visite, entrer vaut déclaration de majorité : il faut le bouton, pas Échap.
        if (!first) close(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const items = [...el.querySelectorAll('button:not([tabindex="-1"])')];
      const firstItem = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        firstItem.focus();
      }
    };

    wireThemeGrid(el.querySelector('.chooser__grid'), {
      onPreview: (id) => paint(id || selected),
      onSelect: (id) => {
        selected = id;
        paint(id);
      },
    });
    el.querySelector('[data-chooser-confirm]').addEventListener('click', () => close(true));
    el.querySelector('[data-chooser-cancel]')?.addEventListener('click', () => close(false));
    document.addEventListener('keydown', onKey);

    host.appendChild(el);
    document.documentElement.classList.add('has-modal');
    paint(selected);
    el.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true });
  });
}
