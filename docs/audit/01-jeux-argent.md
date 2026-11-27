# Rapport 01 — Qualification en droit français des jeux d'argent et de hasard

Date : 27 novembre 2026. Analyse d'un juriste, pas un avis d'avocat.

**Limite de méthode, à lire d'abord.** Aucune source officielle n'a pu être ouverte directement : l'outil de lecture de pages ne résout ni `www.legifrance.gouv.fr` ni `anj.fr` depuis cette session (hôtes hors de la liste réseau autorisée), et le quota de recherche web partagé entre les agents s'est épuisé après environ 25 requêtes. Aucun point n'est donc classé « lu à la source officielle ». Statuts utilisés :

- **[R]** vu dans un résultat de recherche (extrait de la page citée restitué par le moteur, page non ouverte) ;
- **[G]** connaissance générale non vérifiée dans cette session ;
- **[D]** lu dans le dépôt.

Aucune décision de justice n'est citée par son numéro : je n'ai pu en vérifier aucune.

---

## 1. Verdict en trois lignes

1. Tel qu'il est conçu (pack tiré au sort, rachat immédiat contre un solde retirable en euros, Évolution, roue, bonus à condition de mise), le produit réunit les quatre critères de l'article L320-1 du code de la sécurité intérieure : c'est un jeu d'argent et de hasard en ligne prohibé, pas une « vente à contenu aléatoire ». Le nom donné à l'opération est indifférent (« sous quelque dénomination que ce soit »).
2. Il n'existe en novembre 2026 ni agrément, ni licence, ni « certification » qui permette de l'exploiter : l'ANJ n'agrée en ligne que les paris sportifs, les paris hippiques et le poker ; les casinos en ligne ne sont pas légalisés ; le régime JONUM ne couvre pas des cartes physiques et interdit précisément le rachat des lots par l'opérateur.
3. Exposition pénale personnelle des dirigeants : 3 ans et 90 000 € (7 ans et 200 000 € en bande organisée), plus blocage, déréférencement et gel des flux. La seule voie défendable passe par un autre produit : boutique à prix fixe avec tirages promotionnels accessoires (D), ou participation réellement gratuite (E).

---

## 2. Constats, du plus grave au moins grave

### C1 — Pack tiré au sort + rachat + solde retirable : jeu d'argent prohibé — **bloquant**

- **Fondement.** CSI, art. L320-1, version en vigueur depuis le 1er janvier 2020 (ordonnance n° 2019-1015 du 2 octobre 2019) : « Sous réserve des dispositions de l'article L. 320-6, les jeux d'argent et de hasard sont prohibés. » « Sont réputés jeux d'argent et de hasard et interdits comme tels toutes opérations offertes au public, sous quelque dénomination que ce soit », qui font naître l'espérance d'un gain dû, même partiellement, au hasard et pour lesquelles un sacrifice financier est exigé des participants. « Cette interdiction recouvre les jeux dont le fonctionnement repose sur le savoir-faire des joueurs. » « Le sacrifice financier est établi dans les cas où une avance financière est exigée de la part des participants, même si un remboursement ultérieur est rendu possible par le règlement du jeu. » **[R]** (phrases entre guillemets restituées par le moteur depuis Légifrance ; le membre de phrase central est restitué en paraphrase) — https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000039182525
- **Application.** Offre au public : oui. Sacrifice financier : le prix du pack (9,95 à 249 €). Hasard : tirage HMAC sur table de probabilités. Espérance d'un gain : le site attribue lui-même une cote à chaque lot, affiche un « Retour » et une probabilité « Carte ≥ prix », et convertit le lot en euros retirables à 90 %. Le circuit réel est : mise en euros, tirage, paiement en euros. La carte n'est qu'un jeton intermédiaire qui, le plus souvent, ne quitte jamais le « coffre ».
- **Éléments du site [D].** `js/config.js` (`buybackRate`, `buybackLaterRate`, `withdrawal`), `js/views/pack.js` (« Retour », « Carte ≥ prix »), `js/views/wallet.js` (retrait), `js/views/opening.js`, CGV « Rachat » dans `js/views/legal.js`.
- **Argument du concurrent** (« vente de produit à caractère aléatoire », « avoirs = crédits commerciaux internes », `docs/ANALYSE_CARDMATIK.md` §6 **[D]**) : il se heurte au texte même (« sous quelque dénomination que ce soit ») et à la doctrine du régulateur, pour qui le caractère monétisable du lot fait basculer dans le jeu d'argent (voir C8).

### C2 — Aucun titre ne permet d'exploiter ce produit en ligne — **bloquant**

- **Fondement.** CSI, art. L320-6 (dérogations limitatives) : le 6° ne vise que les paris hippiques en ligne, les paris sportifs en ligne et les jeux de cercle en ligne, sous agrément délivré en vertu des articles 11, 12 et 14 de la loi n° 2010-476 du 12 mai 2010 ; les jeux de casino en ligne n'y figurent pas. Les 1° à 5° visent les casinos, les jeux exploités par des non-opérateurs, les loteries et paris sous droits exclusifs ; le 7° vise les opérations publicitaires de l'article L121-20 du code de la consommation. **[R]** — https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000039169738/
- **Casinos en ligne.** Un amendement d'ouverture au PLF 2025 a été retiré à l'automne 2024 après l'opposition des casinos terrestres ; la concertation annoncée fin 2024 a été suspendue après la chute du gouvernement en décembre 2024 ; un amendement lié au PLF 2026 (taxe de 55,6 % du produit brut des jeux) n'a pas abouti ; à l'automne 2026, aucun texte n'est adopté ni inscrit à l'ordre du jour. **[R]**, sources de faible fiabilité (guides commerciaux), à confirmer sur les sites du Parlement et de l'ANJ — https://the-bonusempire.fr/plf-2026-legalisation-casinos-en-ligne-ou-en-est-le-debat/ ; campagne ANJ rappelant l'illégalité : https://anj.fr/casinos-en-ligne-lanj-lance-une-campagne-dinformation
- **JONUM.** Loi n° 2024-449 du 21 mai 2024, art. 40 (en vigueur depuis le 23 mai 2024) : expérimentation de trois ans à compter de la promulgation (donc jusqu'en mai 2027, sauf prorogation), pour des jeux en ligne permettant à des majeurs ayant consenti un sacrifice financier d'obtenir par le hasard des « objets numériques monétisables », définis comme « les éléments de jeu qui confèrent aux seuls joueurs un ou plusieurs droits associés au jeu et qui sont susceptibles d'être cédés, directement ou indirectement, à titre onéreux à des tiers » ; pas de gain monétaire ; ces objets ne peuvent pas être cédés à l'entreprise qui les a émis. Art. 41 : interdiction pour l'entreprise de les acquérir, directement ou par personne interposée. Décret n° 2026-60 du 4 février 2026 (JO du 6, en vigueur le 7) : six catégories de jeux, exigence d'une vraie dimension ludique, récompenses accessoires (en nature, crypto-actifs) plafonnées, déclaration préalable à l'ANJ. Plafonds selon l'ANJ : 20 % du chiffre d'affaires annuel du jeu et 25 000 € par joueur et par an. **[R]** — https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000049563458 ; https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000049563459 ; https://www.legifrance.gouv.fr/loda/id/JORFTEXT000053443861/2026-10-21 ; https://anj.fr/jeux-objets-numeriques-monetisables-jonum
- **Conséquence.** Une carte physique n'est pas un « élément de jeu » numérique ; un lot en nature n'est admis qu'à titre accessoire et plafonné ; le rachat par l'opérateur, cœur du modèle, est la ligne rouge du régime. Le JONUM ne peut pas couvrir le produit.
- **« Certifications ».** L'audit d'un générateur d'aléa par un laboratoire et le « provably fair » ne confèrent aucun droit d'exploiter : ce sont des exigences techniques imposées à des opérateurs déjà agréés **[G]**. Le tirage vérifiable prouve au contraire le critère du hasard.
- **Éléments du site [D].** `js/data/faq.js` l. 86 (« les agréments nécessaires »), `js/views/transparency.js` l. 32-33 (« Tirage certifié … laboratoire agréé »).

### C3 — Évolution : pari à cote choisie avec avantage de la maison — **bloquant**

- **Fondement.** CSI, art. L320-1 (ci-dessus) **[R]**.
- **Application.** Mise : une carte dont le site fixe la cote et qu'il rachète en euros (valeur patrimoniale, donc sacrifice financier). Hasard pur : chance = (cote misée / cote visée) × (1 − marge de 6 à 12 %). Gain : une carte plus cotée, elle-même rachetable. C'est le mécanisme « upgrader » des sites de jeu sur skins, c'est-à-dire une roulette à probabilité choisie. Même sans rachat, miser un bien de valeur pour en gagner un plus cher par le sort reste un jeu d'argent : aucune variante ne le sauve.
- **Éléments du site [D].** `js/views/evolution.js`, `RULES.evolution` dans `js/config.js`, fonction `evolve` de `js/store.js`.

### C4 — Sanctions encourues par l'exploitant et ses dirigeants — **bloquant**

| Risque | Texte | Statut |
|---|---|---|
| Exploitation d'opérations de jeux en violation de L320-1 : 3 ans et 90 000 € ; 7 ans et 200 000 € en bande organisée | CSI, art. L324-1 (version du 1er janvier 2020) — https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000039182736 | [R] |
| Offre en ligne au public sans agrément ni droit exclusif : 3 ans et 90 000 € ; 7 ans et 200 000 € en bande organisée | Loi n° 2010-476, art. 56, I — https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000028689534 | [R] |
| Peines complémentaires des personnes physiques : interdiction des droits civiques, civils et de famille, confiscation des biens ayant servi à l'infraction ou qui en sont le produit, affichage ou diffusion de la décision, fermeture d'établissement | CSI, art. L324-13 — https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049778900 | [R] |
| Personne morale : amende quintuplée (450 000 € ; 1 000 000 € en bande organisée) et peines de l'art. 131-39 du code pénal (dissolution, interdiction d'exercer, fermeture, confiscation) | C. pén., art. 121-2, 131-38, 131-39 | [G] ; renvoi vu en extrait [R], article de rattachement non identifié |
| Publicité pour un site non autorisé : 100 000 € d'amende, pouvant être portée au quadruple des dépenses publicitaires ; vise aussi influenceurs, affiliés et créateurs | Loi n° 2010-476, art. 57 (version du 4 mars 2022) — https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000045294013 | [R] |
| Blocage et déréférencement administratifs : mise en demeure de l'éditeur par le président de l'ANJ, puis injonction aux fournisseurs d'accès, moteurs de recherche et annuaires ; environ deux mois ; 232 ordres portant sur 1 337 URL en 2024 ; liste noire publique | Loi n° 2010-476, art. 61 (version du 4 mars 2022) — https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000038791253/ ; https://anj.fr/lutter-contre-loffre-illegale | [R] |
| Gel des flux financiers : interdiction, pour six mois renouvelables, de tout mouvement ou transfert de fonds vers ou depuis les comptes de l'opérateur illégal | Code monétaire et financier, art. L563-2 — https://www.lexbase.fr/texte-de-loi/code-monetaire-et-financierl5632/L8176LSM.html | [R], autorité compétente à confirmer (les sources divergent ; une modification d'août 2026 est évoquée) |
| Bande organisée : groupement formé en vue de préparer l'infraction (associés, développeur, responsable marketing) | C. pén., art. 132-71 | [G] |
| Complicité de ceux qui aident sciemment ; blanchiment du produit (5 ans, 375 000 €) ; nullité des contrats et demandes de restitution des joueurs | C. pén., art. 121-7 et 324-1 ; C. civ., art. 1162 | [G] |

La responsabilité pénale est personnelle : le dirigeant de droit ou de fait répond de l'infraction, la société ne fait pas écran **[G]**.

### C5 — Roue du cashback : jeu autonome — **élevé**

- **Application.** La cagnotte est encaissable « telle quelle » ; choisir la roue, c'est risquer une créance acquise (×0,5 dans 43 % des cas) pour espérer ×5. Mise, hasard, gain en solde retirable, offre au public : les quatre critères sont réunis indépendamment du reste.
- **Fondement.** CSI, art. L320-1 **[R]**.
- **Éléments du site [D].** `claimCashback('wheel')` dans `js/store.js` (l. 594-617), `RULES.cashback.wheel`, `js/views/rewards.js`.

### C6 — Giveaways à ticket payant, financés par 5 % du prix — **élevé**

- **Application.** Hasard et gain : oui. Sacrifice financier : le ticket ne s'obtient qu'en achetant un pack, il n'y a pas de voie gratuite, et 5 % du prix sont affectés à la cagnotte : le prix contient la mise. L'exception des loteries publicitaires (CSI, art. L320-6, 7° ; C. conso., art. L121-20 : opérations promotionnelles licites tant qu'elles ne sont pas déloyales au sens de l'art. L121-1) ne peut pas jouer : le produit support est lui-même prohibé, et la loterie est financée par les participants. **[R]** — https://justice.pappers.fr/loi/LEGITEXT000006069565/article/LEGIARTI000032227240 ; https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/loterie-des-pratiques-commerciales-reglementees
- **Éléments du site [D].** `js/data/giveaways.js` (`fundRate: 0.05`, un ticket par pack), `js/views/giveaway.js` l. 71.

### C7 — Bonus de premier dépôt à condition de mise — **élevé (accessoire)**

- **Application.** Ce n'est pas un jeu en soi (pas d'aléa dans l'attribution). C'est une gratification qui oblige à rejouer dix fois son montant sur des jeux de hasard : signature d'un casino en ligne, facteur aggravant et preuve d'intention. Il tombe avec le jeu qu'il accompagne.
- **Éléments du site [D].** `RULES.bonus` (`wagering: 10`), CGU « Bonus et cashback ».

### C8 — Pack sans rachat ni retrait : cela reste une loterie d'objets — **élevé**

- **Fondement.** L'ancien article L322-2 du CSI (issu de la loi du 21 mai 1836) réputait loteries « les ventes d'immeubles, de meubles ou de marchandises effectuées par la voie du sort » ; il a été abrogé au 1er janvier 2020 et absorbé par la définition générale de l'article L320-1 **[R]** — https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000028749215/2026-03-22. Rapport d'activité ARJEL 2017-2018 : toutes les loot boxes ne sont pas des jeux d'argent, mais il en va autrement « lorsque le lot est monétisable », et la légalité est discutable lorsque le lot peut être cédé hors de la plateforme **[R]** — https://anj.fr/sites/default/files/2019-12/rapport-activite-Arjel%202018.pdf
- **Application.** Le gain peut être en nature. Une carte physique est cessible par nature, et le site en publie lui-même la cote. Voir la réponse à la question 2.

### C9 — Classement mensuel doté — **élevé comme accessoire, incertain à titre autonome**

- **Application.** Les points viennent du seul montant dépensé (1 € = 1 point) : ni hasard ni adresse, donc le critère du hasard manque probablement à titre autonome. Mais c'est une prime au volume de jeu sur une offre prohibée ; elle tombe avec elle. Dans un modèle licite, elle relèverait du droit de la consommation (hors de mon périmètre).
- **Éléments du site [D].** `RULES.leaderboardShare`, `pointsPerEuro`, `js/views/leaderboard.js`.

### C10 — Le site laisse croire qu'un agrément existe — **moyen**

- `js/data/faq.js` l. 86 : « L'ouverture au public attend … les agréments nécessaires » ; `js/views/transparency.js` l. 33 : « générateur d'aléa audité par un laboratoire agréé ». Aucun agrément n'est accessible à ce produit : ces phrases sont inexactes et serviraient de preuve d'intention.

### C11 — La démonstration actuelle — **faible**

- Voir la réponse à la question 5.

---

## 3. Réponses aux six questions

### Question 1 — Les quatre critères, mécanique par mécanique

| Mécanique | Offre au public | Sacrifice financier | Hasard | Espérance d'un gain | Conclusion |
|---|---|---|---|---|---|
| (a) Pack + rachat en solde retirable | oui | oui (prix) | oui | oui (cote affichée, euros) | réunis — bloquant |
| (b) Évolution | oui | oui (carte de valeur) | oui (pur) | oui | réunis — bloquant |
| (c) Roue de cashback | oui | oui (créance encaissable risquée) | oui | oui | réunis — élevé |
| (d) Bonus de dépôt à condition de mise | oui | dépôt | non (attribution certaine) | — | pas un jeu autonome ; accessoire illicite — élevé |
| (e) Giveaway à ticket par achat | oui | oui (pas de voie gratuite, 5 % du prix affectés) | oui | oui | réunis ; exception publicitaire inapplicable ici — élevé |
| (f) Classement doté | oui | oui (dépense) | non ou très discutable | oui | probablement pas autonome ; accessoire illicite — élevé |

### Question 2 — Sans rachat ni retrait : loterie ou vente ?

Mon analyse : cela reste une loterie prohibée dès lors que les lots sont de valeurs très inégales et que l'offre est bâtie sur cet écart.

- Le prix est un sacrifice financier, car ce que l'acheteur paie n'est pas un bien déterminé mais une chance : dans la majorité des tirages il reçoit une carte cotée moins que le prix, et ce sont ces tirages qui financent les gros lots.
- L'espérance d'un gain n'exige pas un paiement en argent ; le gain en nature suffit. Le critère opératoire du régulateur est le caractère monétisable du lot.
- Afficher la cote et les probabilités est loyal envers le consommateur, mais cela établit par écrit l'espérance de gain : la transparence ne purge pas la qualification.

Ce qui distingue le booster du fabricant du pack recomposé (raisonnement ; je n'ai trouvé aucune décision française tranchant ce point) :

1. **Objet du contrat.** Le booster est un produit manufacturé standard : même nombre de cartes, même structure de rareté, prix uniforme, usage propre (jouer, collectionner). Le fabricant n'attribue aucune valeur monétaire aux cartes et ne promet aucun gain ; l'écart de valeur naît d'un marché secondaire qui lui est extérieur.
2. **Construction de l'offre.** Le revendeur choisit des cartes dont il connaît la cote, compose un tableau de lots, fixe le prix à partir de l'espérance de valeur diminuée de sa marge, et vend un « retour ». La structure est celle d'une loterie : cagnotte de lots, tickets, avantage de l'organisateur.
3. **Contrepartie.** Une seule carte par pack, le plus souvent cotée sous le prix : il n'y a pas de contrepartie certaine équivalente au prix.
4. **Rachat.** Le fabricant ne rachète jamais ; ici le rachat est au cœur du parcours.

La zone défendable commence quand l'aléa ne porte plus que sur l'identité de la carte et non sur un gain ou une perte : variantes C et D ci-dessous.

### Question 3 — Agrément, licence, certification ; casinos en ligne ; JONUM

- **Aucun titre** : voir C2. Les licences étrangères (Curaçao, Malte, etc.) ne sont pas reconnues en France **[G]**.
- **Casinos en ligne** : non légalisés en novembre 2026 ; dossier à l'arrêt selon les sources consultées (voir C2, fiabilité faible). Même en cas d'ouverture, rien n'indique qu'un pack de cartes physiques entrerait dans la catégorie.
- **JONUM** : ne couvre pas les cartes physiques ; interdit le rachat par l'opérateur ; l'expérimentation s'achève en mai 2027 sauf prorogation (voir C2).

### Question 4 — Sanctions

Voir le tableau du constat C4.

### Question 5 — La démonstration actuelle est-elle licite ?

Oui en l'état, à mon analyse : il n'y a ni sacrifice financier (crédits fictifs, aucun paiement) ni gain (aucune expédition, aucun retrait). Deux des quatre critères manquent. Risque : **faible**.

Risques résiduels :

1. **Bascule** dès qu'un élément de valeur réelle apparaît : précommande, dépôt, liste d'attente payante, giveaway réel réservé aux inscrits, crédit de bienvenue (`welcomeCredit: 100_00`) promis comme reportable à l'ouverture.
2. **Publicité** pour une offre en ligne non autorisée (loi n° 2010-476, art. 57) si la démo sert de support à une campagne annonçant le lancement en argent réel (réseaux sociaux, créateurs). Tant que rien n'est vendu le risque est faible ; il monte avec la promotion.
3. **Mentions inexactes** sur de futurs « agréments » (C10).
4. **Mineurs** : simulateur de jeu d'argent habillé en Pokémon, filtré par une simple case à cocher. Je n'ai trouvé aucune interdiction visant un jeu gratuit sans gain, mais le sujet est sensible.
5. **Preuve d'intention** : le dépôt documente un modèle de casino (marge, « mises », condition de mise). En cas de lancement, ces documents caractériseraient l'élément intentionnel.

### Question 6 — Les variantes

| Variante | Risque | Raison |
|---|---|---|
| (A) Packs avec expédition seule | **élevé** | Loterie d'objets (question 2). Poursuite moins évidente qu'avec retrait en euros, mais qualification inchangée si les lots sont inégaux et cotés. |
| (B) Rachat en bon d'achat non remboursable | **élevé** ; bloquant si le bon permet de racheter des packs | Le bon a une valeur monétaire ; la boucle pack → crédit → pack est celle de jetons de casino. Le rachat par l'émetteur est la ligne rouge retenue par le législateur pour les JONUM. |
| (C) Valeur garantie au moins égale au prix | **moyen** | Plus de perte possible : l'aléa porte sur l'identité de la carte. Mais si des lots très supérieurs subsistent, la lettre de L320-1 peut encore être invoquée. Défendable seulement avec une valeur réelle et vérifiable, un écart de valeurs étroit, aucun rachat, aucun solde. La marge doit venir de l'approvisionnement, pas des perdants. |
| (D) Boutique à prix fixe + tirages promotionnels | **faible à moyen** | Seul ancrage textuel : CSI, art. L320-6, 7°, et C. conso., art. L121-20. |
| (E) Participation gratuite financée autrement | **faible** | Pas de sacrifice financier, donc hors de L320-1. Mais un modèle à deux monnaies (voie gratuite et voie payante) ne purge rien : la voie payante reste un sacrifice. Viabilité économique douteuse. |
| (F) Exploitation depuis l'étranger sous licence étrangère | **bloquant** | L'offre vise le public français (langue, euro, livraison) : loi n° 2010-476, art. 56, plus blocage, liste noire, gel des flux et interdiction de publicité. Pas de reconnaissance mutuelle des licences [G]. Pour un dirigeant résidant en France, c'est l'option la plus dangereuse. |

**La plus défendable : D**, éventuellement complétée par E, aux conditions suivantes :

1. Vente réelle à prix fixe : le client choisit sa carte, au prix du marché, sans surcoût finançant le tirage. La dotation vient du budget marketing, jamais d'un pourcentage affiché du prix.
2. Tirage accessoire et périodique (mensuel), dotation modeste au regard du chiffre d'affaires ; pas de tirage instantané à chaque commande, pas de ticket vendu seul.
3. Règlement publié, nombre et valeur des lots annoncés, aucune présentation trompeuse ou agressive.
4. Voie de participation gratuite : non exigée par la lecture majoritaire depuis 2014, mais elle réduit nettement le risque.
5. Aucun rachat de lot, aucun solde en euros, aucun retrait, aucune condition de mise.
6. Aucun habillage de casino (roue, jauge, flux d'ouvertures, vocabulaire de mise) qui ferait du tirage l'objet principal.
7. Public majeur ; vérifier la condition relative aux mineurs attachée au 7° de l'article L320-6 (non vérifiée).

---

## 4. Actions recommandées

### (a) Dans le site et le code

1. Ne brancher aucun paiement tant que le modèle n'est pas refondu : garder `DEMO = true`, n'ajouter ni prestataire de paiement, ni précommande, ni liste d'attente liée au lancement.
2. Corriger `js/data/faq.js` l. 86 : écrire qu'aucun agrément n'existe en France pour ce modèle et que la version en argent réel n'est pas autorisée en l'état.
3. Corriger `js/views/transparency.js` l. 32-33 : la ligne « Qualification juridique » doit dire que le modèle actuel est un jeu d'argent prohibé ; retirer l'idée qu'un audit de laboratoire « certifie » le droit d'exploiter.
4. Afficher sur chaque écran de jeu : « Simulation gratuite. Aucun gain, aucun lot, aucun achat. »
5. Ne pas présenter `welcomeCredit` comme une somme en euros ; ne jamais promettre son report.
6. Pour toute version cible, retirer : rachat contre solde (`buybackRate`, `buybackLaterRate`), solde retirable et retrait (`withdrawal`, `js/views/wallet.js`), Évolution (`js/views/evolution.js`, `RULES.evolution`), roue (`RULES.cashback.wheel`, mode `wheel` de `claimCashback`), bonus à condition de mise (`RULES.bonus`), financement des giveaways par le prix (`fundRate`), classement indexé sur la dépense (`leaderboardShare`, `pointsPerEuro`).
7. Si la voie D est retenue : refondre en catalogue à prix fixe (le catalogue de 20 811 cartes existe déjà), remplacer « Retour », « Carte ≥ prix », « mise », « joueur » par un vocabulaire de vente, et réécrire les trames de `js/views/legal.js` (sections « Rachat », « Bonus et cashback », « Giveaways et classement »).
8. Corriger `docs/GERANT.md` (« Un pack au contenu aléatoire est une vente ») et `docs/ANALYSE_CARDMATIK.md` §6 : la présentation du concurrent n'est pas une position juridique sûre.

### (b) Structure, entreprise, professionnel

1. Consultation écrite d'un avocat en droit des jeux **avant** toute immatriculation orientée vers ce modèle, sur les variantes C et D, avec le parcours exact.
2. Envisager un échange préalable avec l'ANJ sur le modèle retenu (existence d'une procédure formelle d'avis : non vérifiée).
3. Écarter le montage étranger (F) et tout recours à des créateurs ou affiliés pour promouvoir le concept actuel (art. 57).
4. Ne pas fonder le plan d'affaires sur une légalisation des casinos en ligne ni sur le JONUM (fin de l'expérimentation en mai 2027).
5. Ne pas tirer argument de l'existence de concurrents français ou étrangers : des analyses d'avocat de novembre 2026 indiquent n'avoir trouvé ni décision de justice ni mesure de l'ANJ visant des sites de ce type (HypeDrop, Packdraw, Rillabox, Phygitals) **[R]** — https://kohenavocats.com/phygitals-legal-france-avis-boosters-pokemon-en-ligne-rachat-85-usdc-retraits-recours/ ; https://kohenavocats.com/mystery-box-en-ligne-hypedrop-packdraw-rillabox-jeu-argent-interdit-france-recuperer-argent/. L'absence de sanction publiée n'est pas une autorisation.

---

## 5. Non vérifié / à confirmer

1. **Aucun texte lu à la source.** Hôtes à autoriser dans les réglages réseau de la session pour une relecture : `www.legifrance.gouv.fr` et `anj.fr`. Le quota de recherche web était épuisé ; une relance est possible dans un message ultérieur.
2. Texte intégral et à jour des articles L320-1 et L320-6 du CSI (liste complète des 1° à 7°, existence d'un 8°, condition relative aux mineurs attachée au 7°).
3. Libellé exact de l'article L324-1 du CSI et contenu des articles L324-2 à L324-16 (publicité hors ligne, personnes morales).
4. Loi n° 2010-476 : art. 56, II (peines complémentaires) ; version de l'art. 61 après une éventuelle modification d'août 2026 ; art. L563-2 du code monétaire et financier (autorité compétente). Une loi de l'été 2026 semble avoir retouché ces textes : non identifiée.
5. JONUM : texte exact des art. 40 et 41, contenu détaillé du décret n° 2026-60 (catégories, plafonds), date de fin et éventuelle prorogation.
6. Casinos en ligne : état officiel du dossier en novembre 2026 (mes sources sont des guides commerciaux) ; décision n° 26-DCC-215 de l'Autorité de la concurrence, citée par un blog, non vérifiée.
7. Doctrine de l'ANJ propre aux « mystery boxes », aux packs de cartes physiques et aux pochettes surprises : rien trouvé ; liste noire de l'ANJ non consultée.
8. Jurisprudence (chambre criminelle sur les loteries, les ventes par la voie du sort, les pochettes surprises) et réponses ministérielles : non recherchées avec succès. Aucune n'est citée.
9. Fiche DGCCRF de mars 2026 sur l'obligation d'achat, citée par un site tiers ; arrêt de la CJUE du 14 janvier 2010 (C-304/08) et loi du 20 décembre 2014 sur les loteries publicitaires **[G]**.
10. Passage des jeux à objets aléatoires payants en PEGI 16 en octobre 2026, évoqué par le titre d'un article d'avocat : non vérifié.

---

## 6. Sources (toutes vues dans des résultats de recherche)

- CSI, art. L320-1 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000039182525
- CSI, art. L320-6 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000039169738/
- CSI, anciens art. L322-1 et L322-2 (abrogés) : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000028749215/2026-03-22
- CSI, art. L324-1 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000039182736
- CSI, art. L324-13 : https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000049778900
- Ordonnance n° 2019-1015 du 2 octobre 2019 : https://www.legifrance.gouv.fr/jorf/id/JORFSCTA000039167505
- Loi n° 2010-476, art. 56 : https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000028689534
- Loi n° 2010-476, art. 57 : https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000045294013
- Loi n° 2010-476, art. 61 : https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000038791253/
- Code monétaire et financier, art. L563-2 : https://www.lexbase.fr/texte-de-loi/code-monetaire-et-financierl5632/L8176LSM.html
- Loi n° 2024-449, art. 40 : https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000049563458
- Loi n° 2024-449, art. 41 : https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000049563459
- Décret n° 2026-60 du 4 février 2026 : https://www.legifrance.gouv.fr/loda/id/JORFTEXT000053443861/2026-10-21
- ANJ, page JONUM : https://anj.fr/jeux-objets-numeriques-monetisables-jonum
- ANJ, lutte contre l'offre illégale : https://anj.fr/lutter-contre-loffre-illegale
- ANJ, liste noire : https://anj.fr/liste-noire-des-sites-de-jeux-dargent-et-de-hasard-interdits-en-france
- ARJEL, rapport d'activité 2017-2018 : https://anj.fr/sites/default/files/2019-12/rapport-activite-Arjel%202018.pdf
- C. conso., art. L121-20 : https://justice.pappers.fr/loi/LEGITEXT000006069565/article/LEGIARTI000032227240
- DGCCRF, fiche « Loterie » : https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/loterie-des-pratiques-commerciales-reglementees
- OFDT, note sur la réglementation des jeux (2025) : https://www.ofdt.fr/sites/ofdt/files/2025-07/note-reglementation-jah_8_1.pdf
- Analyses d'avocat (novembre 2026) : https://kohenavocats.com/phygitals-legal-france-avis-boosters-pokemon-en-ligne-rachat-85-usdc-retraits-recours/ ; https://kohenavocats.com/mystery-box-en-ligne-hypedrop-packdraw-rillabox-jeu-argent-interdit-france-recuperer-argent/
- Casinos en ligne (fiabilité faible) : https://the-bonusempire.fr/plf-2026-legalisation-casinos-en-ligne-ou-en-est-le-debat/
