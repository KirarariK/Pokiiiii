# Conception : au-delà du site de référence

Le site de référence (voir `ANALYSE_CARDMATIK.md`) vend des packs et s'arrête
là : une grille de prix dont la marge ne se lit nulle part, un tirage opaque,
une vidéo en guise d'ouverture. Ce document décrit ce que la maquette fait
autrement, et pourquoi.

Tout ce qui suit est simulé dans le navigateur (crédits fictifs, pas de stock,
pas de serveur). Les règles et les calculs, eux, sont ceux d'un vrai produit.

## 1. Une gamme calibrée

Chaque pack a son **retour théorique**, affiché sur sa page : ce que le joueur
récupère en moyenne en revendant la carte aussitôt. Il va de 86 % à 92 % ; le
reste est la marge du site. Les petits packs margent plus, les gros moins :
c'est là que le joueur compare.

| Pack | Prix | Cotes | Cartes | Cote moyenne | Retour théorique | Marge affichée | Carte ≥ prix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pack Rosée | 8,00 € | 4 à 293 € | 771 | 7,82 € | 88,0 % | 12,0 % | 23,2 % |
| Pack Prisme | 18,00 € | 5 à 627 € | 88 | 17,80 € | 89,0 % | 11,0 % | 19,0 % |
| Pack Orage | 28,00 € | 11 à 544 € | 607 | 28,00 € | 90,0 % | 10,0 % | 22,8 % |
| Pack Millésime | 35,00 € | 12 à 627 € | 182 | 34,61 € | 89,0 % | 11,0 % | 22,2 % |
| Pack Brasier | 45,00 € | 18 à 544 € | 68 | 43,00 € | 86,0 % | 14,0 % | 17,1 % |
| Pack Canopée | 60,00 € | 24 à 635 € | 480 | 60,00 € | 90,0 % | 10,0 % | 24,3 % |
| Pack Zénith | 120,00 € | 48 à 779 € | 266 | 121,33 € | 91,0 % | 9,0 % | 28,7 % |
| Pack Joyau | 300,00 € | 121 à 1538 € | 108 | 306,67 € | 92,0 % | 8,0 % | 25,7 % |

Comment c'est obtenu, à chaque mouvement du coffre (`packTable()` dans `js/catalog.js`) :

- six paliers de cote par pack, de « Commune » à « Mythique » ; chacun reçoit
  les cartes au coffre dont la cote tombe dans sa fourchette ;
- des probabilités en progression géométrique d'un palier au suivant, dont la
  raison est réglée pour que le retour tombe sur la cible du pack (`target`
  dans `js/data/packs.js`) ;
- à l'intérieur d'un palier, un poids proportionnel au nombre d'exemplaires et
  inversement proportionnel à la cote.

Un pack dont le coffre ne garnit pas trois paliers, ou qui ne peut pas
atteindre sa cible à un point près, passe en rupture. `npm run smoke` vérifie
qu'avec le stock de départ tous les packs sont en vente et sur leur cible.

Trois packs sont thématiques (Évoli et ses évolutions, séries 1999-2002, type
Feu) : même mécanique, sélection restreinte. Le Pack Brasier affiche le retour
le plus bas parce que 5 % de son prix financent les lots de son giveaway.

**Le rachat a deux taux** : 90 % de la cote pendant les 10 minutes qui suivent
l'ouverture, 85 % ensuite. Le retour théorique est calculé sur le premier.

**À retenir pour un vrai lancement.** Le retour est calculé sur des cotes de
marché. La marge réelle dépend surtout du prix auquel les cartes sont achetées
et de la part des joueurs qui gardent leurs cartes plutôt que de les revendre :
`GERANT.md` et la page Pilotage le chiffrent.

## 1 bis. Un coffre réel

Le site ne vend que ce qu'il possède. Le catalogue complet (toutes les cartes
de la base, plus de 20 000) est chargé à la demande ; l'espace admin dit pour
chacune si elle est au coffre, et en combien d'exemplaires (`js/stock.js`).

- Une carte gagnée quitte le coffre, une carte rachetée y revient, et la table
  du pack est recalculée aussitôt.
- La page **Cartes** montre le coffre en direct et, pour chaque carte, les packs
  d'où elle peut sortir avec sa probabilité exacte : on peut viser une carte.
- Les lots d'un giveaway en cours sont mis de côté.

Limite de la démonstration : l'inventaire vit dans le navigateur. En
production il est tenu côté serveur et partagé par tous les joueurs.

## 2. Un tirage que le joueur peut vérifier

Chaque pack publie sa **table de tirage** du moment : 1 000 000 de tickets
répartis entre ses cartes, avec la probabilité exacte et la plage de tickets de
chacune. Le tirage ne fait que désigner un ticket. Comme la table change avec
le coffre, chaque tirage note sa version et la plage de la carte gagnée.

Ce ticket est calculé de façon vérifiable (`js/fair.js`) :

1. une graine serveur secrète, dont l'empreinte SHA-256 est affichée avant de jouer ;
2. une graine client choisie par le joueur ;
3. un compteur qui avance de 1 à chaque tirage ;
4. `ticket = HMAC-SHA256(graine serveur, « graine client:compteur:jeu »)`, ramené entre 0 et 999 999.

Quand le joueur renouvelle ses graines, l'ancienne graine serveur est révélée.
La page **Équité** recalcule alors chaque tirage du journal et affiche
« Conforme », et propose un vérificateur manuel.

Limite de la démonstration : la graine « serveur » vit dans le navigateur, donc
elle est lisible. En production elle reste côté serveur, les tables sont figées
et datées, et le générateur est audité par un laboratoire agréé.

## 3. Une roulette, mais honnête

L'ouverture se fait en roulette : le pack se déchire, une bande de cartes
défile, ralentit, s'arrête sur la carte gagnée. C'est le langage du genre.

Deux choix délibérés :

- **la roulette ne décide de rien** : le ticket est tiré à l'achat, la carte est
  déjà au coffre ; quitter la page ne fait rien perdre ;
- **la bande est tirée avec les probabilités du pack**. Aucune « presque-
  victoire » n'est fabriquée en plaçant un gros lot juste à côté du repère.
  C'est une pratique courante, trompeuse, et interdite là où le jeu est régulé.

Un clic écourte la roulette ; le mode « Rapide » la passe entièrement.

## 4. Évolution

Le joueur mise une carte de son coffre pour tenter d'en obtenir une plus cotée.

- chance de réussite = cote misée ÷ cote visée × (1 − marge), plafonnée à 80 % ;
- la marge va de 6 % pour la plus petite marche à 12 % pour les plus grands
  écarts : le retour théorique de chaque cible est affiché avant de jouer ;
- réussite : la carte visée remplace la carte misée ; échec : la carte est perdue.

La jauge montre exactement ce qui se joue : la zone colorée couvre les tickets
gagnants et l'aiguille s'arrête à la position du ticket tiré.

## 5. Progression et récompenses

Tout ce que le site rend au joueur est indexé sur ce que le joueur rapporte,
jamais sur un montant fixe (le détail est dans `GERANT.md`).

- **XP** : elle suit la marge du site sur les mises. 1 € misé sur un pack à
  10 % de marge rapporte 1 XP.
- **Neuf badges**, un par type, de 0 à 40 000 XP.
- **Cashback** : de 4 % à 12 % de la marge du site sur les mises, selon le
  badge. La cagnotte s'encaisse telle quelle, ou se joue à une roue (×0,5 à ×5)
  dont la moyenne vaut exactement ×1.
- **Bonus** : 10 % du premier dépôt, à jouer 10 fois avant retrait. L'argent du
  joueur est joué en premier et reste retirable à tout moment.
- **Classement mensuel** : les dix premiers se partagent 5 % de la marge du mois.
- **Giveaways** : 5 % du prix de chaque pack événement alimentent une cagnotte ;
  les lots se débloquent au fil des ventes.

## 6. Neuf thèmes, choisis à la première visite

Il n'y a pas de mode clair ou sombre. À la toute première visite, connecté ou
non, le visiteur choisit parmi neuf ambiances, une par type : Électrik, Feu,
Eau, Plante, Psy, Ténèbres, Dragon, Glace, Fée. Les deux dernières sont claires.

- L'écran de choix ne s'affiche **qu'une fois** ; le choix est gardé sur
  l'appareil, indépendamment du compte, et appliqué avant le premier affichage.
- **Survoler** une vignette restyle tout le site en direct.
- Une **suggestion** est présélectionnée : le thème du pack par lequel le
  visiteur arrive (un lien vers le Pack Brasier propose « Feu »), sinon un thème
  clair si son système est en clair, sinon Électrik.
- Le thème reste modifiable depuis le menu et les paramètres.
- Chaque thème change les couleurs, le motif de fond, le logo, le dos des
  cartes, la scène d'ouverture, l'icône d'onglet et la carte mise en avant sur
  l'accueil.

Les palettes sont dans `scripts/build-themes.mjs`, qui génère `css/themes.css`
et **refuse d'écrire** si un couple texte/fond tombe sous le seuil de lisibilité.

## 7. Garde-fous

- retour théorique et probabilités affichés partout, avant l'achat ;
- conditions de bonus affichées avant le dépôt, argent déposé jamais bloqué ;
- limite de dépenses quotidienne, pause du compte (non annulable) ;
- rappel de session : temps passé et bilan, à intervalle réglable ;
- mention 18+ à l'entrée et numéro d'aide en pied de page ;
- contenus simulés signalés comme tels (classement, dernières ouvertures).

## 8. Pistes suivantes

- **Vente entre joueurs** : une carte revendue à un autre joueur rapporte une
  commission au site, au lieu de lui coûter un rachat.
- **Arène** : duels de packs entre joueurs, le total le plus élevé remporte
  toutes les cartes. C'est le mode le plus populaire du genre ; il demande un
  serveur et change la nature juridique du jeu (les joueurs misent les uns
  contre les autres).
- **Quêtes** quotidiennes et **collections à compléter**.
- Un **serveur** : comptes, tirage sur un stock réel, paiement, vérification
  d'identité. Sans lui, rien de ce qui précède n'est opposable.
