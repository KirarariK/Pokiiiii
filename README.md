# Coffreo

Maquette d'un site de **packs mystère de cartes à collectionner** : on achète un
pack, une roulette tourne, on découvre une carte, puis on la garde au coffre, on
se la fait livrer, on la revend au site ou on tente de la faire évoluer.

Deux choses le distinguent : **un pack ne peut donner que des cartes réellement
au coffre** (le stock se gère dans l'espace admin, et les probabilités sont
recalculées à chaque carte qui entre ou sort), et **chaque carte se cherche** :
on voit si elle est au coffre, de quels packs elle peut sortir, et à quelle chance.

**C'est une démonstration.** Les crédits sont fictifs, aucun paiement n'est
effectué, aucune carte n'est expédiée, et la communauté (classement, dernières
ouvertures, participants) est simulée. Tout est enregistré dans le navigateur
du visiteur, y compris le stock et l'accès admin : rien n'est partagé entre
appareils tant qu'il n'y a pas de serveur.

**Ce modèle ne peut pas être exploité en argent réel en France.** Payer pour un
tirage au sort dont le lot se revend contre de l'argent est un jeu d'argent,
interdit hors des opérateurs autorisés, et aucun agrément n'existe pour ce type
de jeu. L'audit du 27 novembre 2026 le détaille, avec la voie défendable (une
boutique à prix fixe et des tirages promotionnels) :

- [`docs/AUDIT_JURIDIQUE.md`](docs/AUDIT_JURIDIQUE.md) : jeux d'argent, consommation, paiements, fiscalité, données, propriété intellectuelle, autres pays ;
- [`docs/AUDIT_PROJET.md`](docs/AUDIT_PROJET.md) : code, sécurité, accessibilité, économie, originalité ;
- [`docs/audit/`](docs/audit/) : les treize rapports détaillés.
- [`docs/AUDIT_SECURITE.md`](docs/AUDIT_SECURITE.md) : audit de sécurité du 28 novembre (failles corrigées, points laissés ouverts).
- [`docs/VERIFICATION_COTES.md`](docs/VERIFICATION_COTES.md) : relecture des cotes carte par carte, cote prudente, ancienneté des prix.

Le site s'appelle **Coffreo** : le coffre est ce qui le distingue. La disponibilité du nom
(marque, domaine) reste à vérifier avant tout dépôt ; il se change dans `js/config.js`.
Le dépôt garde pour l'instant son ancien nom de travail.

## Lancer le site

Aucune installation ni compilation : ce sont des fichiers statiques.

```bash
npm start            # sert le dossier sur http://127.0.0.1:4173
npm run smoke        # contrôle les données, le stock, les tables de tirage et l'équité
```

Le site peut être déposé tel quel sur n'importe quel hébergement statique. La
navigation passe par l'ancre de l'adresse (`#/packs/rosee`), donc aucune règle
de réécriture n'est nécessaire.

## Ce qu'on y trouve

| Page | Adresse |
| --- | --- |
| Accueil : packs, jeux, coffre, ouvertures en direct | `#/` |
| Packs, page d'un pack avec sa table de tirage du moment | `#/packs`, `#/packs/rosee` |
| Cartes : le coffre en direct et tout le catalogue, où sort chaque carte | `#/cartes` |
| Ouverture en roulette et récapitulatif | `#/ouverture` |
| Évolution (miser une carte pour en obtenir une meilleure) | `#/evolution` |
| Collection, livraisons | `#/collection`, `#/livraisons` |
| Cashback et badges | `#/recompenses` |
| Giveaways, classement | `#/giveaways`, `#/classement` |
| Équité prouvable : graines, journal des tirages, vérificateur | `#/equite` |
| Solde, profil, paramètres (thème, limites, pause) | `#/solde`, `#/profil`, `#/parametres` |
| Espace admin : stock, packs, livraisons, mouvements, pilotage | `#/admin` |
| FAQ, transparence et jeu responsable, contact | `#/faq`, `#/transparence`, `#/contact` |
| Trames des documents légaux | `#/legal/cgv`, `cgu`, `confidentialite`, `mentions` |

À la première visite, un écran propose neuf thèmes (un par type). Le choix est
gardé sur l'appareil.

## Espace admin

`#/admin` (lien en pied de page). À la première visite, on choisit l'identifiant
et le mot de passe ; ensuite on s'y connecte. Six onglets :

| Onglet | Ce qu'on y fait |
| --- | --- |
| Aperçu | État du coffre, packs en vente, alertes (ruptures, lots manquants, livraisons à préparer) |
| Stock | Tout le catalogue (plus de 20 000 cartes) : recherche, filtres, **au coffre ou non**, nombre d'exemplaires, cote retenue ; import et export de l'inventaire |
| Packs | Ce que le coffre permet de vendre : état, retour réel, cartes et probabilité de chaque palier |
| Livraisons | Demandes à préparer, état, numéro de suivi |
| Mouvements | Argent entré et sorti, marge théorique, cartes dues |
| Pilotage | Compte de résultat d'un mois, leviers, simulateur |

**Une carte qui n'est pas au coffre ne peut pas sortir.** Une carte gagnée en
retire un exemplaire, une carte rachetée le remet. Un pack dont le coffre ne
garnit pas assez de paliers, ou qui ne peut pas atteindre son retour annoncé,
passe en rupture et n'est plus vendu.

Le site démarre sur un **stock de démonstration** (quelques exemplaires de
chaque carte de `js/data/cards.js`). Pour saisir l'inventaire réel : onglet
Stock, « Vider le coffre », puis cocher les cartes possédées.

Limites tant qu'il n'y a pas de serveur :

- l'accès admin et le stock sont **propres à l'appareil**. Le mot de passe
  écarte un visiteur curieux, pas un attaquant ;
- pour que tous les visiteurs voient le même stock, exporter l'inventaire
  (onglet Stock) et coller le fichier dans `js/data/stock.js`.

## Où changer quoi

| Pour changer… | Fichier | Puis |
| --- | --- | --- |
| le nom, les coordonnées, les taux de rachat, la marge de l'Évolution, le cashback, les bonus, la livraison | `js/config.js` | `npm run smoke` |
| les packs, leurs prix, leur retour cible et leurs paliers de cote | `js/data/packs.js` | `npm run smoke` (les probabilités se calculent seules sur le stock) |
| le stock publié avec le site | `js/data/stock.js` | exporté depuis l'espace admin |
| les hypothèses du simulateur (ventes par pack, frais, TVA) | `js/economics.js` | |
| les couleurs d'un thème, ou ajouter un thème | `scripts/build-themes.mjs` | `npm run themes` |
| le nom et la suggestion d'un thème | `js/data/themes.js` | |
| l'illustration d'un booster | `assets/packs/<pack>.webp` | déclarer sa taille dans `js/ui/pack-art.js` ; sans illustration, le booster est dessiné en SVG |
| le logo et l'icône d'onglet | `js/ui/logo-mark.js`, `assets/brand/` | |
| les badges et leur part de cashback | `js/data/badges.js` | |
| la FAQ, les giveaways | `js/data/faq.js`, `js/data/giveaways.js` | |
| le catalogue complet (toutes les cartes) | `scripts/build-catalogue.mjs` | `npm run catalogue` |
| le fonds de démonstration | `scripts/build-cards.mjs` | `npm run cards` |

## Organisation du code

```
index.html            page unique
css/themes.css        couleurs des neuf thèmes (généré)
css/app.css           mise en page et composants
js/main.js            routeur et actions globales
js/store.js           compte démo : solde, bonus, coffre, tirages, évolution (localStorage)
js/stock.js           stock du coffre : exemplaires, réservations, import et export
js/admin.js           accès administrateur (démonstration)
js/catalogue.js       catalogue complet, chargé à la demande
js/economics.js       modèle économique : résultat par pack, compte d'un mois, simulation
js/fair.js            tirage vérifiable : SHA-256, HMAC, tickets
js/catalog.js         cartes au coffre et tables de tirage calculées sur le stock
js/theme.js           thème : application, suggestion, écran de choix
js/data/              packs, cartes, noms français, thèmes, badges, giveaways, FAQ
js/ui/                composants : boosters, cartes, fenêtres, effets
js/views/             une page par fichier
assets/data/          catalogue complet (généré)
scripts/              génération (catalogue, cartes, thèmes, icônes), contrôles
docs/                 analyse du site de référence, choix de conception, vue du gérant
```

## Les règles du jeu, en bref

- **Packs** : huit packs, chacun avec son retour théorique, de 86 % à 90 %,
  affiché sur sa page avec sa table de tirage. La table ne contient que des
  cartes au coffre et se recalcule à chaque mouvement du stock.
- **Rachat** : 90 % de la cote pendant 10 minutes après l'ouverture, 85 % ensuite.
- **Tirage** : un ticket parmi un million, calculé à partir d'une graine
  serveur (dont l'empreinte est publiée avant), d'une graine client et d'un
  compteur. Vérifiable après coup sur la page Équité.
- **Évolution** : chance = cote misée ÷ cote visée × (1 − marge), la marge
  allant de 6 % à 12 % selon l'écart visé.
- **Cashback** : 4 % à 12 % de la marge du site sur les mises, selon le badge.
- **Bonus** : 10 % du premier dépôt, à jouer 10 fois ; l'argent déposé reste
  toujours retirable.
- **Giveaways et classement** : financés par une part des ventes et de la
  marge, jamais par un montant fixe.

Les raisons de ces choix sont dans `docs/CONCEPTION.md`. Ce que chaque
fonctionnalité rapporte ou coûte au site, et le compte de résultat d'un mois,
sont dans `docs/GERANT.md`.

## Avant une ouverture au public

Ce dépôt ne contient que l'interface. Restent à construire ou à obtenir :

- la qualification juridique du modèle et les textes légaux, avec un avocat ;
- un serveur : comptes, accès admin, stock partagé entre tous les joueurs,
  graine serveur réellement secrète, journal des ouvertures, audit du
  générateur d'aléa ;
- le paiement, la vérification d'âge et d'identité, les retraits ;
- l'inventaire, le coffre et l'expédition ;
- les limites de dépenses et l'auto-exclusion appliquées côté serveur.

## Crédits

- Visuels et données des cartes : [API Pokémon TCG](https://pokemontcg.io) ;
  cotes Cardmarket (moyenne 30 jours), indicatives.
- Illustrations des boosters : générées par IA (Gemini) puis détourées. Elles
  **représentent des Pokémon**, personnages protégés : à réserver à la
  démonstration, à retirer ou à licencier avant toute ouverture au public. Le nom
  des packs est du texte posé par le site.
- Logo : tracé vectoriel propre au site.
- Icônes : [Lucide](https://lucide.dev), licence ISC.
- Polices : Unbounded et Manrope, licence SIL OFL (voir `assets/fonts/`).

Site non affilié à Nintendo, Creatures Inc., GAME FREAK inc. ni The Pokémon
Company. Pokémon et les noms des cartes sont des marques de leurs titulaires.
