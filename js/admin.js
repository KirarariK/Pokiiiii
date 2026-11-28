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

/** Tours de hachage : ralentissent d'autant une attaque par essais répétés sur l'empreinte. */
const ROUNDS = 6000;

/** Empreinte salée et étirée ; `rounds` vaut 1 pour les accès créés avant l'étirement. */
function digest(salt, user, password, rounds = ROUNDS) {
  let h = sha256Hex(`${salt}:${user.trim().toLowerCase()}:${password}`);
  for (let i = 1; i < rounds; i++) h = sha256Hex(`${h}:${salt}`);
  return h;
}

/** Sel aléatoire de 24 caractères hexadécimaux, tiré du générateur cryptographique. */
function newSalt() {
  const buf = new Uint8Array(12);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}

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
  const salt = newSalt();
  try {
    localStorage.setItem(ADMIN_KEY, JSON.stringify({ user: name, salt, rounds: ROUNDS, hash: digest(salt, name, password) }));
  } catch {
    return { ok: false, message: "Le navigateur refuse d'enregistrer l'accès (navigation privée ?)." };
  }
  openSession();
  return { ok: true };
}

export function loginAdmin(user, password) {
  const data = read();
  if (!data) return { ok: false, message: "Aucun accès n'a été créé sur cet appareil." };
  const rounds = Number.isInteger(data.rounds) && data.rounds > 0 ? Math.min(data.rounds, 100_000) : 1;
  if (digest(data.salt, String(user || ''), String(password || ''), rounds) !== data.hash) return { ok: false, message: 'Identifiant ou mot de passe incorrect.' };
  if (rounds < ROUNDS) {
    // Accès créé avant l'étirement : on le renforce maintenant que le mot de passe est connu.
    try {
      localStorage.setItem(ADMIN_KEY, JSON.stringify({ user: data.user, salt: data.salt, rounds: ROUNDS, hash: digest(data.salt, String(user || ''), String(password || '')) }));
    } catch {
      // Le stockage refuse l'écriture : l'ancienne empreinte reste valable.
    }
  }
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
