# Rapport 11 — Tests navigateur et accessibilité

27 novembre 2026. Site testé sur `http://127.0.0.1:4173/`, Chromium (Playwright), dépôt en lecture seule.
Les scripts, journaux et captures de cette campagne ne sont pas versés au dépôt.

## 1. Verdict

1. **Fonctionnel : solide.** 38 routes × 1440/390/320 px × visiteur/connecté : 0 erreur de console, 0 débordement horizontal, 0 page en échec, 55 liens internes valides ; soldes, bonus, registre admin et tirages (13/13 « Conforme ») cohérents d'un écran à l'autre. Seule étape du parcours non aboutie : l'expédition.
2. **Accessibilité : non conforme WCAG 2.1 AA en l'état.** Trois défauts élevés (lien d'évitement qui mène à « Page introuvable », bouton « Recharger » sans nom sur mobile, badges et pastille « 18+ » à 2,4–2,8:1), puis des défauts moyens. Tous se corrigent dans le code.
3. **Campagne écourtée.** Zoom 200 %, tabulation sur mobile et performance en navigateur non mesurés ; une seule capture relue à l'œil (voir section 4).

## 2. Constats

Statut de chaque preuve : **mesuré** (Playwright, styles calculés), **axe** (axe-core, 60 écrans), **code** (lu, non exécuté).

### 2.1 Accessibilité

**A1 — Élevé. Le lien d'évitement casse la page (WCAG 2.4.1).**
Toutes routes, toutes tailles, tous thèmes. Mesuré (1440 px, Électrik, `#/packs`, chargement neuf) : 1er Tab → « Aller au contenu », visible en haut à gauche ; Entrée → `location.hash = "#main"`, titre « Page introuvable — … », le contenu de la page est remplacé.
Captures : `shots/spot-skiplink.png` et `shots/spot-skiplink-apres.png`.
Cause : `index.html:22` (`href="#main"`) est lu comme une route par le routeur par ancre (`js/main.js:69-94`, toute ancre inconnue → `notFound`).
Correctif : dans `boot()` (`js/main.js`), écouteur sur `.skip-link` : `e.preventDefault(); document.getElementById('main').focus();`. En complément, ignorer dans `parseHash()` toute ancre qui ne commence pas par `#/`.

**A2 — Élevé. Textes sous 4,5:1 (WCAG 1.4.3).**
Mesuré sur 4 122 textes par thème × 9 thèmes (`contrast-<thème>.json` du dossier).

| Élément (cause) | Rapport | Thèmes | Routes |
|---|---|---|---|
| `.badge--event`, `.badge--hot` — blanc sur dégradé `#ff5d3c→#ff9d2e` (`css/app.css:243`) | 2,4 à 2,8:1 | les 9 | `/`, `/packs`, `/giveaways` |
| `.age-pill` « 18+ » — blanc sur `--danger` (`css/app.css:203`) | 2,75:1 | les 7 thèmes sombres | toutes (pied de page), choix du thème |
| `.badge--rarity` — couleur de rareté sur sa teinte à 20 % (`css/app.css:241`) | 4,0 à 4,5:1 | « Ultra rare » : Électrik 4,44, Eau 4,21, Plante 4,27, Psy 4,47, Glace et Fée 4,04 ; « Peu commune » et « Légendaire » : Glace et Fée 4,04–4,17 | `/`, `/packs/:slug` |
| `.mult.is-up` (`css/app.css:1403`) | 4,16:1 | Glace, Fée | `/` (ouvertures en direct) |
| `.btn--danger` (`css/app.css:228`) | 4,28:1 | Glace, Fée | `/parametres` |

Correctifs : `.badge--event, .badge--hot { color: #1b0a00; }` (≈ 6:1 au point le plus sombre du dégradé, calculé) ; `.age-pill { background: #c9243a; }` (blanc dessus = 5,5:1, mesuré sur Glace et Fée) ; teinte de fond des badges ramenée à 10–12 %, ou jetons `--r-*`, `--success`, `--danger` assombris sur les deux thèmes clairs (`scripts/build-themes.mjs`).

**A3 — Élevé. Bouton « Recharger » sans nom accessible sur mobile (WCAG 4.1.2).**
390 px, connecté, toutes routes (axe : `button-name`, critique, 24 écrans sur 24). Le bouton ne montre que « + ».
Cause : `css/app.css:987` (`.topbar__topup span { display: none; }`) ; bouton sans `aria-label` (`js/ui/shell.js:142`).
Correctif : `aria-label="Recharger"` sur ce bouton.

**A4 — Moyen. Onglets et groupes radio (WCAG 2.4.3, 4.1.2).**
Mesuré sur `/classement` (1440 px, Électrik) : flèche droite sans effet ; Entrée sur le 2ᵉ onglet → l'onglet change mais le focus tombe sur `<body>` ; ni `role="tabpanel"` ni `aria-controls`. Jetons ×1 à ×10 de `/packs/:slug` (`role="radio"`, `js/views/pack.js:62-63`) : flèches sans effet, 5 arrêts de tabulation.
Cause : `rerender()` remplace tout le contenu (`js/views/leaderboard.js:112-123`, `collection.js:254` et `:287`, `cards.js:102` et `:143`, `giveaways.js:55` et `:75`, `home.js:118`) ; seul `js/theme.js:120` gère les flèches.
Correctif : après `rerender()`, refocaliser `#main [role="tab"][aria-selected="true"]` ; reprendre le motif de `wireThemeGrid` (flèches, `tabindex` tournant) pour onglets et jetons ; ou remplacer ces rôles par de simples boutons `aria-pressed`.

**A5 — Moyen. Champs de formulaire peu délimités (WCAG 1.4.11, 1.4.3).**
Les 9 thèmes : bord de `.input` (`css/app.css:313`, `--border-strong`) à 1,7–2,5:1 contre le fond voisin (seuil 3:1), remplissage ≈ 1:1. Texte indicatif non stylé (`#757575` du navigateur) à 4,0–4,3:1 sur les 7 thèmes sombres (`/cartes`, `/equite`, admin).
Correctif : `--border-strong` ≥ 3:1 contre `--bg` et `--surface` dans `scripts/build-themes.mjs` (Électrik : `#6672a8` ≈ 3,8:1 sur `--surface`, calculé) ; ajouter `.input::placeholder { color: var(--muted); opacity: 1; }` (déjà fait pour la recherche, `css/app.css:1367`).

**A6 — Moyen. Liens distingués par la seule couleur (WCAG 1.4.1).**
axe `link-in-text-block` : 74 nœuds sur 58 écrans (courriel du pied de page, « tirage vérifiable », « En savoir plus »…).
Cause : `css/app.css:85-86` (soulignement au survol seulement).
Correctif : `p a, li a, .prose a, .footer__legal a { text-decoration: underline; }`.

**A7 — Moyen. Tableaux défilants inatteignables au clavier sur mobile (WCAG 2.1.1).**
axe `scrollable-region-focusable`, 390 px : `/`, `/packs/:slug`, `/solde`, `/equite`.
Cause : `.table-wrap { overflow-x: auto }` (`css/app.css:330`) sans `tabindex`.
Correctif : `tabindex="0" role="region" aria-label="…"` sur `.table-wrap`.

**A8 — Moyen. Titres (WCAG 1.3.1, 2.4.6).**
Pas de `h1` sur `/ouverture` (état vide : mesuré ; scène avant révélation : code, `js/views/opening.js:57-96`) ni sur les quatre pages « introuvable » (mesuré) ; saut `h1→h3` causé par les titres du pied de page (`js/ui/shell.js:98`) sur 7 pages connecté, 12 visiteur ; second `h1` dans l'écran de choix du thème (`js/theme.js:171`).
Correctif : `h1` masqué visuellement dans `sceneHtml`, `h1` dans `js/views/not-found.js` et les états vides de page, titres de pied de page en `h2`.

**A9 — Faible à moyen. Divers.**
- Formulaires (WCAG 3.3.1) : erreur en `role="alert"`, mais une seule à la fois, sans `aria-invalid`, focus laissé sur le bouton (`js/views/auth.js:62-74`, mesuré à l'inscription).
- Fenêtres : `#overlays[aria-live="polite"]` englobe les dialogues (`index.html:28`) — risque de double lecture, non testé avec un lecteur d'écran ; `<header>` et `<footer>` de la fenêtre créent des repères en double (`js/ui/modal.js:25` et `:30`, axe, 8 écrans) ; arrière-plan non inerte (mesuré) ; bouton de confirmation destructive en `autofocus` (`js/ui/modal.js:94`, code).
- `.avatar` : nom accessible « Mon profil » différent du texte visible (WCAG 2.5.3, `js/ui/shell.js:143`, axe, 48 écrans) ; bandeau de démonstration hors repère (`js/ui/shell.js:67`, axe) ; les onglets de l'admin partagent le même titre de page.
- Cibles tactiles : 40 à 42 commandes sous 44 px par page sur mobile ; liens de 20 à 23 px de haut (pied de page, `.back-link`, `.link-more`, `css/app.css:265`), conformes au minimum de 24 px seulement par leur espacement.

### 2.2 Fonctionnel et visuel

**F1 — Moyen. « Faire livrer » sans effet sur les cartes payées en partie avec un bonus.**
`/collection`, 1440 px Électrik et 390 px Glace. Mesuré : après le parcours type (crédit de bienvenue, dépôt de 100 €, 11 packs), 9 cartes au coffre sur 10 portent un `bonusShare` ; le bouton est présent sur les 10 fiches ; le clic ferme la fiche sans ouvrir le formulaire d'expédition.
Captures : `shots/flow-m-24-echec-6_collection_revente_conservation_exp_dition.png` (relue : plus aucune fenêtre) et `shots/flow-d-18-expedition-formulaire.png` (0,6 s après le clic, non relue).
Cause : `js/store.js:266` (`canShip`) refuse toute carte ayant une part de bonus tant que le bonus n'est pas joué, et `js/store.js:473` répartit la part de bonus sur toutes les cartes de la commande : 9,45 € de bonus dans une commande de 99,50 € bloquent ses dix cartes. Le bouton est toujours rendu (`js/views/collection.js:102`).
Correctif : désactiver le bouton et afficher la raison avec le reste à miser ; affecter le bonus à des cartes précises plutôt qu'à toute la commande ; annoncer la règle avant l'achat. Message affiché au clic : non vérifié.

**F2 — Moyen. Limite quotidienne levée sans délai.**
`/parametres`, 1440 et 390 px. Mesuré : limite de 20 € atteinte, achat refusé (« Cet achat dépasserait ta limite… ») ; choix « Aucune » → `limits.daily = null` aussitôt.
Cause : `js/store.js:728` (`setDailyLimit`).
Correctif : baisse immédiate, hausse ou retrait différés. Fond du sujet : voir l'agent « jeu responsable ».

**F3 — Faible.**
- Image absente chez l'hébergeur : `https://images.pokemontcg.io/hsp/HGSS18.png` (404, `/admin/stock`), seule erreur de console des deux parcours.
- Troncatures : `.pull__who` coupe l'heure dans le fil des ouvertures (`css/app.css:532`) ; `.tile__name` coupe les noms longs (`css/app.css:437`) ; à 320 px, la référence de carte est coupée.
- Inscription envoyée vide : message sur l'âge alors que le pseudo manque aussi (`js/views/auth.js:71-73`).
- Admin « Stock de départ » : 2 785 exemplaires rétablis alors que 10 cartes restent dues au joueur (2 775 avant) ; fonction de démonstration.

### 2.3 Performance (statique, non mesurée en navigateur)

- Démarrage : 57 modules ES non regroupés (482 Ko, 175 Ko une fois compressés), CSS 119 Ko, polices 76 Ko, soit environ 63 requêtes avant images et icônes. Le serveur de démonstration n'envoie ni compression ni en-tête de cache.
- Accueil : 46 images, 42 en chargement différé, toutes avec largeur et hauteur ; les 8 illustrations de packs pèsent 863 Ko (jusqu'à 153 Ko pièce).
- Catalogue complet : `assets/data/catalogue.json`, 836 Ko (243 Ko compressé), analysé en 15 ms sous Node, chargé à la demande (code, `js/catalogue.js`).

### 2.4 Ce qui fonctionne bien

- Jetons de texte des 9 thèmes tous ≥ 4,5:1 (texte, texte atténué, liens, boutons primaires, succès, danger, alerte) ; anneau de focus ≥ 4,2:1.
- Focus visible sur 230 arrêts de tabulation (5 routes, 1440 px) ; focus envoyé sur `<main>` et titre mis à jour à chaque changement de page.
- Fenêtre « Recharger » : focus à l'intérieur, piège, Maj+Tab, Échap, focus rendu au bouton. Choix du thème : piège et flèches.
- `prefers-reduced-motion` : 0 animation sur l'accueil, ouverture d'un pack en 1,0 s contre 7,8 s.
- `lang="fr"`, titres de page distincts, champs tous nommés, images toutes pourvues d'un `alt` (« nom — extension »).
- Aucun débordement à 320 px ; pages protégées redirigées vers la connexion ; états vides présents.
- Limite et pause appliquées ; vérification d'un tirage ; admin : création de l'accès, modification du stock, rupture (8 tuiles sur 8, bouton d'achat retiré), rétablissement.

## 3. Actions recommandées

**(a) Dans le code, par ordre.**
1. A1, A3, A2 : quelques lignes chacune.
2. A4 à A8, puis A9.
3. F1 et F2.
4. Regrouper et minifier le JavaScript, activer compression et cache, alléger les illustrations de packs.
5. Rejouer `contrast.js` et `axe.js` du dossier après correction.

**(b) Hors code.**
- Test avec de vrais lecteurs d'écran (NVDA, VoiceOver, TalkBack) et audit RGAA par un tiers avant toute ouverture commerciale.
- Obligation d'accessibilité des services de commerce en ligne (directive (UE) 2019/882, applicable depuis le 28 juin 2025) : portée et exemptions à faire confirmer par un professionnel — connaissance générale non vérifiée.

## 4. Non vérifié / à confirmer

- Zoom 200 % (largeur 720 px) et espacement du texte.
- Ordre de tabulation sur mobile ; menu latéral fermé encore focalisable ou non.
- Fiches de carte et confirmations au clavier ; cibles radio de l'Évolution.
- Formulaire d'expédition (validation, frais) et mise à jour d'une livraison côté admin : bloqués par F1.
- Roue du cashback (les deux essais ont rendu exactement la cagnotte) ; page Profil.
- Micro-texte des illustrations de packs sur Glace et Fée (3 à 4 px, calcul non confirmé sur pixels).
- Classement : 108 points pour 109,45 € d'achats (`js/views/leaderboard.js:25-26`).
- Performance en navigateur : nombre réel de requêtes, temps de chargement du catalogue, décalages de mise en page.
- Relecture visuelle : une seule capture ouverte sur 267.
- Critères WCAG cités de mémoire, non relus à la source.

## Annexe A — Couverture et méthode

| Script | Portée | Résultat |
|---|---|---|
| `sweep2.js` | 38 routes × 1440/390/320 px × visiteur/connecté, Électrik | `sweep2.json`, `sweep2.log` |
| `flow.js` | parcours joueur puis admin, 1440 px Électrik et 390 px Glace | `flow-d.log`, `flow-m.log`, captures `shots/flow-*` |
| `contrast.js` | 9 thèmes × (22 routes connecté, 4 états ouverts, 4 routes visiteur à 1440 px ; 5 routes à 390 px) | `contrast-<thème>.json`, `contrast.log` |
| `axe.js` | 60 écrans (1440 px Électrik, 390 px Glace), règles WCAG 2.1 A/AA et bonnes pratiques | `axe.json`, `axe.log` |
| `kbd.js` | lien d'évitement, tabulation, choix du thème | `kbd.log` — arrêté par une erreur du script après la partie ordinateur |
| `spot.js`, `spot2.js` | vérifications ciblées : lien d'évitement, clic sur le pack, fenêtre, onglets, mouvement réduit, expédition | `spot.log`, `spot2.log` |

Précisions :
- Contraste : fond effectif recomposé à partir des styles calculés des ancêtres ; pour les fonds non unis (dégradé, image, calque), mesure sur pixels, limitée à 14 éléments par écran.
- `flow.js`, ordinateur, étapes 4 et 5 : clic automatisé refusé par Playwright (« element is not stable », animation `bob` infinie sur `.opening__pack`). Un clic réel à la souris ouvre bien le pack (résultat en 7,8 s) : artefact de test, pas un défaut.
- `flow.js`, étape 10 : erreur de script après le changement d'onglet (nœuds remplacés) ; la page Profil n'a pas été visitée.
- Les captures `shots/over-*` viennent d'un faux positif (menu latéral hors écran sur mobile) : aucun débordement réel.

## Annexe B — Contraste des jetons par thème

| Thème | texte atténué / surface | lien / surface | texte sur bouton primaire | blanc / danger | bord de champ / fond | bord de champ / surface | anneau de focus / fond |
|---|---|---|---|---|---|---|---|
| Électrik | 6,5 | 10,4 | 12,8 | 2,8 | 2,1 | 1,9 | 13,5 |
| Feu | 7,4 | 11,3 | 8,8 | 2,8 | 2,3 | 2,1 | 9,3 |
| Eau | 6,9 | 10,8 | 10,5 | 2,8 | 2,9 | 2,5 | 11,1 |
| Plante | 7,3 | 11,9 | 11,8 | 2,8 | 2,8 | 2,5 | 12,9 |
| Psy | 6,8 | 10,2 | 8,1 | 2,8 | 2,3 | 2,1 | 8,4 |
| Ténèbres | 6,7 | 9,9 | 7,9 | 2,8 | 2,0 | 1,8 | 8,1 |
| Dragon | 6,2 | 10,6 | 9,5 | 2,8 | 2,3 | 2,1 | 9,8 |
| Glace | 5,7 | 6,2 | 4,6 | 5,5 | 1,7 | 1,8 | 4,2 |
| Fée | 6,5 | 6,6 | 4,6 | 5,5 | 1,8 | 2,0 | 4,3 |

Seuils : 4,5:1 pour le texte, 3:1 pour les composants. Le texte atténué reste ≥ 4,5:1 sur `--surface-3` dans tous les thèmes (4,5 sur Glace, limite).

## Annexe C — Règles axe en infraction

| Règle | Gravité axe | Nœuds / écrans |
|---|---|---|
| `button-name` | critique | 24 / 24 (mobile) |
| `color-contrast` | sérieux | 115 / 38 |
| `label-content-name-mismatch` | sérieux | 48 / 48 |
| `link-in-text-block` | sérieux | 74 / 58 |
| `scrollable-region-focusable` | sérieux | 8 / 8 (mobile) |
| `region` | modéré | 60 / 60 |
| `heading-order` | modéré | 20 / 20 |
| `page-has-heading-one` | modéré | 2 / 2 |
| `landmark-no-duplicate-banner`, `-contentinfo`, `landmark-unique` | modéré | 8, 6 et 14 nœuds, fenêtres ouvertes |
