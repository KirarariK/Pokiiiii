# 05 — Fiscalité et obligations comptables (France / UE)

Rapport du 27 novembre 2026. Ce n'est pas un avis d'avocat ni d'expert-comptable.

**Limite de méthode, à lire d'abord.** Aucune source officielle n'a pu être ouverte : l'outil de lecture de pages est refusé sur `bofip.impots.gouv.fr`, `www.impots.gouv.fr` et `www.economie.gouv.fr` (hôtes hors réseau autorisé), et le budget de recherche partagé a été épuisé en cours de route (3 requêtes non exécutées, reprises en partie ensuite). **Aucun point de droit n'est donc « lu à la source officielle ».** Statuts utilisés : **[R]** vu dans un résultat de recherche (extrait, souvent du BOFiP, non relu en entier) ; **[NV]** connaissance générale non vérifiée. Les chiffres du dépôt sont, eux, **recalculés** (`npm run smoke` passe ; script `tva.mjs` de ce dossier).

## 1. Verdict

1. La constante `VAT_ON_MARGIN = 20/120` est arithmétiquement juste, mais le modèle ne chiffre que le cas le plus favorable : régime de la marge **et** globalisation mensuelle **et** rachat traité comme un achat d'occasion à un particulier. Dans ce cas : 3 729 €/mois, à ± 1 000 € près.
2. Si la marge se calcule vente par vente (méthode par défaut), la TVA passe à **9 818 €/mois (+6 088 €, × 2,6)** et le résultat du mois tombe de 6 433 € à **345 €**. Si la TVA porte sur le prix entier : 20 590 à 25 309 €/mois, résultat de −10 428 à −15 146 €. Le modèle ne supporte pas plus de 10 162 € de TVA par mois (6,7 % des ventes).
3. Le traitement du rachat d'une carte jamais sortie du coffre n'est pas tranché, et le site dit deux choses contraires (« achat » dans le modèle, « avoir » dans les CGV). Ce choix commande la TVA, le registre des objets mobiliers, la comptabilité, et rejoint la question du jeu d'argent.

## 2. Constats, du plus grave au moins grave

### C1 — TVA : le modèle retient l'hypothèse la plus favorable sans le dire — risque élevé (bloquant si la TVA porte sur le prix entier)

Élément concerné : `js/economics.js` (l. 45-46, 118, 139, 208), `js/views/pilotage.js` (l. 46), `docs/GERANT.md` (« TVA sur la marge », « Points à faire valider »).

Recalcul sur les hypothèses par défaut (5 000 packs, 151 854 € de ventes, marge de jeu 22 375 €) :

| Lecture fiscale | TVA / mois | Écart au modèle | Résultat du mois |
| --- | ---: | ---: | ---: |
| Modèle : marge globalisée, rachats = achats | 3 729 € | 0 | 6 433 € |
| Idem, cashback et bonus traités en réductions de prix | 3 370 € | −360 € | 6 793 € |
| Jeu taxé sur mises − gains en numéraire (cartes gardées non déduites) | 8 448 € | +4 719 € | 1 714 € |
| **Marge au coup par coup** (marges négatives perdues) | **9 818 €** | **+6 088 €** | **345 €** |
| Coup par coup, rachat non reconnu comme achat | 11 218 € | +7 488 € | −1 055 € |
| Prix entier, déduction sur les seuls achats fournisseurs | 20 590 € | +16 861 € | −10 428 € |
| Prix entier, aucune déduction | 25 309 € | +21 580 € | −15 146 € |

Pourquoi l'écart : 16,8 % des ventes sortent une carte dont le coût dépasse le prix du pack. Le modèle compense ces 36 527 € de marges négatives avec 58 906 € de marges positives ; vente par vente, seules les positives sont taxées. Exemple : Booster Légende, 5,12 € de TVA par pack dans le modèle, 14,00 € au coup par coup.

Fondements :
- Régime de la marge de plein droit pour un assujetti-revendeur quand le bien lui a été livré par un non-redevable (particulier) ; jamais applicable si le fournisseur a facturé la TVA, ou si le bien a été importé ou acquis en intracommunautaire taxable. CGI art. 297 A ; BOI-TVA-SECT-90-20-20 (version du 14/05/2025) — https://bofip.impots.gouv.fr/bofip/13268-PGP.html/identifiant=BOI-TVA-SECT-90-20-20-20250514 **[R]**
- Globalisation : CGI art. 297 A-II permet une base globale par période de déclaration, avec régularisation annuelle du stock ; marge globale négative = pas de restitution ; le coup par coup est le système par défaut. Même BOI **[R]**. Conditions d'accès (« personnes et biens concernés ») : **non lues [NV]**. Report de l'excédent d'achats sur la période suivante : **[NV]**.
- Base d'une vente par tirage : le prix effectivement payé pour le pack, moins le prix d'achat de la carte tirée (CGI art. 266 et 297 A) **[NV]**. TVA « en dedans » au taux normal : 20/120 de la marge TTC **[NV]** ; les cartes sont des biens d'occasion, pas des « objets de collection » au sens de l'art. 98 A de l'annexe III **[NV]**.
- Rescrit BOI-RES-TVA-000270 du 19/08/2026 : un bien jamais utilisé reste un bien d'occasion s'il est acquis d'une personne ayant définitivement supporté la TVA et dont les ventes restent limitées (fondé sur CJUE, 18/01/2017, C-471/15) — https://bofip.impots.gouv.fr/bofip/15098-PGP.html/identifiant=BOI-RES-TVA-000270-20260819 **[R, extrait tronqué]**. Il couvre le bien « jamais utilisé », pas le bien « jamais livré ».

Autres écarts, plus petits : la TVA est calculée avant cashback et bonus (surestimation d'environ 360 €/mois s'ils sont des réductions de prix) ; les frais de port refacturés sont taxables en totalité et absents du modèle (jusqu'à environ 1 000 €/mois si chaque carte gardée part seule par un service postal exonéré) ; l'Évolution et les frais de retrait ne sont pas modélisés ; rien ne dit si les 6 000 € de frais fixes et le coût de 75 % sont HT ou TTC.

### C2 — Rachat d'une carte jamais sortie du stock : trois lectures, le site en affiche deux — risque élevé

Élément concerné : `js/views/legal.js` l. 23 (« crédit en avoir »), `js/economics.js` (rachat compté comme coût d'achat), rachat à 90 % dans les 10 minutes.

- **A. Vente puis achat d'occasion à un particulier** (lecture du modèle). Tenable si la vente transfère réellement la propriété (le joueur peut exiger l'envoi). Conséquences : marge sur chaque revente, registre des objets mobiliers et identification du vendeur à chaque rachat (C4), pièce d'achat par rachat.
- **B. Annulation de vente ou réduction de prix** (lecture des CGV : « avoir »). Alors il n'y a plus d'achat d'occasion ; ce que le site conserve (prix − rachat) rémunère un tirage, et ce qu'il verse au-delà du prix est un gain. On sort de la vente de biens.
- **C. Jeu d'argent.** Avec 65 % de rachats immédiats en hypothèse centrale, c'est la lecture économique la plus naturelle pour un contrôleur.

Analyse : seule A sauve le modèle fiscal, et elle impose les contraintes du négoce d'occasion. Le site ne peut pas plaider A pour la TVA et B dans ses CGV. **[analyse, NV]**

### C3 — Requalification en jeu d'argent : conséquences fiscales — bloquant (pour une raison non fiscale)

- CGI art. 261 E : exonération réservée aux jeux soumis au prélèvement progressif (casinos) et au produit de la loterie nationale, du PMU, des paris sportifs et jeux de cercle en ligne, hors rémunération des organisateurs — https://bofip.impots.gouv.fr/bofip/713-PGP.html **[R]**. Un pack mystère n'entre dans aucune de ces cases.
- Jeux taxables : la doctrine impose la rémunération de l'organisateur, soit mises − sommes versées aux joueurs, TVA en dedans ; pour les paris à cote, le résultat brut de la période (BOI-RES-TVA-000033 du 09/03/2021) — https://bofip.impots.gouv.fr/bofip/11703-PGP.html/identifiant=BOI-RES-TVA-000033-20210309 **[R]**. Par analogie : 3 729 à 8 448 €/mois selon que les cartes gardées sont déduites ou non.
- CJUE, 11/06/1998, Fischer, C-283/95 : la neutralité interdit de traiter différemment jeux licites et illicites pour l'exonération — https://www.eurojuris.fr/articles/jeux-hasard-argent-exoneration-tva-7439.htm **[R, commentaire]**. Arrêts Glawe (C-38/93) et Town & County Factors (C-498/99) sur la base d'imposition : **[NV]**.
- Prélèvements spécifiques sur les jeux : à ma connaissance assis sur les opérateurs autorisés (droits exclusifs, casinos, agréés en ligne) ; aucun régime n'accueille une loterie privée en ligne. **[NV, y compris la recodification 2025-2026]**. L'absence de prélèvement n'est pas un avantage : l'activité serait interdite, et ses profits resteraient imposables (TVA, IS) **[NV]**.

### C4 — Registre des objets mobiliers : applicable aux rachats dans la lecture A — risque élevé (pénal)

Élément concerné : rachat, Évolution (carte « apportée à l'échange »), approvisionnement auprès de particuliers, vérification d'identité annoncée seulement avant retrait.

- Code pénal art. 321-7 : registre tenu jour par jour par toute personne dont l'activité comporte la vente d'objets mobiliers usagés ou acquis de non-professionnels ; 6 mois d'emprisonnement et 30 000 € d'amende, y compris par négligence — https://www.assemblee-nationale.fr/dyn/13/questions/QANR5L13QE8646 **[R]**
- Art. R. 321-1 : déclaration préalable en préfecture ; art. R. 321-1 à R. 321-8 : prix d'achat porté au registre, modèle fixé par arrêté, conservation 5 ans, obligation pesant sur les dirigeants — https://www.legifrance.gouv.fr/codes/id/LEGIARTI000043531943/2021-11-01 (version du 01/11/2021, article à relire) et https://entreprendre.service-public.gouv.fr/vosdroits/R76263 **[R]**
- Identité du vendeur avec pièce d'identité, tenue électronique, regroupement des objets de faible valeur (586 des 798 cartes du coffre de démonstration valent 60 € ou moins) : **[NV]**.

Conséquence : environ 3 750 rachats par mois dans le modèle, chacun avec un vendeur identifié. L'identité doit être vérifiée **avant le premier rachat**, pas seulement avant le retrait. Le stock est tenu en quantités par carte (`js/stock.js`), sans exemplaire individualisé ni prix d'achat : ni le registre ni une marge vente par vente ne sont possibles en l'état.

### C5 — Logiciel de caisse et facturation électronique — risque moyen

- CGI art. 286, I-3° bis ; BOI-TVA-DECLA-30-10-30 (version du 25/03/2026) : obligation pour qui enregistre les règlements de particuliers dans un logiciel ; dispense par tolérance si **tous** les paiements passent par l'intermédiation directe d'un établissement bancaire ; preuve par certificat ou attestation de l'éditeur (rétablie par la loi n° 2026-103 du 19/02/2026, art. 125) ; amende 7 500 € — https://bofip.impots.gouv.fr/bofip/10691-PGP.html **[R]**. Ici les packs sont payés par un solde interne tenu par le site : la dispense est douteuse. Cas d'un logiciel développé en interne : **[NV]**.
- Facturation électronique : réception obligatoire pour toutes les entreprises depuis le 1er septembre 2026 ; émission et e-reporting (ventes aux particuliers) au 1er septembre 2027 pour PME et micro-entreprises (LF 2024 art. 91, LF 2026 art. 123) — https://www.impots.gouv.fr/foire-aux-questions-je-decouvre-la-facturation-electronique **[R]**. Contenu du e-reporting pour les opérations sur marge : **[NV]**.

### C6 — Ventes à d'autres États membres — risque moyen à faible

Élément concerné : barème « Europe » de `js/config.js`.
Sous le régime de la marge, la vente reste taxée en France ; opter pour le guichet unique vaut renonciation à la marge pour ces biens ; hors marge, TVA du pays d'arrivée au-delà de 10 000 € de ventes à distance par an — BOI-TVA-SECT-90-60, https://bofip.impots.gouv.fr/doctrine/pgp/1292-PGP **[R]**. Articles 258 A, 259 D et 298 sexdecies G du CGI : **[NV]**.

### C7 — Côté joueur — risque faible aujourd'hui

- Cession de biens meubles exonérée si le prix de cession est ≤ 5 000 € (CGI art. 150 UA, II-2°) — https://bofip.impots.gouv.fr/doctrine/pgp/3788-PGP **[R]**. Carte la plus chère du coffre de démonstration : 1 538 €, aucune au-dessus de 5 000 €.
- Au-delà : plus-value à 19 % plus prélèvements sociaux (taux 2026 **[NV]**), formulaire 2048-M ; ou, si la carte est un « objet de collection », taxe forfaitaire de 6 % + 0,5 % de CRDS, formulaire 2091 dans le mois (CGI art. 150 VI à 150 VM) — https://www.economie.gouv.fr/particuliers/vente-objet-precieux-fiscalite-taxe **[R]**. Versement de cette taxe par l'acquéreur professionnel (art. 150 VK) : **[NV]**, à vérifier avant tout lot ou rachat supérieur à 5 000 €.

### C8 — Plateformes (DAC7) — risque faible, moyen si la vente entre joueurs est lancée

CGI art. 1649 ter A à 1649 ter E (loi n° 2021-1900, art. 134) : l'opérateur met à disposition de vendeurs une plateforme qui les connecte à d'autres utilisateurs — https://bofip.impots.gouv.fr/doctrine/pgp/13742-PGP **[R]**. Un site qui rachète pour son propre compte ne met personne en relation : il n'est pas opérateur à ce titre **[analyse, NV]**. La « vente entre joueurs » de `docs/GERANT.md` le ferait entrer dans le dispositif. Seuils d'exclusion (30 ventes, 2 000 €) : **[NV]**.

### C9 — Comptabilité — risque moyen

Tout ce qui suit est **[NV]**. Soldes des joueurs : dettes, jamais du chiffre d'affaires (vente constatée à l'ouverture du pack). Stock : coût d'acquisition par exemplaire, donc 90 % ou 85 % de la cote pour une carte rachetée, avec dépréciation si la cote baisse. Bonus non débloqués, cashback acquis, cagnottes de giveaways, dotation du classement : provisions ou dettes dès la vente. Factures sans TVA apparente avec la mention du régime particulier ; pièce d'achat pour chaque rachat ; comptabilité séparant opérations sur marge et régime général.

### C10 — Hypothèses de coût — risque moyen (non fiscal)

75 % de la cote (moyenne Cardmarket 30 jours, `scripts/build-cards.mjs`) : n'ouvre la marge que si le vendeur est un particulier. 3 % de frais : n'inclut ni les virements de retrait, ni le coût unitaire de vérification d'identité, ni un tarif de secteur à risque **[NV]**.

## 3. Actions recommandées

**(a) Dans le site et le code**
1. `js/economics.js` : remplacer le booléen `vat` par un régime (`marge globale`, `marge coup par coup`, `prix entier`, `exonéré`) ; coup par coup = Σ p × max(0, prix − coût de l'exemplaire) × 20/120 sur `dropTable(pack)` (voir `tva.mjs`) ; afficher la fourchette dans Pilotage et la tester dans `scripts/smoke.mjs`.
2. Sortir cashback et bonus de la base, ajouter la TVA des frais de port, préciser HT ou TTC pour `fixed` et `cost`.
3. `docs/GERANT.md` : ajouter le cas intermédiaire (9 818 €) et le plafond supportable (10 162 €).
4. `js/views/legal.js` l. 23 : choisir « achat par le site » ou « avoir », pas les deux.
5. Stock par exemplaire : origine, date, prix d'achat, régime de TVA, numéro de registre ; chaque rachat enregistré comme un achat avec vendeur identifié.
6. Vérification d'identité avant le premier rachat.
7. Journal des ventes et des règlements inaltérable, clôturé et archivé côté serveur.
8. Plafonner lots et rachats à 5 000 € tant que la procédure du côté vendeur n'est pas arrêtée.

**(b) Structure, entreprise, professionnel**
1. Faire trancher la qualification (vente ou jeu) avant tout le reste, puis demander un rescrit TVA sur le couple vente du pack / rachat.
2. Déclaration préalable en préfecture et registre avant le premier achat à un particulier.
3. Plateforme agréée pour recevoir les factures électroniques ; préparer le e-reporting de 2027.
4. Certificat ou attestation pour le système d'encaissement, ou confirmation écrite de la dispense.
5. Politique comptable : stock, soldes, provisions.

## 4. Non vérifié / à confirmer

- Texte en vigueur de CGI art. 297 A (I, II) et conditions de la globalisation.
- Rescrit du 19/08/2026 en entier.
- Mentions du registre (art. R. 321-3 et suivants), seuil de regroupement, registre électronique.
- Prélèvements sur les jeux hors agrément et textes 2025-2026.
- Arrêts Glawe et Town & County Factors.
- Seuils DAC7 ; art. 150 VK ; taux 2026 des prélèvements sociaux.
- Dispense de logiciel de caisse quand le règlement passe par un solde interne ou un établissement de paiement.
- Régime des œuvres d'art et objets de collection depuis 2025.
- Franchise en base : sans objet au volume modélisé.
- Hôtes à autoriser pour relire les sources : `bofip.impots.gouv.fr`, `www.impots.gouv.fr`, `www.economie.gouv.fr`, `www.legifrance.gouv.fr`.

## 5. Ce que l'expert-comptable doit valider en premier

1. **La qualification unique du couple vente du pack / rachat** (achat d'occasion, annulation, ou jeu), appliquée partout : TVA, CGV, registre, comptes.
2. **L'accès à la globalisation** (CGI art. 297 A-II) pour cette activité : c'est 6 088 € par mois, soit 73 000 € par an, et la différence entre un résultat de 6 433 € et de 345 €.
3. **L'éligibilité à la marge par canal d'approvisionnement** (particuliers, professionnels facturant la TVA, import) et la portée du rescrit du 19/08/2026 pour une carte rachetée sans avoir quitté le coffre.
4. Ensuite : registre et pièces d'achat par rachat, système d'encaissement, soldes des joueurs en dettes, provisions.

## Fichiers

- Script de recalcul : `tva.mjs` (`node tva.mjs`, lecture seule sur le dépôt).
- Dépôt non modifié (`git status` vide après exécution).
