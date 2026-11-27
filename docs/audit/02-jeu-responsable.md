# Rapport 02 — Protection des joueurs, mineurs, publicité

Audit du 27 novembre 2026. Dépôt lu en lecture seule. Ce n'est pas un avis d'avocat.

## 1. Verdict

1. Le site montre de vraies protections (probabilités publiées, roulette honnête, limite, pause, rappel de session), mais elles restent en dessous du socle imposé aux opérateurs agréés français : plafonds de dépôts et de mises fixés avant de jouer, délai avant relèvement, auto-exclusion jusqu'à douze mois, message officiel actuel.
2. Deux points bloquent une ouverture en argent réel, quelle que soit la qualification retenue : l'âge n'est vérifié par rien, alors que le produit repose sur un univers qui attire les mineurs ; et plusieurs mécaniques poussent à rejouer vite (achat en un clic jusqu'à 2 490 €, mode rapide, roue de cashback, classement doté, minuteur de rachat, bonus qui bloque l'expédition).
3. Appliquer ces règles ne rend pas le produit licite s'il est qualifié de jeu d'argent (question traitée par un autre agent) : une « certification » de jeu responsable ne vaut pas autorisation.

## 2. Méthode et limites

- **Code lu** : les quatorze fichiers demandés, plus `js/views/pack.js`, `js/views/evolution.js`, `js/ui/topup.js`, `js/views/wallet.js`, `js/views/legal.js`, `js/ui/countdown.js`, `js/data/badges.js`, `js/data/packs.js`, `css/app.css`, `index.html`.
- **Mesure** : un script de mesure (non versé au dépôt) importe les modules du dépôt sans rien modifier et calcule, pack par pack, la part des tirages « fêtés » alors que la carte vaut moins que le prix payé. Résultat au paragraphe 4.2.
- **Sources** : Légifrance et anj.fr n'ont pas pu être ouverts depuis cette session (hôtes hors de la liste réseau autorisée), et le budget de recherche web de la session s'est épuisé avant la fin. **Aucun point de droit n'est donc « lu à la source officielle ».** Statuts utilisés :
  - **[R]** vu dans un résultat de recherche (extrait restitué par le moteur, le plus souvent d'une page Légifrance, ANJ ou Commission) ;
  - **[C]** connaissance générale non vérifiée ce jour.
- Tout texte destiné à être repris mot pour mot (message de mise en garde, clauses) doit être recopié depuis la source officielle.

## 3. Règles établies

### 3.1 Si le produit est un jeu d'argent : obligations des opérateurs autorisés

| Règle | Référence | Statut |
|---|---|---|
| Faire obstacle à la participation des mineurs, même émancipés ; interdiction de leur vendre ou offrir des jeux d'argent | Code de la sécurité intérieure (CSI), art. L320-8 — https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000039169746 | [R] |
| Message de mise en garde ; dispositifs de modération, d'auto-exclusion et d'autolimitation des dépôts et des mises ; information sur l'interdiction volontaire de jeux ; aucune communication commerciale vers les joueurs interdits | CSI, art. L320-11 (version du 1er janvier 2020 ; modifié par l'art. 39 de la loi n° 2026-725 du 3 août 2026 selon deux sources secondaires, contenu non vérifié) — https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000039169813 | [R] |
| Plafond de dépôts sur sept jours fixé **avant le premier dépôt** ; plafond de mises sur sept jours fixé **avant la première mise** ; baisse immédiate, hausse après un délai (48 heures selon l'extrait Légifrance, 72 heures selon un site tiers) | Décret n° 2010-518 du 19 mai 2010, art. 16 (rédaction en vigueur depuis le 1er octobre 2020) — https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000041839841/2020-10-01 | [R] |
| Auto-exclusion temporaire de 24 heures à 12 mois, d'effet immédiat ; pas de nouveau compte pendant l'exclusion ; exclusion définitive avec réouverture impossible avant 3 ans (ce dernier point : texte d'origine et document ANJ de 2017, non reconfirmé) | Décret n° 2010-518, art. 18 (version au 28 septembre 2025) — https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000041839851 | [R] |
| Fichier national des interdits de jeu, interdiction volontaire d'au moins trois ans | CSI, art. L320-9-1 — https://www.legifrance.gouv.fr/codes/id/LEGISCTA000039169684 | [C] |
| Cadre de référence de l'ANJ (droit souple, plans d'action annuels, identification des joueurs excessifs, gratifications « mesurées et proportionnées ») | Arrêté du 9 avril 2021 — https://anj.fr/sites/default/files/2021-04/Cadre%20de%20r%C3%A9f%C3%A9rence%20pr%C3%A9vention%20du%20jeu%20excessif%20et%20protection%20des%20mineurs.pdf | [R], contenu détaillé non lu |
| Message de mise en garde sur chaque support publicitaire, avec le numéro d'aide ; contenu fixé par arrêté | CSI, art. D320-2 (décret n° 2020-1349 du 4 novembre 2020, art. 45) — https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000025503132/LEGISCTA000042501521/ | [R] |
| **Formulation actuelle** : « Les jeux d'argent et de hasard peuvent être dangereux : pertes d'argent, conflits familiaux, addiction… », avec renvoi vers joueurs-info-service.fr | Arrêté du 11 juillet 2023 (publicité en ligne, depuis le 13 août 2023) — https://www.legifrance.gouv.fr/loda/id/JORFTEXT000047836085 | [R] |
| **Nouveau en 2026** : message affiché en permanence entre le haut de page et le contenu, puis messages spécifiques selon le parcours (limite de dépôt atteinte, limite de temps bientôt atteinte). En ligne : applicable le 6 septembre 2026. Abroge l'arrêté du 8 juin 2010 | Arrêté du 4 mars 2026, JO du 6 mars 2026 — https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053625941 | [R] |
| Publicité interdite si elle incite à une pratique excessive, banalise le jeu, l'associe à la réussite sociale ou le présente comme un moyen de gagner sa vie | CSI, art. D320-9 — https://justice.pappers.fr/loi/LEGITEXT000025503132/article/LEGIARTI000042501539 | [R] |
| Publicité interdite si elle met en scène des mineurs, présente le jeu comme un loisir naturel pour eux, ou utilise **des personnalités ou personnages de l'univers des mineurs** ; l'ANJ retient l'attrait exercé sur un public jeune | CSI, art. D320-10 — https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042501541 ; lignes directrices ANJ 2022-C-001 — https://anj.fr/sites/default/files/2022-02/Communication%202022-C-001_Lignes%20directrices%20PUB.pdf | [R] |
| Influenceurs : promotion des jeux d'argent seulement sur les plateformes capables d'exclure les moins de 18 ans, mécanisme activé ; clause obligatoire au contrat ; amende de l'art. L324-8-1 CSI | Loi n° 2023-451 du 9 juin 2023, art. 4, modifiée par l'ordonnance n° 2024-978 du 6 novembre 2024 — https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000047665823 ; note OFDT — https://www.ofdt.fr/sites/ofdt/files/2025-03/note_reglementation_jah_0.pdf | [R] ; la mention « interdit aux moins de dix-huit ans » n'a pas été reconfirmée |
| Procédure de sanction ANJ visant des bonus servis à des joueurs à risque (programme de fidélité) | Commission des sanctions, décision n° 2026-031 du 10 juillet 2026 — https://anj.fr/sites/default/files/2026-07/D%C3%A9cision%20n%C2%B02026-031%20du%2010072026.pdf | [R], issue non lue |
| Régime voisin (jeux à objets numériques monétisables) : message « Votre activité de jeu peut être dangereuse : pertes d'argent, conflits familiaux, addiction, etc. » sur la page d'accueil, à l'inscription et sur la page d'activité ; compte joueur avec vérification d'identité | Décret n° 2026-60 et arrêté du 4 février 2026 — https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053443778 | [R] ; ne vise pas des cartes physiques |

### 3.2 Règles qui s'appliquent même sans qualification de jeu d'argent

| Règle | Référence | Statut |
|---|---|---|
| Le mineur non émancipé est incapable de contracter ; ses actes courants sont annulables pour simple lésion ; **« la simple déclaration de majorité faite par le mineur ne fait pas obstacle à l'annulation »** | Code civil, art. 1146, 1148, 1149 — https://www.inc-conso.fr/node/8177 ; https://www.donneespersonnelles.fr/client-mineur-commande | [R], sources secondaires |
| Pratiques déloyales, appréciées au regard du consommateur vulnérable ; pratique agressive réputée : inciter directement les enfants à acheter ; fausse urgence | Code de la consommation, art. L121-1, L121-6, L121-7 (5°), L121-4 ; directive 2005/29/CE, annexe I, point 28 — https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006069565/2025-07-16 | [C], numérotation à vérifier |
| Réseau CPC et Commission (mars 2025) : action contre Star Stable et principes sur les monnaies virtuelles ; un service est jugé « destiné aux enfants » d'après sa conception, pas d'après ses conditions ; les offres à durée limitée font pression sur les enfants | https://www.forbrukertilsynet.no/eng-articles/national-consumer-authorities-and-commission-take-action-on-harmful-practices-in-the-gaming-industry ; https://techinsights.linklaters.com/post/102k6t4/game-changer-eu-introduces-consumer-protection-guidance-for-in-game-virtual-curr | [R] |
| Règlement DSA (UE) 2022/2065, art. 25 et 28 : visent les **plateformes en ligne**. Un vendeur unique sans contenu d'utilisateurs n'en est probablement pas une (analyse à valider). Lignes directrices de l'article 28 : l'autodéclaration d'âge n'est pas une mesure appropriée ; interdire les mineurs dans les conditions ne suffit pas s'ils utilisent le service | Lignes directrices C/2025/5519 du 14 juillet 2025 — https://eur-lex.europa.eu/eli/C/2025/5519/oj | [R] |
| Vérification de l'âge : application européenne en test dans cinq pays dont la France en 2026 | https://www.banquedesterritoires.fr/la-france-va-tester-un-systeme-de-verification-de-lage-en-ligne | [R] |
| **Digital Fairness Act** : proposition présentée par la Commission le 11 novembre 2026 (communiqué IP/26/2407 ; COM(2026) 1100 selon une source), avec une révision du règlement CPC. Selon les analyses : « systèmes de récompense variable payants » (loot boxes, roues, paquets de cartes) avec probabilités affichées, désactivation possible et interdiction aux mineurs ; liste noire d'interfaces manipulatrices ; conception addictive. Application 12 mois après l'entrée en vigueur ; adoption jugée improbable avant 2028 | https://ec.europa.eu/commission/presscorner/detail/en/ip_26_2407 ; https://commission.europa.eu/news-and-media/news/making-your-online-experience-fairer-2026-11-11_en ; https://www.pinsentmasons.com/out-law/analysis/digital-fairness-act-proposal-puts-video-game-monetisation-models-in-focus | [R], sources secondaires ; champ sur les lots physiques non vérifié |
| DGCCRF : fiche pratique sur les jeux vidéo qui mentionne les loot boxes ; aucune décision ciblée trouvée. CNIL : rien de spécifique trouvé | https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/jeux-video-les-bons-reflexes-avant-de-jouer-et-dacheter | [R] |
| Public jeune des cartes Pokémon | UFC-Que Choisir, « Cartes Pokémon : ça spécule à la récré » — https://www.quechoisir.org/actualite-cartes-pokemon-ca-specule-a-la-recre-n97164 | [R], titre seulement |

### 3.3 Bonnes pratiques de conception (Gambling Commission britannique)

| Règle | Référence | Statut |
|---|---|---|
| Depuis le 17 janvier 2025, pour tous les jeux de casino en ligne : cycle de jeu d'au moins 5 secondes hors machines à sous ; aucune fonction qui raccourcit l'attente du résultat ; pas de jeux simultanés ; **pas de célébration d'un retour inférieur ou égal à la mise** | RTS 14 — https://www.gamblingcommission.gov.uk/standards/remote-gambling-and-software-technical-standards/rts-14-responsible-product-design | [R] |
| Relance automatique interdite (RTS 8) ; rappel de session avec possibilité de quitter (RTS 13) ; pas de quasi-gain fabriqué (RTS 7) ; machines à sous : 2,5 secondes | idem | [C] |
| Conditions de mise d'un bonus plafonnées à 10 fois son montant ; offres mêlant plusieurs produits interdites (annonce du 26 mars 2025 ; application le 19 janvier 2026 selon la majorité des sources, date à confirmer) | https://www.gamblingcommission.gov.uk/news/article/gambling-promotions-to-be-safer-and-simpler | [R] |
| Récompenses de fidélité : leur valeur ne doit pas croître plus vite que la dépense | LCCP, code de responsabilité sociale 5.1.1 | [C] |

## 4. Constats, du plus grave au moins grave

### 4.1 Âge : aucune vérification, sur un produit qui attire les mineurs — **bloquant** (argent réel)

- `js/theme.js` l. 178 : « En entrant, tu confirmes avoir 18 ans ou plus », en petit, sous un sélecteur de thème intitulé « Choisis ton univers ». Ligne 204 : la touche Échap valide l'entrée. Aucune action ne porte sur l'âge.
- `js/views/auth.js` l. 40 : une case « Je certifie avoir 18 ans ou plus ». Pas de date de naissance.
- `js/views/transparency.js` l. 35 : la vérification d'identité est annoncée « avant tout retrait ». Un mineur pourrait donc déposer et jouer.
- Le ton (tutoiement, « Choisis ton univers »), les badges calqués sur les types Pokémon (`js/data/badges.js`) et les personnages eux-mêmes ciblent de fait un public jeune.
- Conséquences : si jeu d'argent, manquement à l'art. L320-8 CSI, et toute publicité montrant ces personnages heurte l'art. D320-10 CSI. Si vente, chaque achat d'un mineur est annulable malgré la case cochée (Code civil, art. 1149), avec remboursement ; le produit risque d'être jugé « destiné aux enfants » d'après sa conception (position CPC).

### 4.2 Mécaniques qui poussent à rejouer — **élevé**

1. **Vitesse et achat sans friction.** `js/views/pack.js` l. 186-196 : la confirmation n'apparaît qu'au tout premier achat (« Cet accord vaut pour tes prochains achats ») ; ensuite un clic achète jusqu'à 10 packs (`js/config.js` l. 34), soit 2 490 € avec le pack à 249 €. `js/views/opening.js` : mode « Rapide » (l. 65 et 337-355), révélation en 1,1 à 1,4 s au lieu de 7,2 s ; un clic sur la roulette l'arrête (l. 441-444) ; « Tout révéler » (l. 66) ; les packs suivants s'ouvrent seuls (l. 422-423). Le bouton principal après chaque résultat est « Rouvrir un… » (l. 145 et 207). Référence britannique : 5 secondes minimum, aucune fonction d'accélération.
2. **Pertes fêtées comme des gains.** `js/views/opening.js` l. 47 et 289-296, `js/ui/effects.js` l. 96-103 : particules et fanfare dépendent du palier de rareté, pas du rapport entre la cote et le prix. Mesure sur le stock de démonstration : 39 à 63 % des tirages sont fêtés ; **16 à 33 % de tous les tirages sont fêtés alors que la carte cote moins que le prix payé**, soit 43 à 59 % des tirages fêtés (56 à 69 % si l'on compare le rachat à 90 % au prix). La carte ne vaut au moins le prix que dans 20 à 30 % des cas. L'en-tête du récapitulatif porte une icône de fête même en perte (l. 112).
3. **Roue de cashback.** `js/config.js` l. 64, `js/store.js` l. 594-617 : un droit acquis est transformé en pari (43 % de chances de le diviser par deux). `js/views/rewards.js` l. 104-108 : pièces et particules même à ×0,5. La roue reste accessible pendant une pause. Une pastille rappelle la cagnotte dans le menu (`js/ui/shell.js` l. 147-152).
4. **Bonus.** `js/config.js` l. 86 : mise de 10 fois, au plafond britannique. Mais il est crédité d'office (`js/store.js` l. 379-383), mis en avant au moment de recharger (`js/ui/topup.js` l. 36), et **une carte payée même très partiellement en bonus ne peut pas être expédiée** tant que le bonus n'est pas joué (`js/store.js` l. 236) : le joueur doit continuer à miser pour recevoir un bien qu'il a payé.
5. **Classement doté, XP, badges.** 1 € dépensé = 1 point, dix premiers récompensés, compte à rebours de remise à zéro (`js/views/leaderboard.js` l. 106-110) ; taux de cashback qui monte de 4 à 12 % avec le volume (`js/data/badges.js`) ; anneau d'XP visible en permanence (`js/ui/shell.js` l. 138-140). Ces dispositifs récompensent les plus gros joueurs, à rebours de la doctrine ANJ sur les bonus aux joueurs à risque.
6. **Minuteur de rachat.** 90 % pendant 10 minutes puis 85 % (`js/config.js` l. 24-31), avec compte à rebours à la seconde (`js/views/opening.js` l. 140 et 218). La vente se fait en un geste, sans confirmation, dans l'écran d'ouverture (l. 457-481), alors que `js/views/collection.js` l. 125 en demande une. Le minuteur pousse à convertir la carte en solde, puis à rejouer.
7. **Mise en avant des gains.** Onglet « Gros lots » et colonne « Gain ×N » (`js/views/home.js` l. 107-118), badge « Hot », étiquette « dernier », « Prochain lot dans N packs » (`js/views/giveaway.js` l. 72).
8. **Évolution** : après un échec, le bouton principal est « Nouvelle tentative » (`js/views/evolution.js` l. 135) ; les cotes misées échappent à la limite de dépense.

### 4.3 Limites — **élevé**

- Une seule limite : dépense quotidienne en packs (`js/views/settings.js` l. 11). Par défaut : aucune (`js/store.js` l. 52).
- Relèvement et suppression immédiats (`js/store.js` l. 660-663), sans délai.
- Ne couvre ni les dépôts (`deposit()`, l. 373-386, jusqu'à 1 000 € par recharge, sans plafond de nombre), ni les cotes misées en Évolution, ni la roue.
- Pas de période de sept jours, pas de limite de temps, pas d'obligation de fixer un plafond avant le premier dépôt.

### 4.4 Pause et auto-exclusion — **élevé** en production

- Trois durées : 24 heures, 7 jours, 30 jours (`js/views/settings.js` l. 74-76). Rien au-delà, pas de clôture définitive.
- La pause bloque les achats et l'Évolution, mais ni les dépôts, ni la roue, ni l'inscription aux giveaways.
- « Réinitialiser la démo » efface la pause (`resetDemo()`, `js/store.js` l. 363-368) alors que l'écran affirme qu'elle ne peut pas être levée. `setPause(0)` la lève (l. 665-668).
- Aucune information sur l'interdiction volontaire de jeux.

### 4.5 Message de mise en garde — **moyen**

- `js/ui/shell.js` l. 123 : « Jouer comporte des risques : endettement, isolement, dépendance… », formulation de l'arrêté du 8 juin 2010, abrogé pour l'en-ligne depuis le 6 septembre 2026.
- Le message est en pied de page, masqué pendant l'ouverture (`css/app.css` l. 806), sans lien vers joueurs-info-service.fr. Rien à l'inscription ni à la recharge.
- Reprendre le message officiel des jeux d'argent revient à reconnaître la nature du risque : la rédaction finale dépend de la qualification.

### 4.6 Rappel de session — **moyen**

- Désactivable (« Jamais », `js/views/settings.js` l. 13). Remis à zéro à chaque rechargement (`js/ui/reality-check.js` l. 9).
- Ignore les cotes perdues en Évolution et la roue. Reporté pendant l'ouverture (l. 37-38).
- Bouton principal « Continuer », en focus automatique (l. 27) ; aucun bouton pour arrêter.

### 4.7 Communication et publicité — **élevé** au lancement

- Giveaways : achat obligatoire et abonnement à un réseau social (`js/views/giveaway.js` l. 55-57), sur des plateformes à forte audience mineure.
- Accroche « 86 – 92 % retour affiché » (`js/views/home.js` l. 160) ; vocabulaire « Jeux », « Jouer », « mise », « gain ».
- Toute promotion par influenceur relèverait de l'art. 4 de la loi de 2023 si le produit est un jeu d'argent, et les visuels de personnages de l'art. D320-10 CSI.

### 4.8 Écarts de cohérence — **faible à moyen**

- `js/views/legal.js` l. 24 annonce un accord de renonciation au droit de rétractation « recueilli à chaque achat » ; le code ne le recueille qu'une fois.
- La démonstration offre 100 € de crédits fictifs et simule ces mécaniques pour tout visiteur. `index.html` l. 8 porte bien `noindex, nofollow`.

## 5. Ce qui est déjà bien fait

- Probabilités publiées et recalculées ; retour théorique, cote moyenne et part des cartes valant au moins le prix affichés avant l'achat (`js/views/pack.js` l. 56-60, `js/views/transparency.js`).
- Roulette honnête : cartes voisines tirées avec les mêmes probabilités, aucun quasi-gain fabriqué ; résultat fixé à l'achat.
- Contenus simulés étiquetés (« Simulé », « Joueurs fictifs », « Gagnants fictifs », « Ventes simulées »).
- Limite quotidienne contrôlée avant l'achat, sur les dépenses brutes ; pause confirmée, non annulable dans l'interface.
- Rappel de session actif par défaut (30 minutes) avec le bilan net ; bilan cumulé sur le profil.
- Phrases franches : « tous les jeux du site rendent moins que ce qu'on y met », « Ne compte jamais sur un pack pour te refaire », « Viser le classement coûte toujours plus que ce qu'il rapporte » ; écart au prix payé affiché en rouge.
- Numéro Joueurs Info Service en pied de page, dans les paramètres et sur la page Transparence.
- Sons et animations désactivables ; respect de « réduire les animations ».
- Argent déposé toujours retirable, bonus séparé, conditions annoncées avant le dépôt ; crédit de bienvenue prévu à 0 en production.
- Pas de relance automatique des achats ; confirmation et chance affichée à chaque Évolution ; comptes à rebours tous adossés à une échéance réelle ; aucune case pré-cochée.
- La page Transparence liste déjà la vérification d'identité et l'application côté serveur comme préalables.

## 6. Actions recommandées

### (a) Dans le site et le code, par priorité

**Priorité 1**

1. **Âge.** `js/theme.js` : sortir la mention d'âge du sélecteur de thème ; écran dédié avec saisie de la date de naissance, refus en dessous de 18 ans, Échap ne valide plus (l. 204). `js/views/auth.js` l. 40 : date de naissance obligatoire, et texte « Ton identité et ton âge seront vérifiés avant ton premier dépôt ». `js/views/transparency.js` l. 35 : remplacer « avant tout retrait » par « avant tout dépôt ». En production : compte bloqué tant que l'âge n'est pas vérifié par un prestataire.
2. **Achat.** `js/views/pack.js` l. 186-196 : supprimer la mémorisation `instant` ; confirmation à chaque achat avec le montant, la dépense du jour et la limite restante. `js/config.js` l. 34 : `maxPacksPerOrder` à 3 au plus, ou plafond par commande.
3. **Vitesse.** `js/views/opening.js` : retirer « Rapide » (l. 65, 337-355), l'arrêt au clic (l. 441-444) et l'ouverture automatique des packs suivants (l. 422-423) ; retirer le réglage `fast` (`js/views/settings.js` l. 50, `js/store.js` l. 54) ; au moins 5 secondes entre deux achats.
4. **Célébrations.** `js/views/opening.js` l. 47 et 289-296, `js/ui/effects.js` l. 96-103 : déclencher particules et fanfare seulement si `owned.value >= pack.price` ; sinon son neutre. Ligne 112 : icône neutre si le bilan est négatif.
5. **Relance.** `js/views/opening.js` l. 145 et 207 : bouton principal « Voir ma collection » ; « Rouvrir » en lien discret ou supprimé. `js/views/evolution.js` l. 135 : même traitement.
6. **Limites.** `js/store.js` et `js/views/settings.js` : plafond de dépôts et plafond de dépenses sur sept jours, à fixer avant le premier dépôt (`js/ui/topup.js`), sans option « Aucune » ; baisse immédiate, hausse après 48 heures au moins ; compter les cotes misées en Évolution ; contrôler limite et pause dans `deposit()`, `evolve()` et `claimCashback()`.
7. **Pause.** `js/views/settings.js` l. 74-76 : ajouter 3, 6 et 12 mois et une clôture définitive ; bloquer aussi dépôts, roue et giveaways ; `resetDemo()` conserve `limits` ; supprimer la levée par `setPause(0)`.

**Priorité 2**

8. **Roue de cashback** : la supprimer (`js/config.js` l. 64, `js/views/rewards.js` l. 33, `js/store.js` l. 600-608) et verser le cashback automatiquement ; retirer la pastille (`js/ui/shell.js` l. 147-152).
9. **Bonus** : sur acceptation explicite (case non cochée dans `js/ui/topup.js`) ; ne plus bloquer l'expédition (`js/store.js` l. 236 : expédition permise, part de bonus reprise au prorata) ; ne pas afficher l'offre quand la recharge vient d'un solde insuffisant en cours d'achat.
10. **Classement et badges** : retirer la dotation et le compte à rebours (`js/views/leaderboard.js` l. 67-92 et 108, `js/config.js` l. 74-76) ; taux de cashback unique (`js/data/badges.js`) ; retirer l'anneau d'XP de la barre haute.
11. **Rachat** : un seul taux pendant au moins 14 jours, ou à défaut 24 heures ; plus de compte à rebours à la seconde (`js/views/opening.js` l. 140 et 218, `js/views/collection.js` l. 94) ; confirmation avant vente dans l'écran d'ouverture (l. 457-481).
12. **Message.** `js/ui/shell.js` l. 67 et 123, `css/app.css` l. 806 : bandeau fin en haut de page, visible aussi pendant l'ouverture, formulation actuelle recopiée de l'arrêté du 4 mars 2026, lien vers joueurs-info-service.fr ; rappel à l'inscription et à la recharge.
13. **Rappel de session.** `js/views/settings.js` l. 13 : retirer « Jamais » ; `js/ui/reality-check.js` : début de session conservé entre rechargements, cotes perdues en Évolution comptées, boutons « Faire une pause » et « Me déconnecter » au même niveau que « Continuer », sans focus automatique ; durée et bilan visibles dans la barre haute.

**Priorité 3**

14. `js/views/home.js` l. 107-118 : retirer « Gros lots » ; afficher à la place la part des ouvertures sous le prix. Retirer « Hot » et « dans N packs ».
15. `js/views/giveaway.js` l. 55-57 : voie gratuite, plus de condition d'abonnement à un réseau social.
16. `js/views/legal.js` l. 24 : aligner le texte et le code.
17. Vocabulaire « Jeux », « Jouer », « mise », « gain » : à trancher avec le juriste.
18. Démonstration : garder `noindex`, ajouter un accès par mot de passe.

### (b) Structure, entreprise, professionnel

- Trancher d'abord la qualification : elle décide si ces règles s'appliquent comme obligations légales ou comme précautions de droit de la consommation.
- Choisir un prestataire de vérification d'âge et d'identité ; analyse d'impact sur la protection des données pour ces traitements et pour le suivi des comportements.
- Faire valider par un avocat : le blocage d'expédition lié au bonus, la renonciation unique au droit de rétractation, le règlement des giveaways, le message de mise en garde retenu.
- Politique de communication écrite : aucun personnage ou visuel attractif pour les mineurs en publicité, aucun créateur à audience jeune, exclusion des mineurs activée sur les plateformes, clause contractuelle.
- Procédure interne : repérage des joueurs à risque, arrêt des sollicitations commerciales vers les comptes en pause, référent désigné.
- Suivre le Digital Fairness Act et lire la loi n° 2026-725 du 3 août 2026.

## 7. Non vérifié ou à confirmer

- Aucun texte n'a pu être lu à la source : `www.legifrance.gouv.fr` et `www.anj.fr` doivent être autorisés dans les réglages réseau de la session. Le budget de recherche s'est épuisé avant les dernières vérifications.
- Loi n° 2026-725 du 3 août 2026 (art. 37 à 42) : modification de l'art. L320-11 CSI, éventuelles limites de pertes pour les 18-25 ans en 2027. Source secondaire : https://www.reynaud-avocat.com/2026/09/01/jeux-d-argent-ce-que-change-la-loi-du-3-ao%C3%BBt-2026/
- Texte exact du message de l'arrêté du 4 mars 2026 ; sort de l'arrêté du 11 juillet 2023.
- Délai de relèvement d'un plafond : 48 ou 72 heures. Délai de trois ans après clôture définitive. Durée de l'interdiction volontaire de jeux.
- Art. L320-8 CSI : exigence de la date de naissance à chaque visite. Art. L320-12 CSI : non lu.
- Loi n° 2023-451, art. 4 : texte en vigueur et mention obligatoire.
- Code de la consommation, art. L121-7 et L121-4 : numérotation et rédaction.
- Lignes directrices de l'article 28 du DSA : passage sur les loot boxes et monnaies virtuelles. Qualification du site comme plateforme en ligne.
- Digital Fairness Act : texte officiel, et application aux lots physiques tirés au sort.
- Cadre de référence de l'ANJ : contenu détaillé. Décision n° 2026-031 : issue. Décret n° 2026-60 : règles de compte joueur.
- Gambling Commission : date d'application du plafond de 10 fois ; rédaction de RTS 8 et RTS 13 ; code 5.1.1.
- Interdiction des réseaux sociaux aux moins de 15 ans (adoption en juillet 2026, censure éventuelle en août 2026) : une seule source, non retenue.
- Les pourcentages du paragraphe 4.2 valent pour le stock de démonstration du dépôt ; ils changeront avec le stock réel.
