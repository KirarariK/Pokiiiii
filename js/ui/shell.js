// Habillage commun : barre latérale, barre haute, pied de page, barre d'onglets mobile.

import { BRAND, DEMO, RULES } from '../config.js';
import { esc, eur, initials } from '../format.js';
import { icon } from '../icons.js';
import { getState, isLoggedIn } from '../store.js';

let markSeq = 0;

/** Logo : deux cartes inclinées et un éclat. */
export function logoMark(size = 30) {
  const id = `lm${++markSeq}`;
  return `<svg class="logo__mark" viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#ff9d2e"/></linearGradient></defs>
    <rect x="10.5" y="4.5" width="15" height="21" rx="3.2" transform="rotate(12 18 15)" fill="#8b6dff"/>
    <rect x="6.5" y="6" width="15" height="21" rx="3.2" transform="rotate(-10 14 16.5)" fill="url(#${id})"/>
    <path d="M13.2 10.4 14.9 14.9 19.4 16.6 14.9 18.3 13.2 22.8 11.5 18.3 7 16.6 11.5 14.9Z" fill="#1b1200" transform="rotate(-10 14 16.5)"/>
  </svg>`;
}

export const logo = (cls = '') =>
  `<a class="logo ${cls}" href="#/" aria-label="${esc(BRAND.name)} — accueil">${logoMark()}<span class="logo__word">${esc(BRAND.name)}</span></a>`;

const NAV_MAIN = [
  { key: 'home', href: '#/', label: 'Accueil', icon: 'house' },
  { key: 'packs', href: '#/packs', label: 'Packs mystère', icon: 'package' },
  { key: 'giveaways', href: '#/giveaways', label: 'Giveaways', icon: 'gift' },
  { key: 'collection', href: '#/collection', label: 'Collection', icon: 'archive' },
  { key: 'classement', href: '#/classement', label: 'Classement', icon: 'trophy' },
];

const NAV_ACCOUNT = [
  { key: 'solde', href: '#/solde', label: 'Solde', icon: 'wallet' },
  { key: 'profil', href: '#/profil', label: 'Profil', icon: 'user' },
  { key: 'parametres', href: '#/parametres', label: 'Paramètres', icon: 'user-cog' },
];

const navLink = (item, cls) =>
  `<a class="${cls}" href="${item.href}" data-nav="${item.key}">${icon(item.icon)}<span>${item.label}</span></a>`;

export function renderShell() {
  return `
  <div class="app" id="shell">
    <aside class="sidebar" id="sidebar" aria-label="Navigation principale">
      <div class="sidebar__head">
        ${logo()}
        <button class="btn btn--icon btn--ghost sidebar__close" type="button" data-action="nav-close" aria-label="Fermer le menu">${icon('x')}</button>
      </div>
      <nav class="sidebar__nav">
        <p class="nav-label">Principal</p>
        ${NAV_MAIN.map((i) => navLink(i, 'nav-item')).join('')}
        <p class="nav-label">Compte</p>
        ${NAV_ACCOUNT.map((i) => navLink(i, 'nav-item')).join('')}
      </nav>
      <div class="sidebar__foot">
        <button class="nav-item nav-item--plain" type="button" data-action="theme">
          <span class="theme-ico theme-ico--dark">${icon('sun')}</span><span class="theme-ico theme-ico--light">${icon('moon')}</span>
          <span class="theme-label theme-label--dark">Mode clair</span><span class="theme-label theme-label--light">Mode sombre</span>
        </button>
        <span class="nav-item nav-item--plain nav-item--static">${icon('globe')}<span>Français</span></span>
      </div>
    </aside>
    <button class="app__backdrop" type="button" data-action="nav-close" aria-label="Fermer le menu" tabindex="-1"></button>

    <div class="app__col">
      ${DEMO ? `<div class="demo-bar" role="note">${icon('info', { size: 15 })}<span><strong>Version de démonstration</strong> · crédits fictifs, aucun paiement réel, aucune carte expédiée · ${RULES.minAge}+</span></div>` : ''}
      <header class="topbar">
        <button class="btn btn--icon btn--ghost topbar__menu" type="button" data-action="nav-open" aria-label="Ouvrir le menu" aria-controls="sidebar">${icon('menu')}</button>
        ${logo('logo--topbar')}
        <span class="topbar__spacer"></span>
        <div class="topbar__account" id="topbar-account"></div>
      </header>
      <main id="main" class="view" tabindex="-1"></main>
      ${renderFooter()}
    </div>

    <nav class="tabbar" aria-label="Navigation rapide">
      ${NAV_MAIN.map((i) => navLink({ ...i, label: i.key === 'packs' ? 'Packs' : i.label }, 'tabbar__item')).join('')}
    </nav>
  </div>`;
}

function renderFooter() {
  const year = new Date().getFullYear();
  return `
  <footer class="footer">
    <div class="footer__grid">
      <div class="footer__brand">
        ${logo()}
        <p>${esc(BRAND.baseline)}<br>Une vraie carte dans chaque pack : à garder au coffre, à recevoir chez toi ou à revendre.</p>
      </div>
      <div>
        <h3 class="footer__title">Navigation</h3>
        <a href="#/packs">Packs mystère</a>
        <a href="#/giveaways">Giveaways</a>
        <a href="#/collection">Collection</a>
        <a href="#/classement">Classement</a>
        <a href="#/faq">FAQ</a>
        <a href="#/transparence">Transparence et jeu responsable</a>
        <a href="#/contact">Contact</a>
      </div>
      <div>
        <h3 class="footer__title">Légal</h3>
        <a href="#/legal/cgv">Conditions générales de vente</a>
        <a href="#/legal/cgu">Conditions d'utilisation</a>
        <a href="#/legal/confidentialite">Politique de confidentialité</a>
        <a href="#/legal/mentions">Mentions légales</a>
      </div>
      <div>
        <h3 class="footer__title">Contact</h3>
        <a href="mailto:${esc(BRAND.email)}">${esc(BRAND.email)}</a>
        <span>${esc(BRAND.company)}</span>
        <span>${esc(BRAND.address)}</span>
      </div>
    </div>
    <div class="footer__legal">
      <p><span class="age-pill">${RULES.minAge}+</span> Réservé aux personnes majeures. Jouer comporte des risques : endettement, isolement, dépendance. Pour être aidé, appelez le 09 74 75 13 13 (Joueurs Info Service, appel non surtaxé).</p>
      <p>Site de démonstration, non affilié à Nintendo, Creatures Inc., GAME FREAK inc. ni The Pokémon Company. Pokémon et les noms des cartes sont des marques de leurs propriétaires respectifs. Visuels de cartes : pokemontcg.io. Cotes indicatives.</p>
      <p>© ${year} ${esc(BRAND.name)}</p>
    </div>
  </footer>`;
}

/** Zone compte de la barre haute : solde et avatar, ou boutons de connexion. */
export function renderAccount() {
  if (!isLoggedIn()) {
    return `<a class="btn btn--ghost" href="#/connexion">Connexion</a>
            <a class="btn btn--primary" href="#/connexion?mode=inscription">Inscription</a>`;
  }
  const { user, balance } = getState();
  return `<a class="balance" href="#/solde" title="Mon solde">${icon('wallet', { size: 18 })}<strong>${eur(balance)}</strong></a>
          <button class="btn btn--primary btn--sm topbar__topup" type="button" data-action="topup">${icon('plus', { size: 16 })}<span>Recharger</span></button>
          <a class="avatar" href="#/profil" title="${esc(user.pseudo)}" aria-label="Mon profil">${esc(initials(user.pseudo))}</a>`;
}

/** Surligne l'entrée de navigation correspondant à la page courante. */
export function setActiveNav(key) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    const active = a.dataset.nav === key;
    a.classList.toggle('is-active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}
