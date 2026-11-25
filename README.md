# Pokiiiii

Maquette d'un site de **packs mystère de cartes à collectionner** : on achète un
pack, une roulette tourne, on découvre une carte, puis on la garde au coffre, on
se la fait livrer, on la revend à 90 % de sa cote ou on tente de la faire évoluer.

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
npm run smoke        # contrôle les données, les tables de tirage et l'équité
```

Le site peut être déposé tel quel sur n'importe quel hébergement statique. La
navigation passe par l'ancre de l'adresse (`#/packs/starter`), donc aucune règle
de réécriture n'est nécessaire.

## Ce qu'on y trouve

| Page | Adresse |
| --- | --- |
| Accueil | `#/` |
| Packs, page d'un pack avec sa table de tirage complète | `#/packs`, `#/packs/starter` |
| Ouverture en roulette et récapitulatif | `#/ouverture` |
| Évolution (miser une carte pour en obtenir une meilleure) | `#/evolution` |
| Collection, livraisons | `#/collection`, `#/livraisons` |
| Récompense du jour et badges | `#/recompenses` |
| Giveaways, classement | `#/giveaways`, `#/classement` |
| Équité prouvable : graines, journal des tirages, vérificateur | `#/equite` |
| Solde, profil, paramètres (thème, limites, pause) | `#/solde`, `#/profil`, `#/parametres` |
| FAQ, transparence et jeu responsable, contact | `#/faq`, `#/transparence`, `#/contact` |
| Trames des documents légaux | `#/legal/cgv`, `cgu`, `confidentialite`, `mentions` |

À la première visite, un écran propose neuf thèmes (un par type). Le choix est
gardé sur l'appareil.

## Où changer quoi

| Pour changer… | Fichier | Puis |
| --- | --- | --- |
| le nom, les coordonnées, le taux de rachat, la marge de l'Évolution, la récompense du jour | `js/config.js` | |
| les packs, leurs prix et leurs probabilités | `js/data/packs.js` | `npm run design` pour recalculer, `npm run smoke` pour contrôler |
| les couleurs d'un thème, ou ajouter un thème | `scripts/build-themes.mjs` | `npm run themes` |
| le nom et la suggestion d'un thème | `js/data/themes.js` | |
| l'apparence des boosters | `js/ui/pack-art.js` | |
| les badges | `js/data/badges.js` | |
| la FAQ, les giveaways | `js/data/faq.js`, `js/data/giveaways.js` | |
| le catalogue de cartes | `scripts/build-cards.mjs` | `npm run cards` |

## Organisation du code

```
index.html            page unique
css/themes.css        couleurs des neuf thèmes (généré)
css/app.css           mise en page et composants
js/main.js            routeur et actions globales
js/store.js           compte démo : solde, coffre, tirages, évolution (localStorage)
js/fair.js            tirage vérifiable : SHA-256, HMAC, tickets
js/catalog.js         catalogue et tables de tirage des packs
js/theme.js           thème : application, suggestion, écran de choix
js/data/              packs, cartes, noms français, thèmes, badges, giveaways, FAQ
js/ui/                composants : boosters, cartes, fenêtres, effets
js/views/             une page par fichier
scripts/              génération (cartes, thèmes, icônes), conception des packs, contrôles
docs/                 analyse du site de référence, choix de conception
```

## Les règles du jeu, en bref

- **Packs** : huit packs, tous conçus pour un retour théorique de 90 %. La
  table de tirage complète de chaque pack est publiée sur sa page.
- **Tirage** : un ticket parmi un million, calculé à partir d'une graine
  serveur (dont l'empreinte est publiée avant), d'une graine client et d'un
  compteur. Vérifiable après coup sur la page Équité.
- **Évolution** : chance = cote misée ÷ cote visée × 92 %.
- **Récompense du jour** : gratuite, 0,50 € en moyenne, multipliée par le badge.

Le détail et les raisons de ces choix sont dans `docs/CONCEPTION.md`.

## Avant une ouverture au public

Ce dépôt ne contient que l'interface. Restent à construire ou à obtenir :

- la qualification juridique du modèle et les textes légaux, avec un avocat ;
- un serveur : comptes, graine serveur réellement secrète, tirage sur un stock
  réel, journal des ouvertures, audit du générateur d'aléa ;
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
