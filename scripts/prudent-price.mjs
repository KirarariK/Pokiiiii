// Cote prudente d'une carte, en euros, à partir des prix Cardmarket relayés par pokemontcg.io.
//
// La moyenne sur 30 jours seule peut s'écarter fortement de ce que la carte vaut vraiment à
// la revente : une carte rare qui ne s'échange que quelques fois par mois a une moyenne
// tirée par une vente isolée. Quand le site rachète 90 % d'une cote trop haute, il perd la
// différence. Règle retenue :
//
//   - on rassemble les indicateurs disponibles : moyenne 30 jours, tendance, moyenne 7 jours,
//     prix moyen de vente ;
//   - on garde le deuxième plus bas (le plus bas isolé ne suffit pas à faire baisser la cote) ;
//   - la cote ne dépasse jamais la moyenne 30 jours : on peut seulement l'abaisser ;
//   - un prix relevé il y a plus de six mois est abaissé de 10 % : l'API ne rafraîchit pas toutes les
//     cartes en même temps, et un prix ancien a plus de chances d'être faux que juste.
//
// Les indicateurs qui concordent donnent la cote habituelle ; ceux qui divergent la tirent vers
// le bas, ce qui est le sens prudent pour un site qui rachète.

/** Au-delà de ce nombre de jours, un prix est considéré comme ancien. */
export const STALE_DAYS = 183;
/** Décote appliquée à un prix ancien. */
export const STALE_FACTOR = 0.9;

/** Un relevé du `updatedAt` (« 2025/11/18 ») est-il plus vieux que STALE_DAYS à la date `today` ? */
export function isStale(updatedAt, today = new Date()) {
  const t = Date.parse(String(updatedAt || '').replace(/\//g, '-'));
  return !Number.isFinite(t) || (today.getTime() - t) / 86_400_000 > STALE_DAYS;
}

/**
 * @param {{ avg30?: number, avg7?: number, trendPrice?: number, averageSellPrice?: number }} prices
 * @param {{ updatedAt?: string, today?: Date }} [opts]  date du relevé ; sans elle, pas de décote d'ancienneté
 */
export function prudentPrice(prices, opts = {}) {
  if (!prices) return null;
  const avg30 = prices.avg30;
  if (!(avg30 > 0)) return null;
  const all = [avg30, prices.trendPrice, prices.avg7, prices.averageSellPrice].filter((x) => x > 0).sort((a, b) => a - b);
  const base = all.length < 2 ? avg30 : Math.min(avg30, all[Math.floor((all.length - 1) / 2)]);
  return opts.updatedAt !== undefined && isStale(opts.updatedAt, opts.today) ? base * STALE_FACTOR : base;
}
