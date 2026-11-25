// Point d'entrée : habillage, routeur par ancre (#/chemin) et actions globales.

import { BRAND } from './config.js';
import { getState, isLoggedIn, logout, setSetting, subscribe } from './store.js';
import { refreshCountdowns, startCountdowns } from './ui/countdown.js';
import { closeModal, toast } from './ui/modal.js';
import { renderAccount, renderShell, setActiveNav } from './ui/shell.js';
import { openTopup } from './ui/topup.js';

import home from './views/home.js';
import packs from './views/packs.js';
import pack from './views/pack.js';
import opening from './views/opening.js';
import collection from './views/collection.js';
import shipments from './views/shipments.js';
import giveaways from './views/giveaways.js';
import giveaway from './views/giveaway.js';
import leaderboard from './views/leaderboard.js';
import wallet from './views/wallet.js';
import profile from './views/profile.js';
import settings from './views/settings.js';
import auth from './views/auth.js';
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
  ['/collection', collection],
  ['/livraisons', shipments],
  ['/giveaways', giveaways],
  ['/giveaways/:id', giveaway],
  ['/classement', leaderboard],
  ['/solde', wallet],
  ['/profil', profile],
  ['/parametres', settings],
  ['/connexion', auth],
  ['/faq', faq],
  ['/transparence', transparency],
  ['/contact', contact],
  ['/legal/:doc', legal],
].map(([pattern, view]) => ({ parts: pattern.split('/').filter(Boolean), view }));

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

function render({ keepScroll = false } = {}) {
  const { path, query } = parseHash();
  const { view, params } = match(path);

  if (view.auth && !isLoggedIn()) {
    navigate(`/connexion?redirect=${encodeURIComponent(path)}`, { replace: true });
    return;
  }

  const main = document.getElementById('main');
  const shell = document.getElementById('shell');
  const scrollY = window.scrollY;

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

  if (keepScroll && path === currentPath) window.scrollTo(0, scrollY);
  else {
    window.scrollTo(0, 0);
    if (currentPath !== null) main.focus({ preventScroll: true });
  }
  currentPath = path;
}

/* ------------------------------------------------------- actions globales */

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f4f5fb' : '#0a0c14');
}

/** Reflète les réglages d'affichage sur <html> pour que le CSS puisse en tenir compte. */
function applySettings({ settings }) {
  applyTheme(settings.theme);
  document.documentElement.dataset.motion = settings.motion ? 'on' : 'off';
}

const openNav = () => document.getElementById('shell')?.classList.add('is-nav-open');
const closeNav = () => document.getElementById('shell')?.classList.remove('is-nav-open');

const ACTIONS = {
  theme() {
    setSetting('theme', getState().settings.theme === 'dark' ? 'light' : 'dark');
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

function boot() {
  document.getElementById('app').innerHTML = renderShell();
  const account = document.getElementById('topbar-account');
  const paintAccount = () => {
    account.innerHTML = renderAccount();
  };
  paintAccount();
  subscribe(paintAccount);
  applySettings(getState());
  subscribe(applySettings);

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

  window.addEventListener('hashchange', () => render());
  startCountdowns();
  render();
}

boot();
