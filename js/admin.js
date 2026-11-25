// Accès administrateur.
//
// Démonstration : il n'y a pas de serveur, l'accès est donc propre à
// l'appareil. Le mot de passe est choisi à la première visite, gardé sous
// forme d'empreinte salée, et la session se ferme avec l'onglet. Cela écarte
// un visiteur curieux, pas un attaquant : en production, l'authentification
// et les droits se vérifient côté serveur.

import { ADMIN_KEY } from './config.js';
import { sha256Hex } from './fair.js';

const SESSION_KEY = `${ADMIN_KEY}.session`;
export const MIN_PASSWORD = 8;

function read() {
  try {
    const data = JSON.parse(localStorage.getItem(ADMIN_KEY));
    return data && data.salt && data.hash ? data : null;
  } catch {
    return null;
  }
}

const digest = (salt, user, password) => sha256Hex(`${salt}:${user.trim().toLowerCase()}:${password}`);

function openSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // Pas de stockage de session : l'accès ne tiendra que le temps de la page.
  }
  session = true;
}

let session = false;
try {
  session = sessionStorage.getItem(SESSION_KEY) === '1';
} catch {
  session = false;
}

/** Un accès administrateur a-t-il déjà été créé sur cet appareil ? */
export const adminConfigured = () => Boolean(read());

export const isAdmin = () => session && adminConfigured();

/** Identifiant de l'administrateur de cet appareil. */
export const adminUser = () => read()?.user || '';

/** Première visite : crée l'accès. */
export function setupAdmin(user, password) {
  if (adminConfigured()) return { ok: false, message: 'Un accès existe déjà sur cet appareil.' };
  const name = String(user || '').trim();
  if (name.length < 3) return { ok: false, message: 'Identifiant : 3 caractères au moins.' };
  if (String(password || '').length < MIN_PASSWORD) return { ok: false, message: `Mot de passe : ${MIN_PASSWORD} caractères au moins.` };
  const salt = sha256Hex(`${Date.now()}:${Math.random()}:${name}`).slice(0, 24);
  try {
    localStorage.setItem(ADMIN_KEY, JSON.stringify({ user: name, salt, hash: digest(salt, name, password) }));
  } catch {
    return { ok: false, message: "Le navigateur refuse d'enregistrer l'accès (navigation privée ?)." };
  }
  openSession();
  return { ok: true };
}

export function loginAdmin(user, password) {
  const data = read();
  if (!data) return { ok: false, message: "Aucun accès n'a été créé sur cet appareil." };
  if (digest(data.salt, String(user || ''), String(password || '')) !== data.hash) return { ok: false, message: 'Identifiant ou mot de passe incorrect.' };
  openSession();
  return { ok: true };
}

export function logoutAdmin() {
  session = false;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // rien à fermer
  }
}
