# Pokiiiii

Maquette d'un site de **packs mystère de cartes à collectionner** : on achète un
pack, on l'ouvre en ligne, on découvre une carte, puis on la garde au coffre, on
se la fait livrer ou on la revend à 90 % de sa cote.

**C'est une démonstration.** Les crédits sont fictifs, aucun paiement n'est
effectué, aucune carte n'est en stock ni expédiée, et la communauté (classement,
dernières ouvertures, participants) est simulée. Tout est enregistré dans le
navigateur du visiteur.

« Pokiiiii » est un nom de travail repris du dépôt : la marque définitive se
change dans `js/config.js`.

## Lancer le site

Aucune installation ni compilation : ce sont des fichiers statiques.

```bash
npm start            # sert le dossier sur http://127.0.0.1:4173
npm run smoke        # contrôle les données et le tirage (sans navigateur)
```

Le site peut être déposé tel quel sur n'importe quel hébergement statique. La
navigation passe par l'ancre de l'adresse (`#/packs/starter`), donc aucune règle
de réécriture n'est nécessaire.

## Ce qu'on y trouve

| Page | Adresse |
| --- | --- |
| Accueil | `#/` |
| Packs mystère, page d'un pack avec ses répartitions | `#/packs`, `#/packs/starter` |
| Ouverture animée et récapitulatif | `#/ouverture` |
| Collection, livraisons | `#/collection`, `#/livraisons` |
| Giveaways | `#/giveaways`, `#/giveaways/brasier` |
| Classement | `#/classement` |
| Solde, profil, paramètres | `#/solde`, `#/profil`, `#/parametres` |
| FAQ, transparence et jeu responsable, contact | `#/faq`, `#/transparence`, `#/contact` |
| Trames des documents légaux | `#/legal/cgv`, `cgu`, `confidentialite`, `mentions` |

## Où changer quoi

| Pour changer… | Fichier |
| --- | --- |
| le nom, les coordonnées, le taux de rachat, les frais de livraison, le crédit de bienvenue | `js/config.js` |
| les packs, leurs prix et leurs répartitions | `js/data/packs.js` |
| l'apparence des boosters | `js/ui/pack-art.js` |
| les couleurs et les polices | `css/app.css` (variables en tête de fichier) |
| les questions de la FAQ | `js/data/faq.js` |
| les giveaways | `js/data/giveaways.js` |
| le catalogue de cartes | `npm run cards` (régénère `js/data/cards.js`) |

## Organisation du code

```
index.html            page unique
css/app.css           styles (thème sombre par défaut, thème clair)
js/main.js            routeur et actions globales
js/store.js           compte démo : solde, coffre, rachats, livraisons (localStorage)
js/draw.js            tirage d'une carte dans un pack
js/catalog.js         catalogue et calcul de la cote moyenne d'un pack
js/data/              packs, cartes, noms français, giveaways, FAQ, communauté simulée
js/ui/                composants : boosters, cartes, fenêtres, comptes à rebours, effets
js/views/             une page par fichier
scripts/              génération du catalogue, contrôles
docs/                 analyse du site de référence
```

## Comment une carte est tirée

1. Un palier de cote est tiré selon les probabilités affichées sur la page du pack.
2. Une carte est tirée dans ce palier. Par défaut, les cartes les moins cotées
   sortent plus souvent (`RULES.tierSkew` dans `js/config.js`).

La page **Transparence** affiche, pour chaque pack, la cote moyenne d'une carte
et ce que rapporte une revente immédiate. Avec le catalogue de démonstration,
les packs Starter et Pro rendent en moyenne plus que leur prix : la grille est à
régler sur un stock réel avant toute mise en vente (voir
`docs/ANALYSE_CARDMATIK.md`, section 2).

## Avant une ouverture au public

Ce dépôt ne contient que l'interface. Restent à construire ou à obtenir :

- la qualification juridique du modèle et les textes légaux, avec un avocat ;
- un serveur : comptes, tirage sur un stock réel avec un aléa audité, journal des ouvertures ;
- le paiement, la vérification d'âge et d'identité, les retraits ;
- l'inventaire, le coffre et l'expédition ;
- les limites de dépenses et l'auto-exclusion appliquées côté serveur.

## Crédits

- Visuels et données des cartes : [API Pokémon TCG](https://pokemontcg.io) ;
  cotes Cardmarket (moyenne 30 jours), indicatives.
- Icônes : [Lucide](https://lucide.dev), licence ISC.
- Polices : Unbounded et Manrope, licence SIL OFL (voir `assets/fonts/`).

Site non affilié à Nintendo, Creatures Inc., GAME FREAK inc. ni The Pokémon
Company. Pokémon et les noms des cartes sont des marques de leurs titulaires.
