// Point d'entrée : habillage, routeur par ancre (#/chemin) et actions globales.

import { BRAND } from './config.js';
import { getState, isLoggedIn, logout, subscribe } from './store.js';
import { applyTheme, currentTheme, openThemeChooser, savedTheme } from './theme.js';
import { refreshCountdowns, startCountdowns } from './ui/countdown.js';
import { closeModal, toast } from './ui/modal.js';
import { startRealityCheck } from './ui/reality-check.js';
import { paintDailyDot, renderAccount, renderShell, setActiveNav } from './ui/shell.js';
import { openTopup } from './ui/topup.js';

import home from './views/home.js';
import packs from './views/packs.js';
import pack from './views/pack.js';
import opening from './views/opening.js';
import evolution from './views/evolution.js';
import collection from './views/collection.js';
import shipments from './views/shipments.js';
import giveaways from './views/giveaways.js';
import giveaway from './views/giveaway.js';
import rewards from './views/rewards.js';
import leaderboard from './views/leaderboard.js';
import wallet from './views/wallet.js';
import profile from './views/profile.js';
import settings from './views/settings.js';
import auth from './views/auth.js';
import cards from './views/cards.js';
import fairness from './views/fairness.js';
import admin from './views/admin.js';
import faq from './views/faq.js';
import transparency from './views/transparency.js';
import contact from './views/contact.js';
import legal from './views/legal.js';
import notFound from './views/not-found.js';

/**
 * Une vue : { title, nav?, auth?, immersive?, render(ctx) -> html, mount?(root, ctx) -> nettoyage }.
 * ctx : { path, params, query, navigate, rerender }.
 */
const ROUTES = [
  ['/', home],
  ['/packs', packs],
  ['/packs/:slug', pack],
  ['/ouverture', opening],
  ['/evolution', evolution],
  ['/cartes', cards],
  ['/collection', collection],
  ['/livraisons', shipments],
  ['/giveaways', giveaways],
  ['/giveaways/:id', giveaway],
  ['/recompenses', rewards],
  ['/classement', leaderboard],
  ['/solde', wallet],
  ['/profil', profile],
  ['/parametres', settings],
  ['/connexion', auth],
  ['/equite', fairness],
  ['/admin', admin],
  ['/admin/:tab', admin],
  ['/faq', faq],
  ['/transparence', transparency],
  ['/contact', contact],
  ['/legal/:doc', legal],
].map(([pattern, view]) => ({ parts: pattern.split('/').filter(Boolean), view }));

/** Anciennes adresses -> nouvelles. */
const MOVED = { '/pilotage': '/admin/pilotage' };

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  const path = `/${pathPart.split('/').filter(Boolean).join('/')}`;
  return { path, query: Object.fromEntries(new URLSearchParams(queryPart)) };
}

function match(path) {
  const segs = path.split('/').filter(Boolean);
  for (const { parts, view } of ROUTES) {
    if (parts.length !== segs.length) continue;
    const params = {};
    const ok = parts.every((part, i) => {
      if (part.startsWith(':')) {
        try {
          params[part.slice(1)] = decodeURIComponent(segs[i]);
        } catch {
          return false;
        }
        return true;
      }
      return part === segs[i];
    });
    if (ok) return { view, params };
  }
  return { view: notFound, params: {} };
}

export function navigate(to, { replace = false } = {}) {
  const target = `#${to}`;
  if (location.hash === target) {
    render();
    return;
  }
  if (replace) location.replace(target);
  else location.hash = target;
}

let cleanup = null;
let currentPath = null;

/** Sélecteur qui retrouve un élément après un nouveau rendu : son identifiant, ou son premier attribut data-. */
function focusKey(el) {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const attr = [...el.attributes].find((a) => a.name.startsWith('data-') && a.value !== '');
  return attr ? `${el.tagName.toLowerCase()}[${attr.name}="${CSS.escape(attr.value)}"]` : null;
}

/** Onglets et groupes de choix : les flèches passent d'un élément au suivant et l'activent. */
function onArrowKeys(e) {
  if (e.defaultPrevented || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
  const item = e.target.closest?.('button[role="tab"], button[role="radio"]');
  const group = item?.closest('[role="tablist"], [role="radiogroup"]');
  if (!group) return;
  const items = [...group.querySelectorAll('button[role="tab"], button[role="radio"]')].filter((el) => !el.disabled);
  const index = items.indexOf(item);
  const step = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
  const next = e.key === 'Home' ? items[0] : e.key === 'End' ? items[items.length - 1] : items[(index + step + items.length) % items.length];
  if (!next || next === item) return;
  e.preventDefault();
  const key = focusKey(next);
  next.click();
  // Le clic peut redessiner le groupe : on focalise l'élément tel qu'il existe après.
  (key && document.querySelector(key) ? document.querySelector(key) : next).focus({ preventScroll: true });
}

/** Tableaux défilants : atteignables au clavier, avec un nom pour les lecteurs d'écran. */
function labelTables() {
  document.querySelectorAll('.table-wrap:not([tabindex])').forEach((el) => {
    el.tabIndex = 0;
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', el.closest('section')?.querySelector('h1, h2')?.textContent.trim() || 'Tableau');
  });
}

function render({ keepScroll = false } = {}) {
  const { path, query } = parseHash();
  if (MOVED[path]) {
    navigate(MOVED[path], { replace: true });
    return;
  }
  const { view, params } = match(path);

  if (view.auth && !isLoggedIn()) {
    navigate(`/connexion?redirect=${encodeURIComponent(path)}`, { replace: true });
    return;
  }

  const main = document.getElementById('main');
  const shell = document.getElementById('shell');
  const scrollY = window.scrollY;
  // Page redessinée sur place : on retrouvera l'élément qui avait le focus (onglet, filtre…).
  const focused = path === currentPath && main.contains(document.activeElement) ? focusKey(document.activeElement) : null;

  try {
    cleanup?.();
  } catch (err) {
    console.error(err);
  }
  cleanup = null;
  closeNav();
  if (path !== currentPath) closeModal();

  const ctx = { path, params, query, navigate, rerender: () => render({ keepScroll: true }) };
  let html;
  try {
    html = view.render(ctx);
  } catch (err) {
    console.error(err);
    html = `<section class="empty"><h1>Oups</h1><p>Cette page n'a pas pu s'afficher.</p><a class="btn btn--primary" href="#/">Retour à l'accueil</a></section>`;
  }
  main.innerHTML = html;
  shell.classList.toggle('is-immersive', Boolean(view.immersive));
  const title = typeof view.title === 'function' ? view.title(ctx) : view.title;
  document.title = title ? `${title} — ${BRAND.name}` : `${BRAND.name} — Packs mystère (démo)`;
  setActiveNav(view.nav || '');
  refreshCountdowns(main);

  try {
    cleanup = view.mount?.(main, ctx) || null;
  } catch (err) {
    console.error(err);
  }

  if (focused) main.querySelector(focused)?.focus({ preventScroll: true });
  if (keepScroll && path === currentPath) window.scrollTo(0, scrollY);
  else {
    window.scrollTo(0, 0);
    if (currentPath !== null) main.focus({ preventScroll: true });
  }
  currentPath = path;
}

/* ------------------------------------------------------- actions globales */

/** Reflète les réglages d'affichage sur <html> pour que le CSS puisse en tenir compte. */
function applySettings({ settings }) {
  document.documentElement.dataset.motion = settings.motion ? 'on' : 'off';
}

const openNav = () => document.getElementById('shell')?.classList.add('is-nav-open');
const closeNav = () => document.getElementById('shell')?.classList.remove('is-nav-open');

const ACTIONS = {
  theme() {
    closeNav();
    // La page est redessinée ensuite : certaines illustrations suivent le thème.
    openThemeChooser().then(() => render({ keepScroll: true }));
  },
  'nav-open': openNav,
  'nav-close': closeNav,
  topup: () => openTopup(),
  logout() {
    logout();
    toast('Tu es déconnecté.', 'info');
    navigate('/');
  },
};

// Le navigateur refuse d'enregistrer (stockage plein, navigation privée) : on le dit une fois.
let storageWarned = false;
window.addEventListener('coffreo:storage-failed', () => {
  if (storageWarned) return;
  storageWarned = true;
  toast("Impossible d'enregistrer : tes dernières actions seront perdues au rechargement. Libère de la place dans le navigateur.", 'error');
});

function boot() {
  document.getElementById('app').innerHTML = renderShell();
  // Le lien d'évitement mène au contenu : son ancre ne doit pas être lue comme une route.
  document.querySelector('.skip-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('main')?.focus();
  });
  document.addEventListener('keydown', onArrowKeys);
  new MutationObserver(labelTables).observe(document.body, { childList: true, subtree: true });
  const account = document.getElementById('topbar-account');
  const paintAccount = () => {
    account.innerHTML = renderAccount();
    paintDailyDot();
  };
  paintAccount();
  subscribe(paintAccount);
  applySettings(getState());
  subscribe(applySettings);
  applyTheme(currentTheme().id);

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = ACTIONS[el.dataset.action];
    if (action) {
      e.preventDefault();
      action(el);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });
  // Recherche de la barre du haut : elle mène à la page Cartes.
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-search]');
    if (!form) return;
    e.preventDefault();
    const q = form.q.value.trim();
    form.q.blur();
    navigate(q ? `/cartes?q=${encodeURIComponent(q)}` : '/cartes');
  });
  // Quelques visuels manquent chez l'hébergeur d'images : on masque l'image cassée.
  document.addEventListener('error', (e) => e.target instanceof HTMLImageElement && e.target.classList.add('is-missing'), true);

  window.addEventListener('hashchange', () => render());
  startCountdowns();
  startRealityCheck();
  render();

  // Première visite sur cet appareil : on propose le choix du thème, une seule fois.
  if (!savedTheme()) openThemeChooser({ first: true }).then(() => render({ keepScroll: true }));
}

boot();
