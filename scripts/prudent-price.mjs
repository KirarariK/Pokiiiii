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
//   - la cote ne dépasse jamais la moyenne 30 jours : on peut seulement l'abaisser.
//
// Les indicateurs qui concordent donnent la cote habituelle ; ceux qui divergent la tirent vers
// le bas, ce qui est le sens prudent pour un site qui rachète.

/** @param {{ avg30?: number, avg7?: number, trendPrice?: number, averageSellPrice?: number }} prices */
export function prudentPrice(prices) {
  if (!prices) return null;
  const avg30 = prices.avg30;
  if (!(avg30 > 0)) return null;
  const all = [avg30, prices.trendPrice, prices.avg7, prices.averageSellPrice].filter((x) => x > 0).sort((a, b) => a - b);
  if (all.length < 2) return avg30;
  return Math.min(avg30, all[Math.floor((all.length - 1) / 2)]);
}
