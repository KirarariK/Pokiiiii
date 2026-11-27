# Audit 13 — Originalité et position face au marché

Relevé du 27 novembre 2026, 15 h 37 – 15 h 55 UTC. Dépôt en lecture seule, non modifié.

Statut des sources : **[S]** lu à la source ce jour (cardmatik.com, joint par `curl` et Playwright) ; **[R]** vu dans un résultat de recherche ; **[G]** connaissance générale non vérifiée.

Limites à connaître avant de lire :

- Le quota de recherche web de la session (partagé entre agents) s'est épuisé après mes 8 premières requêtes.
- Aucun autre site du marché n'a répondu (Courtyard, HypeDrop, PackDraw, Jemlit, Lootie, Boxed, Pullbox, Phygitals, Collector Crypt, Rip.fun, Whatnot, Stake, Roobet : refus du proxy ; hôtes non résolus par l'outil de lecture de pages). Je n'ai pas contourné.
- La carte du marché repose donc sur des résumés de recherche, souvent issus de comparatifs affiliés. Elle est indicative.
- Les tableaux de l'espace admin n'ont pas été vus (je me suis arrêté à l'écran de création d'accès).

## 1. Verdict en trois lignes

1. Pas de copie de code, d'image ni de marque. En revanche la **gamme, les prix, les paliers, la FAQ et le squelette des pages** viennent encore de Cardmatik, de façon reconnaissable.
2. Trois apports sont réellement distinctifs sur ce créneau : table carte par carte tirée du stock, recherche « de quel pack sort cette carte », retour affiché. Le reste (roulette, Évolution, cashback, badges, classement) est le répertoire standard des sites de caisses et des casinos.
3. L'exécution est propre et les textes sont bons : ce n'est pas « bâclé ». Mais le site se lit comme un bon gabarit du genre, sous un nom et un logo qui ne tiennent pas pour un site qui encaisse de l'argent.

## 2. Constats, du plus grave au moins grave

### 2.1 La gamme est celle de Cardmatik — risque élevé

Fondement : comparaison directe [S] (https://cardmatik.com/machines/booster-starter, https://cardmatik.com/machines/booster-expert). Qualification juridique (concurrence déloyale, parasitisme) : [G], aucun texte vérifié, à faire valider.

| Élément | Cardmatik [S] | Dépôt |
| --- | --- | --- |
| Noms et prix | Booster Starter 9,95 €, Booster Pro 24,95 €, Booster Master 49,95 €, Booster Expert 99,95 € | Identiques : `js/data/packs.js:43-45`, `64-66`, `99-101`, `109-111` |
| Pack événement | Édition limitée Dracaufeu à 39,90 €, liée à un giveaway | « Pack Brasier », type Feu, 39,90 €, lié à un giveaway : `js/data/packs.js:85-95` |
| Paliers Starter | 4–6, 7–9, 10–15, 16–25, 26–50, 51–275 € | 4–6, 7–9, 10–15, 16–25, 26–50, 51–300 € : `js/data/packs.js:49` |
| Paliers Expert | de 40 € à 1 050 €, six paliers | de 40 € à 1 050 €, six paliers : `js/data/packs.js:115` |
| Raretés | Commune, Peu Commune, Rare, Ultra Rare, Légendaire | Les mêmes cinq, plus « Mythique » : `js/data/packs.js:20-27` |
| Règles | Rachat 90 %, compte à rebours, 10 packs maximum, 10–12 et 10–15 jours ouvrés, virement 7–14 jours ouvrés | `js/config.js:24`, `26`, `34`, `98-99`, `107` |

### 2.2 La FAQ est calquée — risque moyen à élevé

Fondement : [S] https://cardmatik.com/faq (neuf questions) et son code public. Les neuf questions ont leur équivalent dans `js/data/faq.js`, dont trois mot pour mot : « Quand vais-je recevoir ma carte si je choisis la livraison ? » (`:64`), « Où sont stockées mes cartes ? » (`:70`), « Besoin d'aide ? » (`:90`).

Réponses en paraphrase serrée :

- `faq.js:71` « coffre sécurisé et assuré : contrôle d'accès, inventaire permanent, et chaque carte rattachée au compte » ↔ « Coffre-fort dédié et assuré / Contrôle d'accès et inventaire permanent / Association directe entre chaque carte et le compte ».
- `faq.js:65` « retirée du coffre, emballée avec soin et envoyée en suivi » ↔ « Retirée de ton coffre-fort sécurisé / Emballée et expédiée avec soin / Envoyée via transporteur suivi ».
- `faq.js:17` « Tu ouvres ton pack en ligne, tu découvres ta carte, puis tu choisis » ↔ leurs trois titres d'étapes « Tu ouvres ton pack en ligne », « Tu découvres ta carte », « Tu choisis quoi en faire ».
- `faq.js:55` (prestataire, norme PCI DSS), `:60` (virement après KYC, 7 à 14 jours ouvrés), `:75` (« dépend du marché… plus ou moins que le prix du pack ») : même trame.

### 2.3 Slogan et squelette d'interface — risque moyen

- Slogan : `js/views/home.js:154` et `js/config.js:8` « Ouvre en ligne. Reçois en vrai. » ↔ leur titre de page pack « Ouvre un pack en ligne, reçois une vraie carte Pokémon. » [S]. `js/config.js:9` « Packs mystère, vraies cartes. » ↔ leur pied de page « Packs digitaux, cartes physiques. » [S]. `index.html:10` suit la trame de leur méta-description.
- Menu : `js/ui/shell.js:21-36` reprend Accueil, Packs mystère, Giveaways, Collection, Récompenses, puis « Compte » : Profil, Paramètres, avec les mêmes icônes Lucide.
- Page d'un pack : `js/views/pack.js:102` « En stock », `:108` « Autres boosters » (eux : « Les autres packs »), `:132` « Les plus gros hits » (eux : « Les plus gros hits de ce pack »), `:149` « Les dernières ouvertures » (eux : « Dernières ouvertures »).
- Giveaway : `js/views/giveaway.js:55-57` et `:117` « Activité en direct » ; mêmes blocs dans le même ordre (visuel, compte à rebours, trois chiffres, participation, activité, lots) ; mêmes conditions (un pack = un ticket, suivre le compte).
- Écran de résultat : même trio que le leur (revendre, racheter un pack, voir la collection) et même compte à rebours de dix minutes.
- `docs/ANALYSE_CARDMATIK.md:150-157` liste noir sur blanc ce qui a été « repris ». Ce document ne doit jamais se retrouver dans un dépôt public.

### 2.4 Ce qui n'est pas copié

- Code : le leur est une application React/Tailwind compilée, le dépôt est en modules ES sans dépendance. Aucune classe, couleur (`#3b82f6`) ni mention commune hors `docs/`.
- Images : leurs boosters et leur illustration d'accueil ne sont pas dans le dépôt.
- Marque, logo, couleurs, polices : différents.
- Pages légales : `js/views/legal.js` est une trame vide de tout texte emprunté. Elle est aussi vide de contenu (voir 2.7).
- Leur adresse `/classement` renvoie aujourd'hui une page 404 [S] et leur menu affiche « Récompenses » (un cadeau tiré au sort par pack). Le classement repris dans le dépôt correspond donc sans doute à un état antérieur de leur site (déduction, non vérifiée).

### 2.5 L'identité s'appuie sur l'univers Pokémon — risque élevé pour une marque ([G], à valider)

- Neuf thèmes aux noms officiels des types en français, dont « Électrik » : `js/data/themes.js:19-27`.
- « Badge Foudre » est aussi le nom d'un badge des jeux : `js/data/badges.js:10`.
- Médaillons des boosters (goutte, flamme, feuille, éclair dans un cercle) proches des symboles d'énergie du jeu de cartes.
- Nom dérivé de « Poké ».

Une identité « unique » ne peut pas reposer sur le vocabulaire d'un tiers.

### 2.6 Nom et logo — risque élevé pour la crédibilité

- Nom provisoire : cinq « i ». Personne ne saura combien en taper ; il ne se dicte pas ; il a l'air d'une faute de frappe. Mémorisable comme une blague, pas comme une enseigne à qui l'on confie de l'argent. À changer (`js/config.js:6-7` le dit lui-même).
- Logo : une carte inclinée percée d'une étoile à quatre branches, le pictogramme générique de « l'effet magique ». Sans lien avec le nom. Sa couleur change avec le thème (jaune en Électrik, bleu en Glace), la favicon est orange : pas de couleur de marque.

### 2.7 Critique du produit tel qu'il tourne — risque moyen

Captures 1440×900 et 390×844 dans `local-desktop/`, `local-mobile/`, `dark-desktop/`, `dark-mobile/`, `flow-desktop/`, `flow-mobile/`. Aucune erreur de page pendant les parcours.

Ce qui tient :

- Système visuel cohérent, hiérarchie nette, mobile soigné (barre d'onglets, pages lisibles).
- Français de bonne tenue, tutoiement constant, chiffres honnêtes (« −13,26 € par rapport au prix payé », « il ne rend jamais le jeu gagnant »).

Ce qui paraît générique ou incohérent :

- **Thème sombre par défaut** : bleu nuit et jaune, menu latéral, bandeau, flux en direct. C'est l'allure courante des casinos en ligne, bien exécutée, pas reconnaissable.
- **Boosters** (`assets/packs/`, planche dans `boosters-planche.png`) : rendu brillant typique de l'image générée. Huit gabarits différents (largeurs de 468 à 506 px, sertissages et bandeaux variables). Aucune marque imprimée : le nom est posé en HTML. Emblèmes arbitraires (goutte pour « Starter », éclair pour « Pro », feuille pour « Master », étoile rouge sur or pour « Rétro »). Les boosters de Cardmatik forment une vraie gamme à leur marque.
- **Cartes** : scans anglais (« Dark Ursaring », avec ce qui semble être un tampon de première édition) sous un nom français, sans langue, état ni édition. Cote « indicative » datée du 1er juillet 2026 (`js/data/cards.js:5`). C'est le premier test de sérieux pour un collectionneur.
- **Rareté relative au pack** : une carte à 191 € étiquetée « Peu commune », une carte Neo Destiny à 11,78 € étiquetée « Commune ». L'explication n'existe que sur la page Transparence.
- **« Coffre »** désigne à la fois le stock du site (`js/views/home.js:157`, `161`, `188`) et les cartes du joueur (`js/views/evolution.js:118`, `174` ; `js/views/collection.js:17`, `236`).
- **Trois noms pour une page** (`#/cartes`) : « Vise une carte » (`js/views/home.js:78`), « Cartes » (`js/ui/shell.js:25`), « Voir le coffre » (`js/views/home.js:157`). Elle est rangée dans « Jeux » alors que ce n'en est pas un.
- **Écran de résultat** : le bouton principal est « Rouvrir un Pro » (`js/views/opening.js:145`, `207`) ; garder est un lien discret, la livraison est absente. La colonne « Gain » affiche ×0,5 (`js/views/home.js:123`).
- **Ton** : vocabulaire de casino (mises, marge, joueur, « Jouer comporte des risques », au vouvoiement) mêlé à celui d'un marchand (packs, vente, CGV). Le site ne dit pas ce qu'il est.
- **Restes de maquette** : lien « Espace admin » dans le pied de page public, sous « Confiance » (`js/ui/shell.js:112`) ; `[Raison sociale à compléter]`, `contact@exemple.fr` (`js/config.js:11-14`) ; pages légales en trame (`js/views/legal.js:1-4`).
- **Détails** : « Touche le pack » sur ordinateur (`js/views/opening.js:95`) ; apostrophes courbes et droites mêlées (`legal.js`, `transparency.js`, `pilotage.js`) ; « 43,0 % » à côté de « 7,00 % » dans la table de la roue (`js/views/rewards.js:55`).
- **Première visite** : l'accueil est masqué par le choix d'un décor, et la confirmation de majorité est une ligne sous la grille de thèmes.

## 3. Carte du marché

« ? » = non vérifié.

| Fonction | Projet | Cardmatik [S] | Courtyard [R] | Collector Crypt / Phygitals [R] | Boîtes mystère : HypeDrop, PackDraw, Jemlit, Lootie [R] | Rip.fun [R] | Stake [R] |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Objet réel | carte (démo) | carte non gradée | carte gradée au coffre | carte gradée, jeton | objets divers | boosters scellés réels | non |
| Probabilités publiées | par carte, plages de tickets | par palier de valeur | ? | par palier, « Mythic » au sommet | par objet (HypeDrop, Jemlit) | celles du fabricant | ? |
| Liées au stock réel | oui, version hachée | non indiqué | ? | ? | ? | sans objet | sans objet |
| Retour affiché | 86–92 % par pack | non | prix dits alignés sur la valeur attendue | Phygitals : valeur moyenne 102 %, rachat 85 % | non relevé | non | ? |
| Tirage vérifiable | graines, HMAC | aucune mention dans le code public | ? | ? | oui (HypeDrop, Jemlit ; PackDraw : déclaré) | aléa hors opérateur | ? |
| Rachat | 90 % dix minutes, puis 85 % | 90 %, compte à rebours | 90 % de la valeur de marché, immédiat | 85–93 % ; fenêtre de 3 jours (Collector Crypt) ou 7 jours (Phygitals) | échange contre solde (PackDraw, Lootie) | ? | sans objet |
| Améliorateur | Évolution | non | ? | ? | ? (courant sur les sites de skins [G]) | non | non |
| Marché entre joueurs | non | présent dans le code, sous option | oui | oui | non | ? | non |
| Fidélité | cashback sur marge, badges, classement | cadeau tiré au sort par pack, giveaways | ? | revente automatique des communes (Collector Crypt) | batailles (Lootie), packs communautaires (PackDraw) | ? | rakeback = part de l'avantage maison, niveaux, « reload » |
| Flux en direct | simulé, étiqueté | « Dernières ouvertures » | ? | ? | ? | ? | ? |
| Carte → pack | oui | non | ? | ? | ? | sans objet | sans objet |

Compléments :

- Sites de caisses de skins : deux sites cités à 78,4 % et 80,6 % de retour moyen [R]. Un affichage de 86–92 % serait donc un argument, s'il est prouvé.
- Pullbox : boîtes mystère de cartes (Pokémon, One Piece, Lorcana, Magic) [R].
- Acteur français cité : ClutchPacks [R].
- Whatnot (ventes en direct), Roobet, Boxed, lobby et flux de mises de Stake : [G] ou non vérifiés.

Sources [R] :

- https://apps.apple.com/app/id6748155184
- https://www.rotowire.com/sports-cards/courtyard
- https://docs.jup.ag/user-docs/trade/gacha/opening-packs
- https://www.datawallet.com/crypto/best-platforms-to-buy-pokemon-cards-with-crypto
- https://tech-insider.org/mystery-boxes/platforms/hypedrop-review/
- https://tech-insider.org/packdraw-review/
- https://ca.trustpilot.com/review/lootie.com
- https://thecardshopfinder.com/guides/pack-ripping/rip-fun-review/
- https://deadspin.com/mystery-boxes/pullbox/
- https://tech-insider.org/mystery-boxes/case-opening-sites/
- https://www.next-stage.fr/2026/06/ou-acheter-boosters-pokemon-vous-faire-arnaquer-la-reponse-surprend.html
- https://intercom.help/stake-casino/en/articles/4793501-stake-vip-program-overview

## 4. Les différenciateurs revendiqués

| Différenciateur | Jugement | Pourquoi |
| --- | --- | --- |
| Tables pilotées par le stock, recalculées | **Distinctif**, non prouvé | Cardmatik publie six pourcentages fixes par pack. Ici : 771 cartes listées, probabilité, plage de tickets, « dernier exemplaire », version de table. Mais une table qui bouge à chaque tirage inspire moins confiance qu'une table fixe, tant que chaque version n'est pas archivée, datée et liée au ticket. En démo, le stock vit dans le navigateur. |
| « Vise une carte » | **Distinctif**, sous-exploité | Aucun équivalent relevé sur les sites de packs de cartes (non vérifié). Facile à copier. Aujourd'hui : une fenêtre pauvre et trois noms. |
| Retour affiché par pack | **Distinctif ici**, courant dans le jeu d'argent | Absent chez Cardmatik [S] ; Phygitals publierait une valeur moyenne [R]. Le chiffre dépend d'une cote que le site fixe lui-même, vieille de cinq mois. |
| Rachat à deux taux | **Déjà courant** | 90 % et compte à rebours : Cardmatik [S]. Courtyard : 90 % immédiat [R]. Collector Crypt et Phygitals laissent 3 à 7 jours [R]. Dix minutes, comme chez Cardmatik, c'est une pression plus qu'un avantage ; seul le repli à 85 % est ajouté. |
| Évolution | **Courant ailleurs**, nouveau ici | C'est l'« upgrader » des sites de skins [G], même mise en page (mise, jauge, cible). Bon nom, marge affichée. C'est aussi la mécanique la plus « casino » du site. |
| Cashback sur marge, avec roue | Cashback **courant** ; roue **gadget** | Formule du rakeback de Stake [R]. Saine pour le gérant. La roue divise la remise par deux dans 43 % des cas, sur des montants de quelques centimes. |
| Thème par type à la première visite | **Inhabituel, mais gadget** en l'état | Vu nulle part ailleurs. Il prive la marque de couleur propre, multiplie par neuf le travail de finition, repose sur les types Pokémon et noie la confirmation de majorité. |
| Tableaux d'administration du stock | **Pas un différenciateur** | Tout opérateur en a un : le code public de Cardmatik référence plus de trente modules d'administration [S]. Invisible pour le joueur. Non vu en détail. |
| Page de transparence | **Distinctif**, meilleur atout de confiance | Marge, cote moyenne, part des tirages où la carte vaut au moins le prix (20 à 30 %), limites de la démo. Reste déclaratif : aucun tiers ne l'atteste. |

## 5. Notes

| Axe | Note |
| --- | --- |
| Originalité du concept | 5/10 |
| Originalité visuelle | 5/10 |
| Finition | 6,5/10 |
| Clarté pour le joueur | 6,5/10 |
| Confiance inspirée | 4/10 |

## 6. Actions recommandées

### (a) Dans le site — les cinq changements, par ordre d'effet

1. **Une marque à soi** (tous les écrans). Nouveau nom, court et dictable, sans « Pok ». Un logo dessiné, une couleur de marque fixe. Boosters refaits sur un seul gabarit, marque imprimée dessus. Les thèmes ramenés à une couleur d'accent, renommés hors types Pokémon. Fichiers : `js/config.js:7`, `assets/brand/`, `assets/packs/`, `js/data/themes.js`, `js/data/badges.js`.
2. **Mettre l'atout unique en première ligne** (accueil). Remplacer le bandeau par un champ « Quelle carte veux-tu ? » qui répond : packs où elle sort, « 1 chance sur N », exemplaires restants. Un seul nom partout, sorti de « Jeux ».
3. **Se détacher de Cardmatik.** Renommer et re-tarifer la gamme, redéfinir les paliers, remplacer la rareté relative par des tranches de cote, réécrire la FAQ dans un autre ordre, réordonner la page d'un pack (la table d'abord), renommer « Les plus gros hits », « Les dernières ouvertures », « Autres boosters ». Fichiers : `js/data/packs.js`, `js/data/faq.js`, `js/views/pack.js`, `js/views/giveaway.js`, `js/ui/shell.js`.
4. **Une fiche carte de marchand** (résultat, table du pack, collection). Langue, état, édition, source et date de la cote ; photo réelle pour les cartes de valeur. À la révélation, trois actions à égalité : garder, recevoir, revendre. « Rouvrir » en second plan. Prix payé affiché à côté de la cote.
5. **Prouver la transparence.** Archive publique des versions de table (empreinte et date), liée à chaque ticket. Journal des entrées et sorties du stock. Cotes du jour. Supprimer la roue. Retirer le lien admin et les crochets à compléter. Réserver « coffre » aux cartes du joueur, dire « réserve » pour le stock du site.

### (b) Structure et professionnels

- Faire valider par un avocat la proximité avec Cardmatik (gamme, textes, interface) et l'usage des types, des badges, des visuels de cartes et d'un nom dérivé de « Poké ».
- Vérifier la disponibilité du futur nom (marque, domaine) avant tout travail graphique.
- Trancher le positionnement : vendeur de packs ou jeu d'argent. Le vocabulaire du site joue aujourd'hui sur les deux.
- Confier logo et boosters à un graphiste.

## 7. Non vérifié / à confirmer

- Toutes les cases « ? », [R] et [G] du tableau : aucun site du marché n'a pu être lu directement, hormis Cardmatik.
- L'existence d'un modèle à stock fini affiché en direct chez les sites japonais de packs en ligne [G], qui relativiserait le premier différenciateur.
- L'antériorité des textes de Cardmatik par rapport à ceux du dépôt. La ressemblance est constatée aujourd'hui.
- Le contenu des tableaux d'administration.
- Un écart d'affichage des milliers (« 1508,76 € » dans une fenêtre, « 1 508,76 € » ailleurs) : vu sur capture, non confirmé dans le code.
- La disponibilité du nom : non cherchée, par consigne.
