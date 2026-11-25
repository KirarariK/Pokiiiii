// Habillage commun : barre latérale, barre haute, pied de page, barre d'onglets mobile.

import { BRAND, DEMO, RULES } from '../config.js';
import { esc, eur, initials, num } from '../format.js';
import { icon } from '../icons.js';
import { badgeProgress, cashbackAvailable, getState, isLoggedIn } from '../store.js';
import { currentTheme } from '../theme.js';

/** Logo : deux cartes inclinées et un éclat, aux couleurs du thème. */
export function logoMark(size = 30) {
  return `<svg class="logo__mark" viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">
    <rect class="logo__back" x="10.5" y="4.5" width="15" height="21" rx="3.2" transform="rotate(12 18 15)"/>
    <rect class="logo__front" x="6.5" y="6" width="15" height="21" rx="3.2" transform="rotate(-10 14 16.5)"/>
    <path class="logo__spark" d="M13.2 10.4 14.9 14.9 19.4 16.6 14.9 18.3 13.2 22.8 11.5 18.3 7 16.6 11.5 14.9Z" transform="rotate(-10 14 16.5)"/>
  </svg>`;
}

export const logo = (cls = '') =>
  `<a class="logo ${cls}" href="#/" aria-label="${esc(BRAND.name)} — accueil">${logoMark()}<span class="logo__word">${esc(BRAND.name)}</span></a>`;

const NAV_MAIN = [
  { key: 'home', href: '#/', label: 'Accueil', icon: 'house' },
  { key: 'packs', href: '#/packs', label: 'Packs mystère', icon: 'package' },
  { key: 'evolution', href: '#/evolution', label: 'Évolution', icon: 'chevrons-up' },
  { key: 'cartes', href: '#/cartes', label: 'Cartes', icon: 'library' },
  { key: 'collection', href: '#/collection', label: 'Collection', icon: 'archive' },
  { key: 'giveaways', href: '#/giveaways', label: 'Giveaways', icon: 'gift' },
  { key: 'recompenses', href: '#/recompenses', label: 'Récompenses', icon: 'hand-coins', dot: true },
  { key: 'classement', href: '#/classement', label: 'Classement', icon: 'trophy' },
];

const NAV_ACCOUNT = [
  { key: 'solde', href: '#/solde', label: 'Solde', icon: 'wallet' },
  { key: 'profil', href: '#/profil', label: 'Profil', icon: 'user' },
  { key: 'parametres', href: '#/parametres', label: 'Paramètres', icon: 'user-cog' },
];

/** Onglets de la barre mobile : les cinq destinations les plus utiles. */
const TABBAR = ['home', 'packs', 'evolution', 'collection', 'recompenses'];
const SHORT = { packs: 'Packs', recompenses: 'Bonus' };

const navLink = (item, cls, label = item.label) =>
  `<a class="${cls}" href="${item.href}" data-nav="${item.key}">${icon(item.icon)}<span>${label}</span>${item.dot ? '<i class="nav-dot" data-daily-dot hidden></i>' : ''}</a>`;

export function renderShell() {
  return `
  <div class="app" id="shell">
    <aside class="sidebar" id="sidebar" aria-label="Navigation principale">
      <div class="sidebar__head">
        ${logo()}
        <button class="btn btn--icon btn--ghost sidebar__close" type="button" data-action="nav-close" aria-label="Fermer le menu">${icon('x')}</button>
      </div>
      <nav class="sidebar__nav">
        <p class="nav-label">Jouer</p>
        ${NAV_MAIN.map((i) => navLink(i, 'nav-item')).join('')}
        <p class="nav-label">Compte</p>
        ${NAV_ACCOUNT.map((i) => navLink(i, 'nav-item')).join('')}
      </nav>
      <div class="sidebar__foot">
        <a class="nav-item nav-item--plain" href="#/equite" data-nav="equite">${icon('shield-check')}<span>Équité prouvable</span></a>
        <button class="nav-item nav-item--plain" type="button" data-action="theme">${icon('palette')}<span>Thème : <strong data-theme-name>${esc(currentTheme().name)}</strong></span></button>
      </div>
    </aside>
    <button class="app__backdrop" type="button" data-action="nav-close" aria-label="Fermer le menu" tabindex="-1"></button>

    <div class="app__col">
      ${DEMO ? `<div class="demo-bar" role="note">${icon('info', { size: 15 })}<span><strong>Version de démonstration</strong> · crédits fictifs, aucun paiement réel, aucune carte expédiée · ${RULES.minAge}+</span></div>` : ''}
      <header class="topbar">
        <button class="btn btn--icon btn--ghost topbar__menu" type="button" data-action="nav-open" aria-label="Ouvrir le menu" aria-controls="sidebar">${icon('menu')}</button>
        ${logo('logo--topbar')}
        <form class="topbar__search" role="search" data-search>
          ${icon('search', { size: 17 })}
          <input type="search" name="q" placeholder="Rechercher une carte" aria-label="Rechercher une carte" autocomplete="off">
        </form>
        <span class="topbar__spacer"></span>
        <div class="topbar__account" id="topbar-account"></div>
      </header>
      <main id="main" class="view" tabindex="-1"></main>
      ${renderFooter()}
    </div>

    <nav class="tabbar" aria-label="Navigation rapide">
      ${TABBAR.map((key) => NAV_MAIN.find((i) => i.key === key)).map((i) => navLink(i, 'tabbar__item', SHORT[i.key] || i.label)).join('')}
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
        <h3 class="footer__title">Jouer</h3>
        <a href="#/packs">Packs mystère</a>
        <a href="#/evolution">Évolution</a>
        <a href="#/cartes">Cartes</a>
        <a href="#/giveaways">Giveaways</a>
        <a href="#/recompenses">Cashback et badges</a>
        <a href="#/classement">Classement</a>
      </div>
      <div>
        <h3 class="footer__title">Confiance</h3>
        <a href="#/equite">Équité prouvable</a>
        <a href="#/transparence">Transparence et jeu responsable</a>
        <a href="#/faq">FAQ</a>
        <a href="#/contact">Contact</a>
        <a href="#/admin">Espace admin</a>
      </div>
      <div>
        <h3 class="footer__title">Légal</h3>
        <a href="#/legal/cgv">Conditions générales de vente</a>
        <a href="#/legal/cgu">Conditions d'utilisation</a>
        <a href="#/legal/confidentialite">Politique de confidentialité</a>
        <a href="#/legal/mentions">Mentions légales</a>
      </div>
    </div>
    <div class="footer__legal">
      <p><span class="age-pill">${RULES.minAge}+</span> Réservé aux personnes majeures. Jouer comporte des risques : endettement, isolement, dépendance. Pour être aidé, appelez le 09 74 75 13 13 (Joueurs Info Service, appel non surtaxé).</p>
      <p>Site de démonstration, non affilié à Nintendo, Creatures Inc., GAME FREAK inc. ni The Pokémon Company. Pokémon et les noms des cartes sont des marques de leurs propriétaires respectifs. Visuels de cartes : pokemontcg.io. Cotes indicatives.</p>
      <p>© ${year} ${esc(BRAND.name)} · ${esc(BRAND.company)} · <a href="mailto:${esc(BRAND.email)}">${esc(BRAND.email)}</a></p>
    </div>
  </footer>`;
}

/** Zone compte de la barre haute : badge, solde et avatar, ou boutons de connexion. */
export function renderAccount() {
  if (!isLoggedIn()) {
    return `<a class="btn btn--ghost" href="#/connexion">Connexion</a>
            <a class="btn btn--primary" href="#/connexion?mode=inscription">Inscription</a>`;
  }
  const { user, balance, xp } = getState();
  const { current, next, ratio } = badgeProgress();
  return `<a class="xp" href="#/recompenses" data-theme="${current.theme}" title="${esc(current.name)} · ${num(Math.floor(xp))} XP${next ? ` · prochain badge à ${num(next.xp)} XP` : ''}" aria-label="${esc(current.name)}, ${num(Math.floor(xp))} XP">
            <span class="xp__ring" style="--p:${Math.round(ratio * 100)}">${icon(current.icon, { size: 16 })}</span>
          </a>
          <a class="balance" href="#/solde" title="Mon solde">${icon('wallet', { size: 18 })}<strong>${eur(balance)}</strong></a>
          <button class="btn btn--primary btn--sm topbar__topup" type="button" data-action="topup">${icon('plus', { size: 16 })}<span>Recharger</span></button>
          <a class="avatar" href="#/profil" title="${esc(user.pseudo)}" aria-label="Mon profil">${esc(initials(user.pseudo))}</a>`;
}

/** Pastille « cashback à encaisser » dans la navigation. */
export function paintDailyDot() {
  const show = isLoggedIn() && cashbackAvailable();
  document.querySelectorAll('[data-daily-dot]').forEach((el) => {
    el.hidden = !show;
  });
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
