// Communauté SIMULÉE pour la démonstration : joueurs fictifs, classement et
// flux d'activité générés de façon déterministe. Rien ici ne correspond à de
// vrais comptes ni à de vraies ouvertures ; l'interface le signale.
// En production, ces fonctions sont remplacées par des appels à l'API.

import { PACKS, packBySlug } from './packs.js';
import { packAvailable } from '../catalog.js';
import { drawFromPack } from '../draw.js';
import { intFrom, seeded } from '../rng.js';

const PSEUDOS = [
  'Nox', 'Brumeo', 'CapitaineHolo', 'LuneRousse', 'Tibo_TCG', 'Krokmou77', 'PixelBaie', 'Mistral', 'ZenoCartes', 'Odyssee',
  'RaveDeRares', 'Kiwi_Sleeve', 'DocteurFoil', 'Azur', 'PetitTonnerre', 'Sakado', 'MaitreClasseur', 'Brioche', 'VoltFace', 'Soleil_Vert',
  'TopdeckLea', 'Nacre', 'GrandBazar', 'Yuzu', 'Sleevy', 'Kairo', 'MamieHolo', 'Fenouil', 'ArcEnCiel', 'Quartz',
  'Loutre', 'Minuit', 'Boreal', 'Pampa', 'Cactus', 'Ombrelle', 'Tsuki', 'Ravioli', 'Gribouille', 'Zebre',
];

/** Classement simulé. `period` : 'monthly' (repart de zéro chaque mois) ou 'total'. */
export function communityRanking(period, now = Date.now()) {
  const d = new Date(now);
  const month = `${d.getFullYear()}-${d.getMonth() + 1}`;
  const next = seeded(period === 'monthly' ? `rank:${month}` : 'rank:total');
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const progress = period === 'monthly' ? Math.max(0.08, d.getDate() / daysInMonth) : 1;
  const top = period === 'monthly' ? 21000 : 96000;
  const order = PSEUDOS.map((p) => [next(), p]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  return order.slice(0, 30).map((pseudo, i) => ({
    pseudo,
    points: Math.max(40, Math.round(top * progress * Math.pow(0.82, i) * (0.86 + next() * 0.28))),
  })).sort((a, b) => b.points - a.points);
}

const SLOT = 7 * 60_000; // un créneau de 7 minutes contient au plus une ouverture

/**
 * Dernières ouvertures simulées, de la plus récente à la plus ancienne.
 * Stable d'un rechargement à l'autre : chaque créneau horaire donne toujours
 * le même résultat.
 * @param {string|null} slug  limiter à un pack, ou null pour tous
 */
export function recentOpenings(slug, count, now = Date.now()) {
  const out = [];
  let slot = Math.floor(now / SLOT);
  for (let guard = 0; out.length < count && guard < 400; guard++, slot--) {
    const next = seeded(`open:${slug || '*'}:${slot}`);
    if (next() > (slug ? 0.42 : 0.8)) continue;
    const at = slot * SLOT + Math.floor(next() * SLOT);
    if (at > now) continue;
    const pack = slug ? packBySlug(slug) : PACKS[Math.floor(next() * PACKS.length)];
    const pseudo = PSEUDOS[Math.floor(next() * PSEUDOS.length)];
    if (!pack || !packAvailable(pack)) continue;
    const { card, rarity } = drawFromPack(pack, intFrom(next));
    out.push({ at, pseudo, pack, card, rarity });
  }
  return out;
}

const GSLOT = 11 * 60_000;

/** Activité simulée d'un giveaway : inscriptions, abonnements, ouvertures de packs. */
export function giveawayActivity(giveaway, count, now = Date.now()) {
  const out = [];
  let slot = Math.floor(Math.min(now, giveaway.end) / GSLOT);
  for (let guard = 0; out.length < count && guard < 400; guard++, slot--) {
    const next = seeded(`gw:${giveaway.id}:${slot}`);
    if (next() > 0.7) continue;
    const at = slot * GSLOT + Math.floor(next() * GSLOT);
    if (at > now || at < giveaway.start) continue;
    const pseudo = PSEUDOS[Math.floor(next() * PSEUDOS.length)];
    const roll = next();
    out.push({ at, pseudo, type: roll < 0.5 ? 'join' : roll < 0.78 ? 'follow' : 'open' });
  }
  return out;
}

/** Nombre de participants simulé : croît régulièrement pendant le giveaway. */
export function giveawayParticipants(giveaway, now = Date.now()) {
  const elapsed = Math.max(0, Math.min(now, giveaway.end) - giveaway.start);
  return 64 + Math.floor(elapsed / (52 * 60_000));
}

/** Tickets vendus (simulés) pour un giveaway : le compteur monte régulièrement pendant sa durée. */
export function giveawayTickets(giveaway, now = Date.now()) {
  const elapsed = Math.max(0, Math.min(now, giveaway.end) - giveaway.start);
  return 90 + Math.floor(elapsed / (23 * 60_000));
}

/** Gagnants fictifs d'un giveaway terminé. */
export function pastWinners(id, count) {
  const next = seeded(`winners:${id}`);
  const pool = [...PSEUDOS];
  const out = [];
  while (out.length < count && pool.length) out.push(pool.splice(Math.floor(next() * pool.length), 1)[0]);
  return out;
}
