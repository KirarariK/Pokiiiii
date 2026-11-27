# 08 — Droit comparé et montages juridiques des acteurs existants

Rapport du 27 novembre 2026. Ce n'est pas un avis d'avocat.

**Statut des sources.** [S] lu à la source · [R] vu dans un résultat de recherche (résumé ; page non ouverte) · [NV] connaissance générale non vérifiée.

**Limites de l'étude, à lire avant le reste.** Seul `cardmatik.com` était joignable. Aucun site officiel étranger n'a pu être ouvert : l'outil de lecture de pages a été refusé pour natlawreview.com, sbcamericas.com et pinsentmasons.com (hôtes hors réseau autorisé), `curl` a échoué sur les treize autres sites essayés une fois (concurrents et textes officiels), et le budget commun de recherche web s'est épuisé après une quarantaine de requêtes. Conséquence : hors Cardmatik, **rien n'est « lu à la source »**. Les numéros d'articles marqués [NV] sont à contrôler avant tout usage.

---

## 1. Verdict en trois lignes

1. Tel qu'il est conçu (tirage payant, lot de valeur, rachat par le site crédité sur un solde retirable, plus Évolution, roue de cashback et bonus à rejouer), le produit réunit mise, hasard et gain dans **tous** les pays étudiés ; aucun pays francophone ne propose de licence qui le couvre.
2. Une licence de Malte, Curaçao, de l'île de Man, d'Anjouan ou de Kahnawake **ne donne aucun droit de viser** la France, la Belgique ou la Suisse (CJUE, 16 avril 2026, C-440/23 [R]) ; il n'existe pas non plus de « certification » qui rende le produit licite.
3. Les acteurs existants n'ont pas de licence : ils plaident la « vente à contenu aléatoire » ou s'abritent derrière des sociétés offshore ; aux États-Unis ils sont attaqués depuis 2025 sans décision au fond. Le seul montage défendable retire au tirage tout gain monétisable par le site et se limite à la France.

---

## 2. Constats, du plus grave au moins grave

### C1 — Le produit est un jeu d'argent partout, sans licence disponible dans les marchés visés — BLOQUANT

**Élément concerné :** packs + rachat crédité sur le solde retirable (`js/config.js`, `RULES.withdrawal`, l. 107) ; Évolution (l. 52) ; cashback et roue (l. 60) ; bonus à rejouer dix fois (l. 86).

Le test est le même partout : une mise, un aléa, un gain de valeur. La mise et l'aléa ne se discutent pas. Tout le débat porte sur le « gain », et il est clos dès que l'exploitant rachète lui-même le lot contre de l'argent retirable.

| Pays | Qualification | Licence possible | Sanctions | Régulateur sur loot boxes / mystery boxes |
| --- | --- | --- | --- | --- |
| **Belgique** | Jeu de hasard : enjeu, gain « de quelque nature », hasard « même accessoire » (loi du 7 mai 1999, art. 2) [NV] | Non. Les licences en ligne A+, B+, F1+ sont l'accessoire d'une licence terrestre, pour des jeux « de même nature » [R] (1)(2) | Pénales et administratives ; joueur et publicité aussi visés (art. 4, 63 s. ; quantum non vérifié) [NV] | Commission des jeux de hasard, avril 2018 : les loot boxes payantes sont des jeux de hasard ; amendes annoncées jusqu'à 1,6 M€ [R] (3). Rien trouvé sur les packs de cartes physiques |
| **Suisse** | Jeu d'argent : mise ou acte juridique contre l'espoir d'« un gain pécuniaire ou un autre avantage appréciable en argent » (LJAr, art. 3) [R] (4) ; en ligne = jeu de grande envergure (art. 3 let. e) [R] (5) | Non. En ligne réservé aux maisons de jeu concessionnaires et aux deux sociétés de loterie [NV]. L'exception « promotion des ventes » (art. 1 al. 2) [R] (6) ne joue pas : ce qui est acheté, c'est la chance | Pénales (art. 130 s., quantum non vérifié) [NV] ; blocage d'accès des offres non autorisées (art. 86 s., en vigueur depuis le 1er juillet 2019) [R] (7) | Gespa : examen « loot box par loot box », aucun texte spécifique [R] (4) |
| **Luxembourg** | Jeu de hasard ou loterie prohibés (loi du 20 avril 1977) [NV] | Non ; pas de régime en ligne ; monopole de fait de la Loterie nationale [R] (8) | Pénales ; durcissement en cours (projet de loi 8679, 2026) [R] (8) | Proposition de loi 8650 (30 oct. 2025) et amendements de juillet 2026 visant les « mécanismes aléatoires de récompense payants » [R] (9) |
| **Canada / Québec** | Loterie illégale : disposer de biens par un mode de hasard contre paiement (Code criminel, art. 206(1)) [R] (10) | Non pour un privé : seules les provinces exploitent une loterie par ordinateur (art. 207) [R/NV] (11) | Jusqu'à 2 ans d'emprisonnement [R] (10) | Aucun régulateur canadien ne s'est prononcé sur les « digital repacks » [R, source faible] (12). Concours licite : sans achat + question d'habileté [NV] |
| **Royaume-Uni** | « Gaming » (jeu de hasard pour un prix) ou loterie ; « prize » = « money or money's worth » : une carte revendable l'est par nature (Gambling Act 2005, s. 6, s. 14) [R/NV] (13) | Oui en théorie : licence à distance de la Gambling Commission, due dès qu'on sert un client britannique [NV]. Tirage avec voie gratuite hors champ des loteries (annexe 2) [NV] | Pénales (s. 33) [NV] ; plus de 1 000 mises en demeure et 2 200 sites signalés sur 2026/27 [R] (14) | Loot boxes non licenciables tant que le lot reste dans le jeu ; s'il se convertit ou s'échange, il devient « money's worth » [R] (13). Aucune action connue contre un site à lots physiques [R, source faible] (15) |
| **Pays-Bas** | Jeu de hasard dès que le hasard décide et que le lot a une valeur cessible (Ksa, 2018) [R] (16) | Non : « aucune licence ne peut être obtenue » pour ce type d'offre [R] (17) | Amendes Ksa : 25 M€ (record), 4,228 M€ (Starscream, déc. 2025) [R] (18)(19) | Conseil d'État, 9 mars 2022 : les packs FIFA ne sont pas un jeu autonome [R] (20). Non transposable : ici le tirage est le produit |
| **Allemagne** | Glücksspiel : prix payé pour une chance de gain dépendant du hasard (GlüStV 2021, § 3) [R] ; la question est de savoir si la carte est un « Gewinn » [R] (21). Avec rachat en argent, oui | Non : catégories en ligne fermées (§ 4) [NV] | §§ 284 et 287 StGB [NV] | Pas de position GGL trouvée. Autriche (WKO) : défendable si l'acheteur reçoit toujours une marchandise, plus du tout si le contenu est décidé par algorithme en ligne ou si des boîtes sont vides [R] (22) |
| **Espagne** | « Juego » (Ley 13/2011, art. 3) ; jeu non réglementé = interdit [NV] | Non | Amendes très lourdes (quantum non vérifié) [NV] | Avant-projet 2022 sur les « mécanismes aléatoires de récompense » (interdiction aux mineurs), repris dans un projet de loi ; état 2026 non vérifié [R] (23) |
| **États-Unis** | Loterie ou gambling selon l'État : consideration, chance, prize [R] (24) | Aucune licence dédiée. Le modèle « sweepstakes » (voie gratuite, double monnaie) est désormais interdit par la loi dans neuf ou dix États : Californie (AB 831, effet 1er janv. 2026), New York, New Jersey, Connecticut, Montana, Indiana, Maine, Tennessee, Louisiane, Oklahoma (1er nov. 2026) ; décomptes divergents [R] (25) | Actions privées (restitution, parfois au double), procureurs d'État | Voir C3. « Aucun régulateur ne supervise la catégorie » [R] (26) |
| **Union européenne** | Pas d'harmonisation : les jeux sont exclus des directives 2000/31 (art. 1(5)(d)) et 2006/123 (art. 2(2)(h)) [NV] | — | — | Proposition de Digital Fairness Act : voir C7 |

### C2 — Une licence étrangère ne permet pas de viser la France, la Belgique ou la Suisse — BLOQUANT

**Élément concerné :** `js/data/faq.js` l. 86 (« les agréments nécessaires ») ; l'idée de « certifications ».

- **Aucune reconnaissance mutuelle.** CJUE, 16 avril 2026, C-440/23 : un État membre peut interdire une offre en ligne même licenciée dans un autre État membre ; les contrats conclus en violation peuvent être nuls et les pertes réclamées [R] (27)(28). Jurisprudence constante depuis C-42/07 (8 sept. 2009) [NV].
- **France :** offrir un jeu d'argent en ligne sans agrément est un délit (loi n° 2010-476, art. 56 : 3 ans et 90 000 € ; 7 ans et 200 000 € en bande organisée) [NV] ; l'ANJ fait bloquer les sites (1 290 URL en 2025 ; Polymarket le 16 juillet 2026) [R] (29). Détail : agent 01.
- **Belgique, Suisse :** interdiction générale sans licence nationale, listes noires et blocage (voir C1).
- **Malte** : la licence MGA vise les jeux de hasard contre l'opérateur ; rien ne dit qu'elle accepterait ce produit [NV]. L'article 56A (« Bill 55 »), qui fait obstacle aux jugements étrangers, fait l'objet d'une procédure d'infraction ouverte en juin 2025 [R] (28).
- **Curaçao** : nouvelle loi (LOK) en vigueur depuis le 24 décembre 2024, licence B2C délivrée par la CGA [R] (30). Pays tiers : aucune liberté de circulation à invoquer.
- **Anjouan** : la banque centrale des Comores qualifie les organismes émetteurs d'« entités fictives » (déc. 2025) ; Anjouan admet que sa licence n'est pas une autorisation universelle [R] (31).
- **Île de Man, Kahnawake** : licences sans effet hors de leur territoire [NV].
- **Couverture du produit** : aucun site de mystery box étudié n'affiche l'une de ces licences. Non vérifié auprès des régulateurs.
- Un audit « provably fair » ou une certification de générateur aléatoire sont des contrôles techniques exigés *par* un régime de licence ; ils n'autorisent rien par eux-mêmes [NV].

### C3 — Les acteurs existants ne sont pas un précédent — ÉLEVÉ

**Élément concerné :** tout le modèle repris de `docs/ANALYSE_CARDMATIK.md`.

**Cardmatik [S]** (code embarqué téléchargé le 27 nov. 2026, fichiers dans `dl/`) :

| Point | Constat |
| --- | --- |
| Société | SAS LA LIGUE DES OMBRES, 60 rue François Ier, Paris 8e, SIREN 940 259 542, créée le 29 janvier 2025 ; hébergeur Railway (San Francisco) |
| Licence | Aucune. FAQ : « n'est pas un jeu d'argent… vente de produit à caractère aléatoire (pratique autorisée par la DGCCRF pour les "packs mystères") ». Aucune référence à l'appui ; la DGCCRF ne délivre pas d'autorisation [NV] |
| Territoire | CGV art. 3 et CGU art. 3 : « uniquement en France ». Mais la FAQ annonce une livraison « en Europe » et le formulaire de retrait accepte des IBAN français, belges et suisses |
| Âge | 18 ans, date de naissance contrôlée à l'inscription |
| Rachat | 90 % de la valeur de marché, moins une commission. CGV art. 8 : avoir « utilisable seulement sur cardmatik.com ». FAQ et documentation : avoir « utilisable ou retirable », virement après KYC, 7 à 14 jours ouvrés. **Les deux textes se contredisent** |
| Fonds | « Ne détient aucun fonds des utilisateurs (les avoirs sont des crédits commerciaux internes) » |
| Paiement | Carte via Coinflow ; recharge par virement avec bonus (100 € → +5 €, jusqu'à 1 000 € → +100 €) |
| Voie gratuite | Aucune pour les packs. Giveaways : 1 pack = 1 ticket ; seul le « cadeau du live » est ouvert aux spectateurs « même sans achat » |
| Tirage | Côté serveur ; aucun mécanisme vérifiable. « Le système de révélation… ne constitue pas un tirage au sort » |
| Autres | Rétractation exclue après ouverture ; aucune mention d'un médiateur de la consommation ; droit français, tribunaux de Paris |
| Sanction | Aucune trouvée |

**Comparables [R]** (conditions générales non ouvertes) :

| Acteur | Société et pays | Licence | Restrictions | Rachat / retrait | Contentieux |
| --- | --- | --- | --- | --- | --- |
| Courtyard | États-Unis | Aucune mentionnée ; CGU : achat à prix fixe livrant toujours un objet gradé | « Âge légal » et lieu éligible ; 18 ans selon une revue | Environ 90 % de la valeur de marché, fenêtre de 7 jours ; KYC à la livraison ; cotes : sources contradictoires | Campagne d'arbitrages de masse ; aucune plainte en justice trouvée ; clause d'arbitrage JAMS (32)(33) |
| HypeDrop | Packed Ltd, Nevis ; paiements par Omnifarious Services Ltd, Chypre | Aucune trouvée | Non trouvé | Revente au site | Rien trouvé (34) |
| PackDraw | PackDraw Limited, Chypre ; PackDraw US, LLC, Delaware | Aucune trouvée | 21 ans selon une fiche | — | « Allégations non tranchées » en juin 2026, non identifiées (35) |
| Jemlit | Jemlit Ltd, Londres | Aucune trouvée | Exclut les États de Washington et d'Idaho | — | — (36) |
| Lootie | Non identifiée | — | — | **Pas de retrait en argent** : expédition ou crédit boutique ; donné pour fermé par une revue de juillet 2026 | — (37) |
| Collector Crypt | Plateforme crypto | Aucune | — | Rachat instantané 10 à 15 % sous le marché ; environ 30 % des utilisateurs se font livrer | Action dans l'Utah, suspendue (source unique, faible) (12)(38) |
| Whatnot, Fanatics Live | États-Unis | Aucune | — | — | Action « qui tam » en Californie (juillet 2025) ; arbitrages (mars 2026, environ 70 demandeurs en juin). **Aucun arbitre ni tribunal n'a statué** (24)(39) |

Rip.fun, Phygitals (hors son partenariat « Underdog Rips ») et d'éventuels autres acteurs français : rien trouvé. Autre signal : l'État de New York poursuit Valve pour ses loot boxes (25 février 2026) [R] (40).

Lecture : l'absence de sanction publique en Europe traduit une absence de contrôle à ce jour, pas une validation. Un concurrent créé en janvier 2025, sans décision ni avis publié, ne prouve rien.

### C4 — Ce que le projet ajoute au concurrent aggrave la qualification — ÉLEVÉ

**Élément concerné :** `js/config.js` l. 52, 60, 76, 86 ; vocabulaire (« mise », « retour affiché ») ; tirage vérifiable ; auto-exclusion et numéro Joueurs Info Service.

Cardmatik évite avec soin le vocabulaire du jeu. Le projet fait l'inverse : Évolution (miser un bien contre une probabilité, bien perdu en cas d'échec), roue multiplicatrice, bonus à rejouer dix fois, taux de retour, classement doté par la marge. Ce sont les marqueurs d'un casino, et les protections affichées valent reconnaissance que c'en est un. L'argument de la « vente à contenu aléatoire » devient intenable.

### C5 — « Francophonie » : chaque pays francophone est plus strict que la France — ÉLEVÉ

**Élément concerné :** `js/views/legal.js` (aucune clause de territoire ni de droit applicable trouvée par mots-clés [S]).

Belgique, Suisse, Luxembourg et Québec interdisent le produit et n'offrent aucune licence (C1). Le concurrent se limite à la France dans ses textes.

### C6 — Giveaways sans voie gratuite — MOYEN

**Élément concerné :** giveaways (1 ticket par pack acheté).

Royaume-Uni, Canada, États-Unis et Pays-Bas font de la participation gratuite à chances égales la condition de licéité d'un tirage promotionnel [NV]. Le concurrent n'en a qu'une partielle.

### C7 — Digital Fairness Act : obligations à venir — MOYEN

Proposition COM(2026) 1100 du 11 novembre 2026 (dates de 10 à 12 novembre selon les sources) [R] (41)(42). Article 15 sur les « systèmes payants à récompense variable » (définition à l'art. 3(18)) ; le considérant 63 cite loot boxes, roues de la fortune et **paquets de cartes à collectionner** ; information sur les lots et leurs probabilités, outil de désactivation pour tous, interdiction aux mineurs ; consultation jusqu'au 15 janvier 2027. Application aux cartes physiques non vérifiée. Texte de droit de la consommation : il ne légalise pas ce que le droit des jeux interdit.

---

## 3. Classement des montages, du plus défendable au plus risqué

| Rang | Montage | Risque | Ce que cela change dans le produit |
| --- | --- | --- | --- |
| 1 | **Boutique à contenu connu** : SAS française, cartes vendues à l'unité, coffre, expédition, reprise à prix affiché, tirages gratuits | Faible | Plus de packs mystère, d'Évolution ni de roue |
| 2 | **Produit actuel sous licence du pays visé** : n'existe que hors francophonie (Royaume-Uni en théorie) | Faible en droit, hors cible | Autre marché, autre société, conformité de casino en ligne |
| 3 | **Pack surprise sans monétisation par le site** : SAS française, France seule ; carte toujours livrée ou gardée au coffre, de valeur proche du prix ; ni rachat, ni solde retirable | Moyen à élevé en France ; bloquant en Belgique | Supprimer rachat, retrait, Évolution, cashback, bonus, taux de retour, classement doté |
| 4 | **Idem avec reprise en avoir non retirable** (lettre des CGV du concurrent, modèle Lootie) | Élevé | L'avoir ne sert qu'à racheter : la boucle mise-gain-remise subsiste |
| 5 | **Projet actuel et pratique réelle du concurrent** : rachat à 90 % sur solde retirable, SAS française sans licence | Bloquant | — |
| 6 | **Modèle « sweepstakes »** à voie gratuite et double monnaie | Bloquant en France ; en cours d'interdiction aux États-Unis | Ne change pas ce qui est vendu : la chance |
| 7 | **Société offshore avec licence** visant France, Belgique ou Suisse | Bloquant : délit, blocage, nullité des contrats, refus bancaire | — |

---

## 4. Actions recommandées

**(a) Dans le site et le code**

1. `js/config.js` : placer derrière des drapeaux, désactivés par défaut, `evolution` (l. 52), `cashback` et sa roue (l. 60), `bonus` (l. 86), `leaderboardSplit` (l. 76).
2. `RULES.withdrawal` (l. 107) : séparer le remboursement d'un solde non dépensé (dû au client) du produit d'un rachat ; prévoir les variantes « sans rachat » et « avoir non retirable ».
3. Ajouter une liste de pays autorisés limitée à la France (inscription, adresse de livraison, IBAN) et une clause de territoire dans `js/views/legal.js`.
4. `js/data/faq.js` l. 86 : retirer « les agréments nécessaires » ; il n'en existe pas pour ce produit. Conserver la question ouverte de `js/views/transparency.js` l. 32.
5. Retirer des textes « mise », « retour affiché », « jouer », « gains » dans toute variante présentée comme une vente.
6. Giveaways : ajouter une voie de participation gratuite à chances égales et un règlement.
7. Ne pas reprendre la mention « autorisée par la DGCCRF ».
8. Garder les probabilités publiées et prévoir un interrupteur de désactivation (art. 15 de la proposition de DFA).

**(b) Structure juridique et professionnels**

1. Avant tout encaissement : consultation écrite d'un avocat en droit des jeux et demande de position à l'ANJ sur la variante retenue.
2. Société française, France seule. Ni société offshore, ni achat de licence étrangère.
3. Renoncer à la Belgique, à la Suisse, au Luxembourg et au Québec sans avis local écrit.
4. Faire valider par le prestataire de paiement la catégorie d'activité (commerce ou jeu) — agent 04.
5. Veille : DFA, contentieux américains (Whatnot, Fanatics, Valve), projets luxembourgeois 8650 et 8679.

---

## 5. Non vérifié / à confirmer

- Tous les numéros d'articles et quantums marqués [NV] (Belgique art. 2, 4, 63 ; Suisse art. 130 ; Royaume-Uni s. 6, 14, 33 ; Allemagne § 4, 284, 287 ; Espagne art. 3, 42 ; France art. 56).
- Texte de la proposition de DFA et son application aux cartes physiques.
- Conditions générales de Courtyard, HypeDrop, PackDraw, Jemlit, Collector Crypt, Phygitals, Rip.fun : pays exclus, âge, voie gratuite, retrait.
- Action de l'Utah contre Collector Crypt ; allégations visant PackDraw.
- Québec : suppression du régime des concours publicitaires de la RACJ (octobre 2023).
- Espagne et Allemagne : état du droit en 2026 ; position de la GGL.
- Position d'un régulateur européen sur les packs de cartes physiques avec rachat : aucune trouvée.
- Couverture du produit par une licence maltaise, curacienne ou mannoise.
- Autres acteurs français : aucun identifié.

Pour lever ces points : autoriser les hôtes officiels dans les réglages réseau ou relancer avec un budget de recherche.

---

## Sources (URL vues en résultat de recherche, sauf mention)

1. https://practiceguides.chambers.com/practice-guides/gaming-law-2023/belgium
2. https://www.gamingcommission.be/en/gambling-act-of-7-may-1999
3. https://www.rtbf.be/article/la-belgique-considere-que-les-loot-boxes-dans-les-jeux-video-sont-des-jeux-de-hasard-9901428
4. https://www.grea.ch/sites/default/files/factsheet_loot_boxes_v2.1.pdf
5. https://www.bj.admin.ch/fr/cadre-legal-des-jeux-d-argent-en-suisse
6. https://www.bj.admin.ch/fr/questions-et-reponses-concernant-la-loi-sur-les-jeux-d-argent
7. https://www.bj.admin.ch/dam/bj/fr/data/wirtschaft/geldspiele/merkblaetter/mb-illegale-onlineseiten-f.pdf.download.pdf/mb-illegale-onlineseiten-f.pdf
8. https://wdocs-pub.chd.lu/docs/compilation/docpa/pdf/8679_Dossier_Complet.pdf
9. https://wdocs-pub.chd.lu/docs/Dossiers_parlementaires/8650/20251030_Depot.pdf · https://wdocs-pub.chd.lu/docs/Dossiers_parlementaires/8650/20260713_Depot.pdf
10. https://laws-lois.justice.gc.ca/eng/acts/C-46/section-206.html
11. https://laws-lois.justice.gc.ca/eng/acts/C-46/section-207.html
12. https://on360.ca/?p=920 (article assisté par IA)
13. https://www.gamblingcommission.gov.uk/news/article/loot-boxes-within-video-games · https://www.hsfkramer.com/notes/tmt/2019-08/uk-gambling-commission-clarifies-position-on-loot-boxes-in-games-during-dcms-inquiry
14. https://focusgn.com/uk-illegal-gambling-enforcement
15. https://track360.io/blog/loot-box-gambling-uk-2026-operator-compliance-map (blog commercial)
16. https://kansspelautoriteit.nl/publish/library/17/onderzoek_naar_loot_boxes_-_een_buit_of_een_last_-_nl.pdf
17. https://cms.law/nl/nld/publication/kansspelautoriteit-loot-boxes-kunnen-onder-reikwijdte-wet-op-de-kansspelen-vallen
18. https://nos.nl/l/2605759
19. https://kansspelautoriteit.nl/publish/library/32/2025-12-16_21987_starscream_boetebesluit_sanctiebesluit.pdf
20. https://www.raadvanstate.nl/uitspraken/@130150/202005769-1-a3/
21. https://www.lto.de/recht/hintergruende/h/sammelkarten-tcg-twitch-live-openings-gluecksspiel-recht
22. https://www.wko.at/handel/gluecksspielrechtliche-aspekte-von-mystery-boxen
23. https://www.cuatrecasas.com/es/spain/propiedad-intelectual/art/espana-primera-regulacion-de-las-loot-boxes-o-cajas-botin-en-espana · https://www.dsca.gob.es/es/comunicacion/notas-prensa/ministerio-consumo-prohibe-acceso-menores-cajas-botin-videojuegos-evitar
24. https://natlawreview.com/article/chase-trading-card-repacks-face-growing-legal-scrutiny · https://natlawreview.com/article/future-card-breaking-and-repacks-insights-california-litigation
25. https://www.venable.com/insights/publications/2026/05/states-escalate-crackdown-on-sweepstakes-casinos · https://www.dlapiper.com/insights/publications/intellectual-property-news/2026/states-prohibit-dual-currency-game-models-key-implications
26. https://sbcamericas.com/2026/11/06/digital-card-rips-prizepicks-packs-og/
27. https://curia.europa.eu/site/upload/docs/application/pdf/2026-04/cp260053en.pdf
28. https://www.osborneclarke.com/insights/cjeu-rules-online-gambling-licences-carry-no-cross-border-protection · https://sigma.world/news/eu-court-malta-bill-55-ruling/
29. https://anj.fr/sites/default/files/2026-06/Rapport%20annuel%202025%20web.pdf · https://anj.fr/promotion-illegal-gambling-services-blocking-polymarket-website
30. https://www.curacaochronicle.com/post/unknown/1-year-of-the-lok-an-overview-of-the-first-year-under-the-new-gambling-law · https://www.legal500.com/guides/chapter/curacao-gambling/
31. https://www.casino.org/news/comoros-calls-anjouan-licensing-bodies-fictitious-seeks-uk-assistance/ · https://cdcgaming.com/brief/anjouan-denies-global-reach-of-licences-as-flutter-hits-out-at-world-cup-black-market/
32. https://www.classaction.org/online-gambling-class-action-lawsuit-alternatives
33. https://www.rotowire.com/sports-cards/courtyard · https://altstreet.investments/platforms/reviews/courtyard · https://intercom.help/courtyardio/en/articles/13854269-terms-of-service
34. https://www.hypedrop.com/ · https://unpacked.gg/reviews/hypedrop/
35. https://www.lines.com/mistery-boxes/packdraw
36. https://tech-insider.org/mystery-boxes/jemlit-review/
37. https://tech-insider.org/lootie-review/
38. https://decrypt.co/370978/pokemon-cards-surging-crypto-platforms-gambling · https://cointelegraph.com/news/pokemon-cards-as-rwas-gacha-spending-hits-records-as-crypto-sinks
39. https://www.espn.in/mlb/story/_/id/49098946/could-box-breaking-considered-gambling-lottery · https://sccgmanagement.com/sccg-articles/2026/10/02/whistleblower-suit-alleges-fanatics-live-random-card-breaks-operate-as-unlicensed-lotteries/
40. https://natlawreview.com/article/new-york-targets-valves-loot-boxes-illegal-gambling
41. https://www.europarl.europa.eu/legislative-train/theme-protecting-our-democracy-upholding-our-values/file-digital-fairness-act
42. https://www.heise.de/en/news/Digital-Fairness-Act-What-the-EU-draft-means-for-loot-boxes-in-games-11521109.html · https://www.lexology.com/library/detail.aspx?g=0de3c40f-ff43-458e-8d02-df68c4ee8705

**Cardmatik [S]** : https://cardmatik.com/cgv · /cgu · /mentions-legales · /faq · /documentation · /avis, textes extraits de https://cardmatik.com/assets/index-C8N871vK.js. Copies : `dl/` (`cm_bundle.js`, `cm_cgv.txt`, `cm_cgu.txt`).
