# Le site vu par son gérant

> **À lire d'abord.** L'audit du 27 novembre 2026 ([`AUDIT_JURIDIQUE.md`](AUDIT_JURIDIQUE.md)) conclut que ce modèle
> (tirage payant, rachat contre un solde retirable) est un jeu d'argent interdit en France et qu'aucun agrément
> n'existe pour lui. Ce document décrit donc l'économie d'une **démonstration** : il ne vaut pas plan de lancement.

Ce document passe chaque fonctionnalité au crible d'une seule question : **où
le site gagne-t-il, où peut-il perdre, et qu'est-ce qui l'en empêche ?** Chaque
réglage cité se change dans `js/config.js` ou `js/data/packs.js`, et chaque
garantie est vérifiée par `npm run smoke`.

Les chiffres se recalculent en direct dans l'espace admin, onglet **Pilotage**
(`#/admin/pilotage`), dont les hypothèses se règlent au curseur. Ceux de ce
document sont relevés sur le stock de démonstration : ils bougent avec le coffre.

## En deux minutes

- Un joueur qui **revend** sa carte coûte au site le retour affiché sur le
  pack, ni plus ni moins. Un joueur qui la **garde** coûte le prix auquel le
  site a acheté la carte. Tant que le site achète sous 90 % de la cote, une
  carte gardée rapporte plus qu'une carte revendue.
- Le premier levier n'est donc pas le jeu, c'est **l'approvisionnement** :
  acheter les cartes 5 points moins cher rapporte plus que vendre 10 % de packs
  en plus.
- Tout ce qui est rendu au joueur (cashback, classement, giveaways, bonus) est
  **indexé sur ce que le joueur rapporte**. Aucune récompense n'est un montant
  fixe sorti de la caisse.
- Aucun détour ne rend plus que la revente directe d'une carte, et un bonus
  joué coûte au moins son montant, quel que soit le pack. Les tests le vérifient.
- **Le site ne vend que ce qu'il possède.** Une carte qui n'est pas au coffre
  ne peut sortir d'aucun pack, et un pack que le coffre ne permet pas de
  composer n'est pas en vente.
- Rien de ce qui rapporte ici n'est caché : le retour, les probabilités, les
  conditions de bonus et les marges de l'Évolution sont affichés avant de jouer.

## Le compte de résultat d'un mois

Hypothèses par défaut : 5 000 packs vendus, 65 % des cartes revendues pendant
la garantie, 10 % plus tard, 25 % gardées ou livrées, cartes achetées à 75 % de
leur cote, 3 % de frais sur les dépôts, 4 nouveaux déposants pour 100 packs,
6 000 € de frais fixes, TVA sur la marge.

| Poste | Montant | Part des ventes |
| --- | ---: | ---: |
| Ventes de packs | 168 400 € | 100 % |
| Coût des cartes (rachats versés, cartes sorties du stock) | −141 869 € | 84,2 % |
| **Marge de jeu** | **26 531 €** | **15,8 %** |
| Cashback | −1 170 € | 0,7 % |
| Dotation du classement | −975 € | 0,6 % |
| Cagnotte des giveaways | −965 € | 0,6 % |
| Bonus de premier dépôt | −1 200 € | 0,7 % |
| **Marge après fidélité** | **22 222 €** | **13,2 %** |
| Frais de paiement et fraude | −2 683 € | 1,6 % |
| TVA sur la marge | −4 422 € | 2,6 % |
| **Résultat avant frais fixes** | **15 117 €** | **9,0 %** |
| Frais fixes (équipe, coffre, assurance, outils, publicité) | −6 000 € | 3,6 % |
| **Résultat du mois** (avant impôt sur les sociétés) | **9 117 €** | **5,4 %** |

Seuil de rentabilité : **1 985 packs par mois**. Chaque pack vendu laisse
3,02 € en moyenne avant frais fixes.

Ce que ce compte ne dit pas : les frais fixes sont une hypothèse à remplacer
par les tiens, et **la TVA est comptée dans sa lecture la plus favorable**.

### La TVA décide du résultat

Le compte ci-dessus suppose le régime de la marge, calculée globalement sur le
mois : les ventes à perte (carte qui a coûté plus que le prix du pack)
compensent les autres. Ce n'est pas la méthode par défaut.

| Régime de TVA | TVA du mois | Résultat du mois |
| --- | ---: | ---: |
| Marge, calcul global du mois (hypothèse du modèle) | 4 422 € | 9 117 € |
| Marge, vente par vente (méthode par défaut) | 11 029 € | 2 510 € |
| TVA sur tout le prix | 28 067 € | −14 527 € |

Sous la méthode par défaut, le modèle est à peine à l'équilibre ; sur le prix
entier, il perd de l'argent à chaque vente. Le régime applicable dépend de la
façon dont le rachat est qualifié (achat d'occasion à un particulier, annulation
de vente, ou jeu) : c'est la première question à poser à l'expert-comptable.
Le pilotage affiche les trois lectures côte à côte.

### Ce que change chaque hypothèse

| Scénario | Résultat avant frais fixes | Résultat du mois | Seuil |
| --- | ---: | ---: | ---: |
| Hypothèses par défaut | 15 117 € (9,0 %) | 9 117 € | 1 985 packs |
| Cartes achetées à 60 % de la cote | 20 330 € (12,1 %) | 14 330 € | 1 476 packs |
| Cartes achetées à 90 % de la cote | 9 905 € (5,9 %) | 3 905 € | 3 029 packs |
| Cartes achetées à la cote | 6 430 € (3,8 %) | 430 € | 4 666 packs |
| Toutes les cartes revendues aussitôt | 10 016 € (5,9 %) | 4 016 € | 2 996 packs |
| Toutes les cartes gardées | 27 690 € (16,4 %) | 21 690 € | 1 084 packs |
| Sans TVA sur la marge | 19 539 € (11,6 %) | 13 539 € | 1 536 packs |

### Les leviers, du plus rentable au moins rentable

| Mouvement | Effet sur le résultat du mois |
| --- | ---: |
| Acheter les cartes 5 points moins cher | +1 737 € |
| Vendre 10 % de packs en plus | +1 512 € |
| Baisser d'un point le retour de tous les packs | +1 133 € |
| 5 points de cartes gardées en plus, plutôt que revendues aussitôt | +884 € |
| Un point de frais de paiement en moins | +894 € |
| Un point de cashback moyen en moins | +195 € |

À lire ainsi : le retour et le cashback sont les leviers les plus faciles à
actionner et les moins intéressants. Baisser le retour d'un point rapporte
moins qu'un meilleur fournisseur, et le joueur le voit puisque le retour est
affiché. Le cashback, lui, ne pèse presque rien : inutile de le rogner.

### Le volume protège de la malchance

Le site paie des gros lots au hasard : à faible volume, un mois peut finir dans
le rouge même si le modèle est sain.

| Packs par mois | Résultat moyen | Mauvais mois (1 sur 20) | Mois déficitaires |
| ---: | ---: | ---: | ---: |
| 1 000 | −2 960 € | −5 086 € | 98,7 % |
| 2 000 | 47 € | −2 672 € | 45,3 % |
| 3 000 | 3 028 € | −628 € | 9,7 % |
| 5 000 | 8 922 € | 4 182 € | 0,0 % |
| 10 000 | 23 979 € | 17 573 € | 0,0 % |

Conséquence pratique : prévoir une réserve qui couvre plusieurs mauvais mois,
et ne pas lancer le Pack Joyau (lot de 1 500 €) avant d'avoir le volume
qui l'absorbe. Ces simulations supposent des tables fixes et des cotes
immobiles ; le stock (environ 80 000 € immobilisés pour le coffre d'exemple) et
son réassort n'apparaissent pas dans le compte : il faut les financer à part.

## Fonctionnalité par fonctionnalité

### Stock

- **Fuite fermée : promettre une carte qu'on n'a pas.** Chaque carte du
  catalogue (plus de 20 000) porte un état « au coffre ou non » et un nombre
  d'exemplaires, tenus dans l'espace admin. Seules les cartes au coffre entrent
  dans les tables de tirage, peuvent être visées en Évolution ou servir de lot.
- Une carte gagnée retire un exemplaire ; une carte rachetée, ou misée en
  Évolution, le remet. Les lots d'un giveaway en cours sont mis de côté : ils
  ne peuvent plus sortir d'un pack.
- Les probabilités sont recalculées à chaque mouvement pour que le retour reste
  sur la cible du pack. Si le coffre ne garnit pas au moins trois paliers, ou
  ne permet pas d'atteindre le retour annoncé, le pack passe en rupture : le
  site préfère ne pas vendre plutôt que vendre à un autre retour que celui affiché.
- L'admin peut retenir sa propre cote pour une carte (prix d'achat récent, état
  particulier) : c'est elle qui sert au calcul.

### Packs

Chaque pack a sa propre cible de retour (`target` dans `js/data/packs.js`). Les
petits packs margent plus : les coûts par opération y pèsent plus lourd, et
leurs acheteurs comparent moins les retours. Les gros packs margent moins :
c'est là que le joueur regarde le retour.

| Pack | Prix | Retour affiché | Marge de jeu | Résultat par pack | Si tout est revendu aussitôt |
| --- | ---: | ---: | ---: | ---: | ---: |
| Pack Rosée | 8,00 € | 87,0 % | 17,1 % | 0,91 € (11,4 %) | 0,68 € (8,5 %) |
| Pack Prisme | 18,00 € | 88,0 % | 16,2 % | 1,87 € (10,4 %) | 1,32 € (7,3 %) |
| Pack Orage | 28,00 € | 89,0 % | 15,2 % | 2,76 € (9,8 %) | 1,91 € (6,8 %) |
| Pack Millésime | 35,00 € | 88,0 % | 16,2 % | 3,66 € (10,5 %) | 2,61 € (7,4 %) |
| Pack Brasier | 45,00 € | 86,0 % | 18,1 % | 3,40 € (7,6 %) | 1,99 € (4,4 %) |
| Pack Canopée | 60,00 € | 89,0 % | 15,2 % | 5,92 € (9,9 %) | 4,10 € (6,8 %) |
| Pack Zénith | 120,00 € | 89,0 % | 15,2 % | 11,87 € (9,9 %) | 8,26 € (6,9 %) |
| Pack Joyau | 300,00 € | 90,0 % | 14,2 % | 27,94 € (9,3 %) | 18,89 € (6,3 %) |

Le Pack Brasier affiche le retour le plus bas parce que 5 % de son prix
financent son giveaway : lots compris, il rend autant que les autres.

**Garde-fou.** Même dans le pire cas testé (tout revendu aussitôt, cashback au
plus haut, cartes achetées à la cote, 6 % de frais), chaque pack reste
bénéficiaire : 2,4 % au plus bas (TVA comptée dans sa lecture la plus favorable).

**À surveiller en production.** Les tables se recalculent seules quand le
stock bouge, mais sur les cotes enregistrées. Si le marché monte et que les
cotes ne sont pas mises à jour, le site donne plus que ce qu'il affiche. Il
faut rafraîchir les cotes chaque jour et archiver chaque version de table (son
numéro est déjà noté avec chaque tirage).

### Rachat

- 90 % de la cote pendant 10 minutes après l'ouverture, 85 % ensuite.
- **Fuite fermée.** Avec un taux unique et sans limite de temps, le joueur
  détenait une option gratuite : garder la carte, attendre, et ne la revendre
  au site que si sa cote baissait. L'écart de 5 points paie ce risque, ainsi
  que la garde et l'assurance d'une carte qui dort au coffre.
- **Ce que le taux de rachat ne fait pas.** Le baisser n'augmente pas la marge
  sur les joueurs qui revendent : c'est le retour affiché qui la fixe. À retour
  égal, un taux de rachat plus bas oblige même à mettre plus de cote dans le
  pack, donc renchérit les cartes gardées.
- **Fuite fermée : la cote figée.** Une carte gardée restait rachetable à sa
  cote du jour du tirage, sans limite de durée : une option de vente gratuite
  dès que le marché baisse. Passé la garantie, rachat et mise en Évolution se
  comptent sur la plus basse des deux cotes, celle du tirage ou celle du jour.
- **En production.** Flux de cotes quotidien, rachats plafonnés par carte et
  par jour, validation à la main au-delà d'un seuil, durée de garde limitée.

### Évolution

- Chance = cote misée ÷ cote visée × (1 − marge). La marge va de 6 % pour la
  plus petite marche à 12 % pour les plus grands écarts : plus le joueur vise
  haut, plus le site est exposé à un gros lot, plus il se rémunère.
- Aucun mouvement d'argent : en moyenne, le site doit moins de cartes après
  qu'avant. C'est le seul jeu qui réduit ce que le site doit sans sortie de caisse.
- **Fuite fermée : le détour par l'Évolution.** Une carte gagnée ouvrait une
  garantie neuve à 90 % : hors garantie, miser puis revendre rendait 85,07 % de
  la cote, contre 85 % en revente directe. La carte gagnée hérite désormais de
  la garantie de la carte misée : le détour rend au mieux 79,9 %.
- L'Évolution ne fait pas avancer le déblocage d'un bonus : elle coûte trop peu
  pour cela.

### Cashback et badges

- **Fuite fermée.** La récompense quotidienne gratuite distribuait de l'argent
  à des comptes qui ne jouaient pas. Elle est remplacée par un cashback : 4 % à
  12 % de la **marge théorique** du site sur les mises du joueur, selon son badge.
- Il est plafonné par construction : le site ne peut pas rendre plus qu'il n'a
  gagné en moyenne sur ce joueur. Coût : 0,6 % des ventes.
- La roue qui multiplie la cagnotte (×0,5 à ×5) a une moyenne de exactement ×1 :
  elle donne du jeu sans rien coûter, et son tirage est vérifiable.
- L'XP suit la marge, pas la mise : 1 € misé sur un pack à 10 % de marge
  rapporte 1 XP. Un joueur ne monte pas en badge en faisant tourner des mises
  sur le jeu le moins margé.

### Bonus

- Premier dépôt : 10 % du montant, 50 € au plus, **à jouer 10 fois**.
- **Fuite fermée : le bonus gagnant sur les gros packs.** À 10,4 % de marge
  moyenne, jouer un bonus 10 fois le fait reperdre en moyenne ; mais sur le pack
  le plus généreux (8 % de marge) il n'en reperdait que 80 %, et l'audit a
  mesuré un gain de 9 € par compte. Les mises sont désormais pondérées par la
  marge : un pack compte en entier à partir de 12 % de marge, au prorata en
  dessous. Jouer un bonus coûte au moins 120 % de son montant, sur tous les
  packs. Le compte de résultat le retient quand même en entier, comme un coût
  d'acquisition.
- **Fuite fermée : le bonus qui ressort.** Les fonds de bonus sont suivis à
  part. L'argent du joueur est joué en premier ; une carte payée en partie avec
  un bonus garde cette part, sa revente retourne aux fonds de bonus dans la
  même proportion, et elle ne peut pas être expédiée avant la fin du bonus. La
  part de bonus d'une commande est portée par le moins de cartes possible : un
  reste de bonus ne retient plus toute une commande. Les frais de livraison ne
  se paient pas avec un bonus.
- **Un bonus ne bloque jamais le reste du solde.** Seul le bonus est soumis à
  condition.
- Un bonus se clôt toujours : joué, épuisé (moins d'un euro et plus de carte
  payée avec), ou bloqué (plus de quoi acheter un pack, coffre vide).
- **Le crédit de bienvenue de la démo est à couper.** Un bonus sans dépôt de
  100 € laisse une vingtaine d'euros par compte quand il est joué prudemment,
  mais **50 à 58 €** quand il est joué sur le pack le plus cher que le solde
  permet (mesuré sur 1 200 comptes), et il attire les comptes multiples.
  `welcomeCredit` doit valoir 0. Tout bonus devrait aussi être annulé par un
  retrait avant la fin des mises, et son gain plafonné.

### Giveaways

- **Fuite fermée.** Des lots annoncés à l'avance sont une dette, que les ventes
  suivent ou non. Désormais 5 % du prix de chaque pack événement alimentent une
  cagnotte, et les lots se débloquent du moins coté au plus coté. Le site ne
  met jamais en jeu un lot que les ventes n'ont pas payé.
- Seuls les lots débloqués à la clôture sont tirés au sort. C'est affiché, avec
  le nombre de packs qui manque pour le suivant. Ce qui reste dans la cagnotte
  est reporté sur le giveaway suivant : les 5 % annoncés sont bien reversés.
- **Corrigé.** La liste des lots est dimensionnée sur les ventes attendues
  (environ 500 packs événement par mois, soit 1 100 € de cagnotte) : sept lots
  de 130 à 200 €. Avant l'audit, le premier lot (1 509 €) demandait 2 466 packs :
  un gros lot que le volume ne peut pas atteindre est un appât, même affiché
  honnêtement.

### Classement

- **Fuite fermée.** La dotation n'est plus un montant fixe : c'est 5 % de la
  marge du mois, partagés entre les dix premiers. Un mois creux coûte peu.
- Seuls les achats de packs donnent des points. Les rachats en donnaient aussi,
  ce qui récompensait l'opération qui coûte le plus au site.
- Le premier touche 35 % de la dotation, soit moins de 2 % de la marge du mois.
  Acheter sa place coûte presque toujours plus qu'elle ne rapporte ; ce n'est
  faux que si le classement est très peu disputé, et sans coût pour le site.

### Livraison

- Forfait par envoi, supplément par carte, et **1 % d'envoi en valeur déclarée**
  sur la cote expédiée au-delà de 50 €. Sans lui, envoyer une carte à 1 000 €
  pour 4,90 € aurait coûté bien plus que le forfait. Le risque de perte ou de
  casse reste au vendeur jusqu'à la remise : ce n'est pas une assurance vendue
  au client.
- Objectif : ni gain ni perte. Le barème est à caler sur les tarifs réels du
  transporteur.

### Solde et retrait

- **À revoir entièrement.** Un solde rechargé par carte, gardé par le site et
  retirable en euros est une activité réservée aux établissements agréés. La
  démonstration ne propose donc aucun retrait.
- Schéma le plus simple pour un vrai service : pas de solde, paiement à chaque
  achat, identité vérifiée avant le premier paiement.

## Ce que le site s'interdit

Chaque point ci-dessous rapporterait à court terme. Tous exposent à une
sanction ou à des impayés, et le compte de résultat montre qu'aucun n'est
nécessaire.

- Fabriquer des « presque-victoires » sur la roulette, ou présenter une perte
  comme un gain.
- Cacher une probabilité, un retour théorique ou une condition de bonus.
- Afficher de faux gagnants, de faux compteurs ou de fausses urgences.
- Bloquer l'argent déposé derrière un bonus.
- Relancer un joueur en pause, ou lui laisser lever sa pause.
- Fêter une carte cotée sous le prix du pack comme si c'était un gain.
- Rendre un retrait plus difficile qu'un dépôt.
- Accepter un joueur sans avoir vérifié son âge.

## Contrôles à mettre en place au lancement

Ce sont eux qui évitent les pertes qu'aucune règle de jeu ne couvre.

- **Cotes** : mise à jour quotidienne, alerte sur les cartes dont la cote a
  bougé de plus de quelques points.
- **Stock** : inventaire tenu côté serveur et partagé par tous les joueurs,
  rapproché du coffre physique à intervalle fixe ; chaque version de table archivée.
- **Fraude au paiement** : authentification forte sur chaque paiement, suivi
  du taux d'impayés et de litiges.
- **Comptes multiples** : un bonus par personne et par moyen de paiement,
  identité vérifiée avant qu'un bonus devienne retirable.
- **Réserve** : de quoi couvrir plusieurs mauvais mois et le plus gros lot en jeu.
- **Tableau de bord** : ventes, marge de jeu réelle contre marge théorique
  (un écart durable signale une table mal calibrée ou une fraude), part des
  cartes revendues, coût de la fidélité rapporté à la marge, dépôt moyen,
  taux d'impayés, plus gros gagnants du mois.
- **Jeu responsable** : limites, pause et auto-exclusion appliquées côté
  serveur. Un joueur qui se met en difficulté finit en impayé ou en litige.

## Points à faire valider

Ils ont été instruits le 27 novembre 2026 : voir [`AUDIT_JURIDIQUE.md`](AUDIT_JURIDIQUE.md)
(jeux d'argent, consommation, paiements, fiscalité, données, propriété
intellectuelle, autres pays) et [`AUDIT_PROJET.md`](AUDIT_PROJET.md) (code,
sécurité, accessibilité, économie, originalité). En résumé : le modèle décrit
ici ne peut pas être exploité en argent réel en France ; la voie défendable est
une boutique à prix fixe avec tirages promotionnels.

## Pistes suivantes

1. **Boutique à prix fixe avec tirages promotionnels.** Le client choisit sa
   carte et la paie au prix du marché ; des tirages accessoires, dotés par le
   budget marketing, animent le site. C'est la seule piste qui a un ancrage
   légal en France, et elle réutilise le stock, le catalogue, l'admin et le
   tirage vérifiable.
2. **Collections à compléter.** Elles donnent une raison de garder les cartes.
3. **Vente entre joueurs.** Le site encaisserait pour le compte d'un tiers :
   c'est un service de paiement, à ne faire qu'avec un établissement agréé.

Écartés : les duels de packs (mises entre joueurs, donc jeu d'argent
caractérisé) et toute variante qui garde un rachat en argent.
