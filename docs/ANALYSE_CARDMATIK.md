# Analyse de cardmatik.com

Relevé fait le 25 novembre 2026 sur les pages publiques du site et sur son code
embarqué (application React servie au navigateur). Les pages réservées aux
comptes connectés (collection, solde, ouverture d'un pack) n'ont pas été
visitées : ce qui en est dit ici vient des libellés présents dans le code.

## 1. Ce que fait le site

Cardmatik vend des **packs mystère** : chaque pack contient **une vraie carte
Pokémon**, conservée dans leur entrepôt. Le client ouvre le pack en ligne,
découvre la carte, puis choisit :

- la garder dans son « coffre » (collection en ligne) ;
- se la faire livrer ;
- la revendre aussitôt à Cardmatik à **90 % de sa valeur de marché**.

Accroche de la page d'accueil : « Boosters Digitaux. Cartes Physiques. »

Éditeur : SAS LA LIGUE DES OMBRES, 60 rue François 1er, 75008 Paris
(SIREN 940 259 542, créée en janvier 2025 d'après leur page « Avis et fiabilité »).

## 2. Les packs

Cinq packs (« machines ») étaient en vente, chacun avec une table de
« Répartitions » : la probabilité d'obtenir une carte dans un palier de valeur.
Maximum 10 packs par achat.

| Pack | Prix | Paliers de valeur → probabilité |
| --- | --- | --- |
| Booster Starter | 9,95 € | 4–6 € : 40 % · 7–9 € : 25 % · 10–15 € : 18 % · 16–25 € : 10 % · 26–50 € : 5,5 % · 51–275 € : 1,5 % |
| Booster Pro | 24,95 € | 12–19 € : 35,5 % · 20–29 € : 33 % · 30–49 € : 20 % · 50–99 € : 10 % · 100–475 € : 1,5 % |
| Booster Master | 49,95 € | 20–26 € : 20 % · 27–39 € : 19,5 % · 40–59 € : 25 % · 60–79 € : 20 % · 80–99 € : 12 % · 100–199 € : 2 % · 200–635 € : 1,5 % |
| Booster Expert | 99,95 € | 40–49 € : 30 % · 50–74 € : 25 % · 75–89 € : 20 % · 90–199 € : 20 % · 200–399 € : 3 % · 400–1050 € : 2 % |
| Pack Dracaufeu x 30 ans (événement) | 39,90 € | 18–34 € : 55 % · 35–49 € : 25 % · 50–69 € : 10 % · 70–99 € : 5 % · 100–149 € : 3,5 % · 150–450 € : 1,5 % |

Toutes les cartes sont annoncées « non gradées », état « Near Mint minimum pour
le récent, Excellent pour les anciennes ».

Chaque carte porte une rareté maison à cinq niveaux : Commune, Peu Commune,
Rare, Ultra Rare, Légendaire. Elle est propre au pack, pas à la carte imprimée
(une même carte peut être « Légendaire » dans le Starter et ordinaire ailleurs).

### Ce que ces grilles impliquent

En prenant la borne basse puis la borne haute de chaque palier, on encadre la
valeur moyenne d'une carte tirée, et donc ce que le client récupère en revendant
tout de suite à 90 % :

| Pack | Prix | Valeur moyenne : plancher – plafond | Retour en revente immédiate |
| --- | --- | --- | --- |
| Starter | 9,95 € | 8,95 € – 17,71 € | 81 % au plancher, 121 % au milieu |
| Pro | 24,95 € | 23,36 € – 44,13 € | 84 % au plancher, 122 % au milieu |
| Master | 49,95 € | 45,87 € – 69,73 € | 83 % au plancher, 104 % au milieu |
| Expert | 99,95 € | 71,50 € – 124,76 € | 64 % au plancher, 88 % au milieu |
| Pack événement | 39,90 € | 32,90 € – 55,76 € | 74 % au plancher, 100 % au milieu |

Lecture : si les cartes étaient réparties au hasard dans chaque palier, les
packs Starter et Pro rendraient plus que leur prix. La marge du site ne vient
donc pas de la grille elle-même. Elle ne peut venir que de trois endroits :

1. **le stock** : des cartes concentrées vers le bas de chaque palier ;
2. **l'achat** : des cartes acquises sous la « valeur de marché » affichée ;
3. **la décote de rachat** : 10 % retenus sur chaque revente.

Je n'ai aucun moyen de savoir lequel domine chez eux. C'est le paramètre à
régler en premier sur un vrai stock.

## 3. Parcours et règles

| Sujet | Règle observée |
| --- | --- |
| Achat | Carte bancaire via un prestataire (Coinflow). Le code mentionne aussi une recharge par virement « avec bonus ». |
| Après l'ouverture | Écran de révélation avec « Revendre pour X € », « Acheter un autre booster », « Voir ma collection », et un compte à rebours « L'offre de rachat expire dans : 10:00 ». |
| Rachat | 90 % de la « valeur de référence du marché », crédité en **avoir**. |
| Retrait de l'avoir | Virement bancaire après vérification d'identité (KYC), 7 à 14 jours ouvrés, sans frais. |
| Livraison | France : 10 à 12 jours ouvrés ; Europe : 10 à 15. Frais variables selon le nombre de cartes et le pays, affichés avant validation. |
| Stockage | Coffre-fort assuré en France, chaque carte rattachée à un compte. |
| Marketplace entre joueurs | Présente dans le code (commission de 5 %), mais désactivée : la page redirige vers la connexion et la FAQ ne la mentionne que si l'option est active. |

## 4. Mécaniques d'engagement

- **Giveaways.** Un en cours : « Dracaufeu x 30 ans », 5 400 € de lots, 20 lots
  (9 cartes et 11 produits scellés), 426 participants au moment du relevé.
  Conditions : ouvrir le pack événement (1 pack = 1 ticket) et suivre leur compte
  Instagram. Tirage annoncé en direct sur Instagram et YouTube. La page affiche
  un compte à rebours, un flux « Activité en direct » et la liste des lots.
- **Code promo** affiché dans le nom même du pack événement.
- **Classement des collectionneurs.** 1 € dépensé = 1 point, 1 € reçu en rachat
  = 1 point. Onglets Mensuel, Total, Récompenses ; remise à zéro le 1er du mois.
- **Preuve sociale** sur chaque page de pack : « Les plus gros hits » (les dix
  cartes les plus chères) et « Les dernières ouvertures ».
- **Acquisition.** Le code contient des pages d'atterrissage (pack gratuit,
  giveaway), un espace créateurs/affiliés, six guides rédactionnels pour le
  référencement, et des traceurs publicitaires (Google, TikTok, Meta, Snap)
  chargés après consentement.

## 5. Structure des pages

Menu latéral fixe : Accueil, Packs Mystère, Giveaways, Collection, Classement,
puis Profil et Paramètres, un interrupteur « Mode sombre » et la langue.
Connexion et inscription en haut à droite.

| Page | Contenu, dans l'ordre |
| --- | --- |
| Accueil | Grande illustration animée avec l'accroche et un bouton « Découvrir » · « Comment ça marche ? » en 3 étapes · « Acheter un booster » (4 packs) · « Découvrir » (FAQ, engagement écologique, contact) · pied de page |
| Page d'un pack | À gauche : visuel animé, pastille « En stock », carrousel « Autres boosters ». À droite : titre, description, répartitions, quantité, bouton « Acheter 1 pack – prix ». Dessous : « Les plus gros hits », « Les dernières ouvertures » |
| Giveaways | Onglets Actifs / Historique, tri, une carte par giveaway avec lots et compte à rebours |
| Détail d'un giveaway | Visuel, compte à rebours, 3 chiffres (valeur, lots, participants), participation, activité en direct, lots |
| Classement | Compte à rebours de remise à zéro, règle des points, 3 onglets, podium coloré |
| FAQ | 9 questions en accordéon |
| Avis et fiabilité | Page de réassurance : société, stockage, livraison, rachat, paiement |
| Documentation | 6 chapitres en accordéon |
| Légal | CGV, CGU, confidentialité, mentions légales, documentation légale |

Habillage : thème clair par défaut, bleu vif en couleur principale (#3b82f6),
cartes blanches à coins arrondis, police système, emojis en guise d'icônes de
section. Les packs sont présentés en photo ou en vidéo.

Le back-office visible dans le code donne une idée de ce qu'il faut derrière :
inventaire, commandes, rachats, retraits, virements, taux de rachat, cartes
mises en avant, giveaways, créateurs, codes d'accès, liste d'attente, revenus.

## 6. Leur positionnement juridique

Cardmatik ne se présente **pas** comme un casino, et c'est le cœur de son
modèle. Formulations relevées dans leur FAQ et leur documentation :

- « Cardmatik n'est pas un jeu d'argent : chaque pack contient une carte réelle,
  livrable et revendable. »
- « Il ne s'agit ni d'un pari, ni d'un tirage au sort, mais d'une vente de
  produit à caractère aléatoire. »
- « Les avoirs sont des crédits commerciaux internes » ; le site dit ne détenir
  aucun fonds et n'opérer aucun transfert entre utilisateurs.

Ce sont leurs affirmations, pas un avis juridique. Elles montrent toutefois où
passe la ligne qu'ils défendent : un bien physique dans chaque pack, des
probabilités publiées, un rachat présenté comme une vente.

**Conséquence pour notre projet.** À ma connaissance, en France, les jeux de
casino en ligne ne sont pas ouverts à l'agrément : seuls les paris sportifs, les
paris hippiques et le poker le sont (une ouverture a été discutée ; l'état du
droit est à vérifier). Se présenter comme « casino » et viser une certification
de jeu d'argent, ou se présenter comme vendeur de packs mystère, sont deux
projets différents, avec des obligations différentes. C'est à trancher avec un
avocat avant d'écrire le moindre texte commercial.

## 7. Ce que la maquette reprend, et ce qu'elle change

Repris du site de référence :

- le parcours choisir → ouvrir → garder, livrer ou revendre ;
- le menu latéral et la page d'un pack (visuel, répartitions, achat, gros lots,
  dernières ouvertures) ;
- les règles : rachat à 90 %, prix garanti 10 minutes, 10 packs maximum, points
  du classement, délais de livraison et de retrait ;
- les giveaways et le classement mensuel.

Refait autrement, parce que le site de référence s'arrête là où un opérateur
de métier commence (détail dans `docs/CONCEPTION.md`) :

- **la gamme** : huit packs dont le retour théorique (86 % à 92 %) est affiché,
  au lieu d'une grille dont la marge ne se lit nulle part ;
- **le tirage** : vérifiable par le joueur (graines, tickets), avec la table
  complète de chaque pack publiée carte par carte ;
- **l'ouverture** : une roulette, dont la bande est tirée honnêtement ;
- **les jeux** : Évolution, cashback, badges ;
- **l'économie** : chaque récompense indexée sur ce que le joueur rapporte
  (détail dans `docs/GERANT.md`) ;
- **l'habillage** : neuf thèmes par type, choisis à la première visite ;
- **la marque, les visuels et les textes**, propres à la maquette.

Non repris pour l'instant : marketplace entre joueurs, pack gratuit, espace
créateurs, guides de référencement, back-office, paiement et KYC.
