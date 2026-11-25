# Conception : au-delà du site de référence

Le site de référence (voir `ANALYSE_CARDMATIK.md`) vend des packs et s'arrête
là : une grille de prix dont la marge ne se lit nulle part, un tirage opaque,
une vidéo en guise d'ouverture. Ce document décrit ce que la maquette fait
autrement, et pourquoi.

Tout ce qui suit est simulé dans le navigateur (crédits fictifs, pas de stock,
pas de serveur). Les règles et les calculs, eux, sont ceux d'un vrai produit.

## 1. Une gamme calibrée

Chaque pack est conçu pour le même **retour théorique de 90 %** : la cote
moyenne de la carte tirée vaut le prix du pack, et la revente immédiate en
reprend 90 %. La marge se lit donc directement : 10 % sur ce qui est revendu.

| Pack | Prix | Cotes | Cartes | Cote moyenne | Retour théorique | Carte ≥ prix |
| --- | --- | --- | --- | --- | --- | --- |
| Booster Starter | 9,95 € | 4 à 300 € | 771 | 9,96 € | 90,1 % | 22,4 % |
| Pack Évoli | 19,90 € | 5 à 650 € | 88 | 19,96 € | 90,3 % | 20,8 % |
| Booster Pro | 24,95 € | 10 à 500 € | 624 | 25,12 € | 90,6 % | 20,4 % |
| Pack Rétro | 29,90 € | 10 à 650 € | 203 | 29,84 € | 89,8 % | 20,6 % |
| Pack Brasier | 39,90 € | 16 à 650 € | 68 | 39,70 € | 89,5 % | 21,9 % |
| Booster Master | 49,95 € | 20 à 650 € | 512 | 49,98 € | 90,1 % | 23,7 % |
| Booster Expert | 99,95 € | 40 à 1050 € | 319 | 100,04 € | 90,1 % | 28,6 % |
| Booster Légende | 249,00 € | 100 à 1600 € | 129 | 249,38 € | 90,1 % | 29,4 % |

Comment c'est obtenu :

- six paliers de cote par pack, de « Commune » à « Mythique » ;
- des probabilités en progression géométrique d'un palier au suivant, réglées
  par `scripts/design-packs.mjs` pour que la cote moyenne égale le prix ;
- à l'intérieur d'un palier, une probabilité inversement proportionnelle à la
  cote (les petites cartes sortent plus souvent, comme dans un stock réel).

`npm run smoke` échoue si un pack s'écarte de la cible de plus d'un point. Le
catalogue ou un prix change ? On relance `npm run design` et on recopie.

Trois packs sont thématiques (Évoli et ses évolutions, séries 1999-2002, type
Feu) : même mécanique, sélection restreinte.

**À retenir pour un vrai lancement.** Le retour de 90 % est calculé sur des
cotes de marché. La marge réelle dépend du prix auquel les cartes sont
achetées et de la part des joueurs qui gardent leurs cartes plutôt que de les
revendre.

## 2. Un tirage que le joueur peut vérifier

Chaque pack publie sa **table de tirage complète** : 1 000 000 de tickets
répartis entre ses cartes, avec la probabilité exacte et la plage de tickets de
chacune. Le tirage ne fait que désigner un ticket.

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

- chance de réussite = cote misée ÷ cote visée × 92 %, plafonnée à 80 % ;
- réussite : la carte visée remplace la carte misée ; échec : la carte est perdue ;
- retour théorique : 92 % de la cote misée.

La jauge montre exactement ce qui se joue : la zone colorée couvre les tickets
gagnants et l'aiguille s'arrête à la position du ticket tiré.

## 5. Progression

- **XP** : 1 € engagé = 1 XP (achat de pack, carte misée en Évolution).
- **Neuf badges**, un par type, de 0 à 40 000 XP.
- **Récompense du jour** : un tirage gratuit par jour, 0,50 € de crédits en
  moyenne, multiplié par le badge (de ×1 à ×6). Barème affiché.
- **Classement mensuel** et **giveaways**, comme sur le site de référence.

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
- limite de dépenses quotidienne, pause du compte (non annulable) ;
- rappel de session : temps passé et bilan, à intervalle réglable ;
- mention 18+ à l'entrée et numéro d'aide en pied de page ;
- contenus simulés signalés comme tels (classement, dernières ouvertures).

## 8. Pistes suivantes

- **Arène** : duels de packs entre joueurs, le total le plus élevé remporte
  toutes les cartes. C'est le mode le plus populaire du genre ; il demande un
  serveur et change la nature juridique du jeu (les joueurs misent les uns
  contre les autres).
- **Quêtes** quotidiennes et **collections à compléter**.
- Un **serveur** : comptes, tirage sur un stock réel, paiement, vérification
  d'identité. Sans lui, rien de ce qui précède n'est opposable.
