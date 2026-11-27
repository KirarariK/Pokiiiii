# Rapport 12 — Économie : stratégies gagnantes et compte de résultat

État audité : dépôt à 16 h 08 UTC, le 27 novembre 2026. Attention : des fichiers de règles (`js/store.js`, `js/stock.js`, `js/catalog.js`, `js/config.js`, `js/data/giveaways.js`) ont été modifiés pendant l'audit, entre 15 h 55 et 16 h 04, sans commit. Tout a été rejoué à 16 h 08 sur un état stable (empreinte `2f144b96e2d0`, identique avant et après), sauf les packs (15 h 45 ; depuis, `catalog.js` n'a changé que l'empreinte de table).

## 1. Verdict

1. Les packs ne se battent pas : le retour en valeur de rachat reste sur la cible, 93 % au plus, quel que soit l'état du coffre.
2. Deux portes restent ouvertes : les bonus (un bonus joué sans argent propre ressort à plus de 50 % ; le bonus de dépôt rapporte 9 € par compte sur le Booster Légende) et la cote figée au tirage.
3. Le compte de résultat est reproduit à l'euro, mais il repose sur l'achat des cartes à 75 % de leur cote : il s'annule à 95,3 %, et la TVA sur le prix entier le fait passer à −15 146 € par mois.

## 2. Failles confirmées, encore ouvertes

**F1. Cote figée au tirage, sans échéance — élevé en production.** Le rachat (`buybackOf`) et la mise d'Évolution (`evolve`, dans `js/store.js`) gardent la cote du jour du tirage. Après une baisse de 50 % saisie par l'admin, une carte tirée à 44,47 € reste rachetée 37,80 €, soit 170 % de sa cote du jour, et sa chance en Évolution reste de 75,09 % au lieu de 37,25 %. Le joueur détient une option de vente gratuite. Modèle, non mesuré : jusqu'à 3,4 %, 6,8 % ou 10,1 % de la cote des cartes laissées au coffre, pour une cote qui varie de 10, 20 ou 30 %. Règle minimale : passé les 10 minutes, rachat et mise comptés sur la plus basse des deux cotes (tirage, jour), et durée de garde limitée. (script 03, partie D ; script 06b, partie 5)

**F2. Bonus joué sans argent propre — élevé si un tel bonus existe en production.** Crédit de bienvenue de 100 € joué sur le pack le plus cher que le solde permet : 57,55 € ± 5,65 retirables en moyenne par compte (49,70 € ± 5,40 au premier passage ; 1 200 comptes chacun), 14 à 15 % de comptes convertis, plus 2,3 € de cashback en argent réel. `docs/GERANT.md` annonce « une vingtaine d'euros » : c'est le résultat du jeu prudent (Starter seul : 22,88 € ± 6,54, puis 37,58 € ± 8,88, sur 80 comptes). Même mécanique pour un bonus de dépôt de 50 € si le dépôt est retiré avant de jouer, ce que la règle « dépôt retirable à tout moment » permet (retrait non codé en démo) : 27,27 € ± 3,42 par compte, sans risque. Stratégies simulées : des heuristiques, pas l'optimum. Règle minimale : `welcomeCredit` à 0 (prévu) ; tout retrait avant la fin des mises annule le bonus ; gain tiré d'un bonus plafonné, par exemple à 3 fois son montant. (script 02, partie C)

**F3. Bonus de premier dépôt gagnant sur les gros packs — moyen.** Dépôt de 500 €, bonus de 50 €, deux Légende puis un Starter, tout revendu aussitôt : espérance exacte +8,97 € par compte (+10,61 € avec le cashback), +3,83 € sur l'Expert. Sur le vrai store, 1 500 comptes sur 1 500 débloquent le bonus ; gain simulé +6,16 € ± 6,92, puis +22,61 € ± 7,91. Variance forte : 36 à 37 % de comptes gagnants, médiane −83 à −87 €. Règle minimale : 13 mises au lieu de 10 (neutre à 12,5), ou mises pondérées par la marge du pack (`RULES.bonus.wagering`, `js/config.js`). (script 02, parties A et B)

**F4. Détour par l'Évolution meilleur que le rachat différé — faible.** Carte hors garantie misée sur la plus petite marche, carte gagnée revendue à 90 % (sa garantie repart de zéro) : 84,606 % de la cote, plus 0,47 % de cashback mesuré, soit 85,07 % contre 85,003 % en rachat direct. Vrai dès le badge Foudre (7 % de cashback, environ 400 € misés), jusqu'à 85,32 % au dernier badge. `docs/GERANT.md` affirme qu'aucun détour ne rend plus. Règle minimale : pas de cashback sur les mises d'Évolution, ou garantie héritée de la carte misée. (script 03, parties A et C)

**F5. Classement : « coûte toujours plus que ce qu'il rapporte » est faux — faible, sans coût pour le site.** La première place est rentable dès que la mise nécessaire pèse moins de 2,40 % des mises classées du mois (2e : 1,37 % ; 4e à 10e : 0,32 %). Exemple : 1 000 joueurs à 150 €, première place pour 151 € misés, coût 12 €, lot 276 €. Avec le classement fictif de la démo, jamais rentable (−189 à −1 078 €). Les points sont arrondis par commande : 99 pour dix Starter en une fois, 90 en dix fois. Règle minimale : corriger la phrase (`js/views/leaderboard.js:78`) ; plafonner le lot à une part de la marge propre du gagnant. (script 04, partie D ; script 06c)

**F6. Giveaway : gros lot hors d'atteinte — faible.** Un ticket coûte 5,59 € à qui revend aussitôt (le ticket reste acquis après la revente) et vaut au plus 1,99 € de cote : rentable seulement si moins de 29 à 36 % des tickets sont validés. Le lot de 1 509 € demande 2 466 packs, pour 500 par mois dans le modèle. Règle minimale : lots dimensionnés sur les ventes attendues, environ 1 000 € de cote (`js/data/giveaways.js`). (script 04, partie E)

**Corrigées pendant l'audit** (constatées à 15 h 59, absentes à 16 h 08) : bonus de premier dépôt reversé une fois le dépôt sorti du journal de 500 mouvements (50 € une seconde fois, maintenant 0 €) ; vue gérant du compte tronquée (6 212,55 € pour 9 980 € misés) ; lots de giveaway mis de côté seulement après l'affichage d'une page (0 puis 12). Dans l'état actuel, la limite quotidienne tient (refus à 2 995,05 € pour 3 000 €).

## 3. Hypothèses fragiles du modèle

- **Reproduction.** `js/economics.js` redonne `docs/GERANT.md` à 1 € près : résultat 6 434 €, seuil 2 413 packs, leviers identiques. Écart de texte : marge moyenne calculée 10,51 %, écrite 10,4 %.
- **Coût des cartes à 75 % de la cote.** Résultat nul à 95,3 % ; un point vaut 317 € par mois. Expert et Légende sortent 101,1 % et 102,2 % de leur prix en cote : achetée à la cote, chaque carte gardée est une perte. Au-dessus de 90 %, le levier « cartes gardées » s'inverse.
- **Part revendue.** 80 % aussitôt et 10 % plus tard : 4 013 € ; tout revendu : 1 777 €.
- **TVA.** Sur tout le prix : −15 146 € par mois.
- **Scénario prudent** (cartes à 85 %, 80 % + 10 % revendues, frais 4 %, fixes 10 000 €) : −1 911 € par mois, seuil 6 182 packs.
- **Sélection adverse** (modèle, non mesuré). Avec 20 % d'écart entre cote affichée et marché, les cartes gardées valent 110 % de leur cote affichée, les cartes revendues au site 79 % (payées 90 %) : résultat 3 952 €.
- **Stock et trésorerie, absents du compte.** Coffre de démonstration : 106 985 € de cote, soit 80 239 € à 75 % ; réassort 28 311 € par mois ; sans réassort, premières ruptures après 4 415 packs (Brasier) et 4 777 (Évoli).
- **Variance.** Les gros lots ne sont pas le risque principal. À 5 000 packs : écart-type 2 532 €, 5e centile +2 254 €, 1er centile +263 €. À 3 000 packs : −1 787 € et −3 037 € ; creux de trésorerie sur 12 mois 2 730 € (couvert à 95 %) et 4 625 € (99 %). Sous le seuil, la perte est structurelle : 21 666 € et 25 514 € à 2 000 packs, 47 635 € et 50 367 € à 1 000. Perte maximale sur un pack : 1 136 €. Limite de la simulation : tables fixes, cotes immobiles.

## 4. Ce qui est sain

- **Packs.** 11 027 tables en vente sur 1 497 états du coffre : écart à la cible sous 0,02 point dans les états ordinaires, entre −0,76 et +0,85 point quand le coffre est presque vide. En vidant exprès les petites cartes : +0,94 point au mieux (Légende à 92,94 %), après 18 255 € de cote immobilisée, un exemplaire avant la rupture. Attendre une table favorable ne rapporte rien ; la tolérance et la mise en rupture ferment bien la porte.
- **Évolution.** 94 % à 88 % de la cote ; enchaîner est toujours pire (×2 : 93,55 % en direct, 88,17 % en deux marches).
- **Boucle achat → rachat.** Cashback maximal, toute la dotation du classement et le giveaway cumulés rendent 1,4 à 7,4 % pour 8 à 14 % perdus.
- **Roue.** Moyenne exactement ×1 (+0,28 centime par tour sur une cagnotte impaire, négligeable).
- **Fonds de bonus.** Séparation et clôture correctes sur 1 500 comptes.
- **Assurance d'expédition.** 14,40 € pour une carte à 1 000 € ; scinder un envoi coûte plus qu'il n'économise.

## 5. Actions recommandées

(a) Dans le code : les règles minimales F1 à F6 ; mettre à jour `docs/GERANT.md` (« vingtaine d'euros », « aucun détour », 10,4 %).

(b) Entreprise : contrats d'achat sous 85 % de la cote avant tout lancement ; flux de cotes quotidien ; identité vérifiée avant qu'un bonus devienne retirable ; réserve couvrant le stock, le réassort et douze mois de frais fixes sous le seuil ; régime de TVA à faire valider.

## 6. Non vérifié

Volatilité réelle des cotes et prix d'achat réels ; règles de retrait, tirage du giveaway et versement du classement (non codés) ; stratégie de bonus optimale au sens strict ; commande ×10 interrompue en cours de route ; concurrence entre joueurs ; toute modification du dépôt après 16 h 08.

## Annexe — scripts et sorties

Tous les scripts importent les vrais modules du dépôt par chemin absolu (`env.mjs`) et ne modifient que des objets en mémoire. Dossier : ``.

| Script | Sujet | Sorties |
| --- | --- | --- |
| `01-packs.mjs` | Tables de tirage sur 1 497 états du coffre, sculpture du coffre, mois sans réassort | `01-packs.out` (15 h 45) |
| `02-bonus.mjs` | Bonus de dépôt, bonus sans argent propre, bonus versé deux fois | `02-bonus.out` (15 h 59, faille présente), `02-bonus.v2.out` (16 h 08, corrigée) |
| `03-evolution.mjs` | Marge, enchaînements, détour contre rachat, cote modifiée | `03-evolution.out`, `03-evolution.v2.out` |
| `04-fidelite.mjs` | Boucle achat → rachat, roue, classement, giveaway | `04-fidelite.out`, `04-fidelite.v2.out` |
| `06-limites.mjs`, `06b-diagnostic.mjs`, `06c-limites.mjs` | Réservation des lots, limite quotidienne, points, ticket, option de revente | `06-limites.out` (interrompu), `06b-diagnostic.out`, `06c-limites.v2.out` |
| `07-compte.mjs` | Reproduction du compte, sensibilité, variance, sélection adverse | `07-compte.out`, `07-compte.v2.out` |
| `docnums-copie.mjs` | Copie du générateur de chiffres de la documentation | `docnums-copie.json` (identique au `docnums.json` du 25 novembre) |

Chronologie des modifications du dépôt observées (`git status`, heures de modification) : `js/data/giveaways.js` 15 h 55, `js/config.js` 15 h 59, `js/catalog.js`, `js/stock.js` et `js/store.js` 16 h 03. Dernier commit : `72b21f6` (15 h 53, documentation).
