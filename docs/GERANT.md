# Le site vu par son gérant

Ce document passe chaque fonctionnalité au crible d'une seule question : **où
le site gagne-t-il, où peut-il perdre, et qu'est-ce qui l'en empêche ?** Chaque
réglage cité se change dans `js/config.js` ou `js/data/packs.js`, et chaque
garantie est vérifiée par `npm run smoke`.

Les chiffres se recalculent en direct sur la page **Pilotage** (`#/pilotage`),
dont les hypothèses se règlent au curseur.

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
- Aucun détour ne rend plus que la revente directe d'une carte, et un bonus ne
  peut pas ressortir sans avoir été joué. Les tests le vérifient.
- Rien de ce qui rapporte ici n'est caché : le retour, les probabilités, les
  conditions de bonus et les marges de l'Évolution sont affichés avant de jouer.

## Le compte de résultat d'un mois

Hypothèses par défaut : 5 000 packs vendus, 65 % des cartes revendues pendant
la garantie, 10 % plus tard, 25 % gardées ou livrées, cartes achetées à 75 % de
leur cote, 3 % de frais sur les dépôts, 4 nouveaux déposants pour 100 packs,
6 000 € de frais fixes, TVA sur la marge.

| Poste | Montant | Part des ventes |
| --- | ---: | ---: |
| Ventes de packs | 151 854 € | 100 % |
| Coût des cartes (rachats versés, cartes sorties du stock) | −129 615 € | 85,4 % |
| **Marge de jeu** | **22 239 €** | **14,6 %** |
| Cashback | −949 € | 0,6 % |
| Dotation du classement | −791 € | 0,5 % |
| Cagnotte des giveaways | −855 € | 0,6 % |
| Bonus de premier dépôt | −1 200 € | 0,8 % |
| **Marge après fidélité** | **18 444 €** | **12,1 %** |
| Frais de paiement et fraude | −2 404 € | 1,6 % |
| TVA sur la marge | −3 706 € | 2,4 % |
| **Résultat avant frais fixes** | **12 333 €** | **8,1 %** |
| Frais fixes (équipe, coffre, assurance, outils, publicité) | −6 000 € | 4,0 % |
| **Résultat du mois** (avant impôt sur les sociétés) | **6 333 €** | **4,2 %** |

Seuil de rentabilité : **2 433 packs par mois**. Chaque pack vendu laisse
2,47 € en moyenne avant frais fixes.

Ce que ce compte ne dit pas : les frais fixes sont une hypothèse à remplacer
par les tiens, et la TVA suppose le régime de la marge (voir « Points à faire
valider »).

### Ce que change chaque hypothèse

| Scénario | Résultat avant frais fixes | Résultat du mois | Seuil |
| --- | ---: | ---: | ---: |
| Hypothèses par défaut | 12 333 € (8,1 %) | 6 333 € | 2 433 packs |
| Cartes achetées à 60 % de la cote | 17 094 € (11,3 %) | 11 094 € | 1 755 packs |
| Cartes achetées à 90 % de la cote | 7 572 € (5,0 %) | 1 572 € | 3 962 packs |
| Cartes achetées à la cote | 4 398 € (2,9 %) | −1 602 € | 6 822 packs |
| Toutes les cartes revendues aussitôt | 7 669 € (5,1 %) | 1 669 € | 3 912 packs |
| Toutes les cartes gardées | 23 830 € (15,7 %) | 17 830 € | 1 259 packs |
| Sans TVA sur la marge | 16 039 € (10,6 %) | 10 039 € | 1 871 packs |

### Les leviers, du plus rentable au moins rentable

| Mouvement | Effet sur le résultat du mois |
| --- | ---: |
| Acheter les cartes 5 points moins cher | +1 587 € |
| Vendre 10 % de packs en plus | +1 233 € |
| Baisser d'un point le retour de tous les packs | +1 022 € |
| 5 points de cartes gardées en plus, plutôt que revendues aussitôt | +808 € |
| Un point de frais de paiement en moins | +801 € |
| Un point de cashback moyen en moins | +158 € |

À lire ainsi : le retour et le cashback sont les leviers les plus faciles à
actionner et les moins intéressants. Baisser le retour d'un point rapporte
moins qu'un meilleur fournisseur, et le joueur le voit puisque le retour est
affiché. Le cashback, lui, ne pèse presque rien : inutile de le rogner.

### Le volume protège de la malchance

Le site paie des gros lots au hasard : à faible volume, un mois peut finir dans
le rouge même si le modèle est sain.

| Packs par mois | Résultat moyen | Mauvais mois (1 sur 20) | Mois déficitaires |
| ---: | ---: | ---: | ---: |
| 1 000 | −3 512 € | −5 523 € | presque tous |
| 2 000 | −1 101 € | −3 641 € | 3 sur 4 |
| 3 000 | 1 376 € | −2 036 € | 1 sur 4 |
| 5 000 | 6 186 € | 2 006 € | 1 sur 100 |
| 10 000 | 18 461 € | 12 665 € | aucun |

Conséquence pratique : prévoir une réserve qui couvre plusieurs mauvais mois,
et ne pas lancer le Booster Légende (lot de 1 600 €) avant d'avoir le volume
qui l'absorbe.

## Fonctionnalité par fonctionnalité

### Packs

Chaque pack a sa propre cible de retour (`target` dans `js/data/packs.js`). Les
petits packs margent plus : les coûts par opération y pèsent plus lourd, et
leurs acheteurs comparent moins les retours. Les gros packs margent moins :
c'est là que le joueur regarde le retour.

| Pack | Prix | Retour affiché | Marge de jeu | Résultat par pack | Si tout est revendu aussitôt |
| --- | ---: | ---: | ---: | ---: | ---: |
| Booster Starter | 9,95 € | 88,3 % | 15,9 % | 1,04 € (10,4 %) | 0,74 € (7,5 %) |
| Pack Évoli | 19,90 € | 88,7 % | 15,5 % | 1,97 € (9,9 %) | 1,36 € (6,8 %) |
| Booster Pro | 24,95 € | 90,6 % | 13,7 % | 2,18 € (8,7 %) | 1,41 € (5,7 %) |
| Pack Rétro | 29,90 € | 89,2 % | 15,0 % | 2,87 € (9,6 %) | 1,95 € (6,5 %) |
| Pack Brasier | 39,90 € | 85,9 % | 18,2 % | 3,08 € (7,7 %) | 1,84 € (4,6 %) |
| Booster Master | 49,95 € | 90,1 % | 14,2 % | 4,58 € (9,2 %) | 3,05 € (6,1 %) |
| Booster Expert | 99,95 € | 91,0 % | 13,3 % | 8,58 € (8,6 %) | 5,50 € (5,5 %) |
| Booster Légende | 249,00 € | 91,9 % | 12,4 % | 19,95 € (8,0 %) | 12,24 € (4,9 %) |

Le Pack Brasier affiche le retour le plus bas parce que 5 % de son prix
financent son giveaway : lots compris, il rend autant que les autres.

**Garde-fou.** Même dans le pire cas testé (tout revendu aussitôt, cashback au
plus haut, cartes achetées à la cote, 6 % de frais), chaque pack reste
bénéficiaire : 2,6 % au plus bas.

**À surveiller en production.** Le retour est calculé sur les cotes du jour du
calibrage. Si les cotes montent et que les tables ne sont pas recalculées, le
retour réel dépasse la cible et la marge fond. Il faut recalibrer chaque jour,
figer et dater chaque version (le numéro de version est déjà affiché sur la
page du pack), et lever une alerte dès qu'un pack dérive de plus d'un point.

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
- **En production.** Racheter sur la plus basse des deux moyennes (7 jours,
  30 jours) pour ne pas payer une cote qui vient de chuter, plafonner les
  rachats par carte et par jour, et valider à la main au-delà d'un seuil.

### Évolution

- Chance = cote misée ÷ cote visée × (1 − marge). La marge va de 6 % pour la
  plus petite marche à 12 % pour les plus grands écarts : plus le joueur vise
  haut, plus le site est exposé à un gros lot, plus il se rémunère.
- Aucun mouvement d'argent : en moyenne, le site doit moins de cartes après
  qu'avant. C'est le seul jeu qui réduit ce que le site doit sans sortie de caisse.
- **Pas d'arbitrage.** Faire évoluer une carte puis revendre le résultat rend
  au mieux 84,6 % de la cote de départ, contre 85 % en revente directe.
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

- Premier dépôt : 10 % du montant, 50 € au plus, **à jouer 10 fois** avant retrait.
- Pourquoi 10 fois : à 10,4 % de marge moyenne, jouer un bonus 10 fois en fait
  reperdre 104 % en moyenne (81 % sur le pack le plus généreux). Le bonus offre
  du temps de jeu, pas de l'argent. Le compte de résultat le retient quand même
  en entier, comme un coût d'acquisition.
- **Fuite fermée : le bonus qui ressort.** Les fonds de bonus sont suivis à
  part. L'argent du joueur est joué en premier ; une carte payée en partie avec
  un bonus garde cette part, sa revente retourne aux fonds de bonus dans la
  même proportion, et elle ne peut pas être expédiée avant la fin du bonus. Les
  frais de livraison ne se paient pas avec un bonus.
- **L'argent déposé n'est jamais bloqué.** Seul le bonus est soumis à
  condition : un dépôt reste retirable à tout moment.
- Un bonus se clôt toujours : joué, épuisé (moins d'un euro et plus de carte
  payée avec), ou bloqué (plus de quoi acheter un pack, coffre vide).
- **Le crédit de bienvenue de la démo est à couper.** Simulé sur 150 comptes
  qui le jouent au mieux, un bonus sans dépôt de 100 € laisse encore une
  vingtaine d'euros retirables par compte en moyenne, et il attire les comptes
  multiples. `welcomeCredit` doit valoir 0 en production.

### Giveaways

- **Fuite fermée.** Des lots annoncés à l'avance sont une dette, que les ventes
  suivent ou non. Désormais 5 % du prix de chaque pack événement alimentent une
  cagnotte, et les lots se débloquent du moins coté au plus coté. Le site ne
  met jamais en jeu un lot que les ventes n'ont pas payé.
- Seuls les lots débloqués à la clôture sont tirés au sort. C'est affiché, avec
  le nombre de packs qui manque pour le suivant. Ce qui reste dans la cagnotte
  est reporté sur le giveaway suivant : les 5 % annoncés sont bien reversés.
- **À respecter.** Dimensionner la liste des lots sur les ventes attendues. Un
  gros lot que le volume ne peut pas atteindre est un appât, même affiché
  honnêtement.

### Classement

- **Fuite fermée.** La dotation n'est plus un montant fixe : c'est 5 % de la
  marge du mois, partagés entre les dix premiers. Un mois creux coûte peu.
- Seuls les achats de packs donnent des points. Les rachats en donnaient aussi,
  ce qui récompensait l'opération qui coûte le plus au site.
- Le premier touche 35 % de la dotation, soit moins de 2 % de la marge du mois :
  acheter sa place coûte toujours plus qu'elle ne rapporte, et la page le dit.

### Livraison

- Forfait par envoi, supplément par carte, et **1 % d'assurance** sur la cote
  expédiée au-delà de 50 €. Sans elle, envoyer une carte à 1 000 € pour 4,90 €
  aurait coûté bien plus que le forfait.
- Objectif : ni gain ni perte. Le barème est à caler sur les tarifs réels du
  transporteur.

### Retrait

- Minimum 20 €, après vérification d'identité, vers un compte au nom du joueur.
- En production : retrait uniquement vers le moyen de paiement d'origine,
  délai de quelques jours sur le premier retrait, et aucune condition ajoutée
  au moment de retirer.

## Ce que le site s'interdit

Chaque point ci-dessous rapporterait à court terme. Tous exposent à une
sanction, à des impayés ou à la perte d'un agrément, et le compte de résultat
montre qu'aucun n'est nécessaire.

- Fabriquer des « presque-victoires » sur la roulette, ou présenter une perte
  comme un gain.
- Cacher une probabilité, un retour théorique ou une condition de bonus.
- Afficher de faux gagnants, de faux compteurs ou de fausses urgences.
- Bloquer l'argent déposé derrière un bonus.
- Relancer un joueur en pause, ou lui laisser lever sa pause.
- Rendre un retrait plus difficile qu'un dépôt.
- Accepter un joueur sans avoir vérifié son âge.

## Contrôles à mettre en place au lancement

Ce sont eux qui évitent les pertes qu'aucune règle de jeu ne couvre.

- **Tables** : recalibrage quotidien, version figée et datée, alerte de dérive.
- **Stock** : une carte physique derrière chaque ligne de table ; une carte
  sortie est remplacée ou retirée de la table avant le tirage suivant.
- **Fraude au paiement** : authentification forte sur chaque dépôt, retrait
  vers le moyen de paiement d'origine, suivi du taux d'impayés.
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

Ce qui suit n'est pas un avis juridique ou comptable : ces points sont à
trancher avec un avocat et un expert-comptable avant toute ouverture.

- **Qualification du jeu.** Un pack au contenu aléatoire est une vente ; le
  rachat immédiat en argent le rapproche d'un jeu d'argent, que seuls des
  opérateurs autorisés peuvent proposer en France. La réponse conditionne
  tout le reste, à commencer par le maintien du rachat en argent.
- **Droit de rétractation.** La carte est tirée à l'achat. Il faut recueillir
  l'accord exprès du joueur pour une exécution immédiate et sa renonciation à
  se rétracter, sans quoi chaque mauvais tirage peut devenir une demande de
  remboursement.
- **Solde et retraits.** Garder l'argent des joueurs et le leur reverser relève
  des services de paiement : cela passe par un prestataire agréé.
- **TVA.** Le compte de résultat suppose le régime de la marge sur des biens
  d'occasion. S'il ne s'applique pas, la TVA porte sur tout le prix de vente
  et le modèle ne tient plus à ces niveaux de retour.
- **Giveaways.** Règlement publié, lots réellement attribués, et vérifier si
  une voie de participation gratuite est requise.
- **Marques.** Les cartes vendues sont authentiques, mais l'usage des visuels
  et des noms pour la promotion reste à cadrer.

## Pistes suivantes, par ordre d'intérêt pour le site

1. **Vente entre joueurs.** Une carte revendue à un autre joueur plutôt qu'au
   site lui rapporte une commission au lieu de lui coûter 90 % de la cote.
   C'est le levier le plus fort après l'approvisionnement.
2. **Duels de packs.** Les joueurs misent les uns contre les autres ; le site
   prélève une commission et ne porte aucun risque de gros lot. La nature
   juridique du jeu change : à valider d'abord.
3. **Collections à compléter.** Elles donnent une raison de garder les cartes,
   et une carte gardée rapporte plus qu'une carte revendue.
