# Rapport 04 — Paiements et lutte contre le blanchiment (France / UE)

Audit du 27 novembre 2026. Dépôt lu en lecture seule. Ce rapport n'est pas un avis d'avocat.

## Limites de méthode (à lire avant le reste)

- **Aucun texte n'a pu être lu à la source officielle.** L'outil de lecture de pages n'atteint ni Légifrance, ni la Banque de France / ACPR, ni Stripe depuis cette session (hôtes hors de la liste réseau autorisée : `www.legifrance.gouv.fr`, `cclrf.banque-france.fr`, `stripe.com` seraient à autoriser dans les réglages réseau). Je n'ai pas insisté.
- **Le quota de recherches web de la session (200, partagé entre agents) s'est épuisé** après mes 30 recherches abouties. Six recherches prévues n'ont pas été faites (liste en section 6).
- Statuts utilisés : **[R]** vu dans un résultat de recherche (extrait ; la page n'a pas été relue en entier) ; **[G]** connaissance générale non vérifiée. **Aucun point n'est « lu à la source officielle ».** Les numéros d'articles marqués [G] sont à vérifier sur Légifrance avant tout usage.

## 1. Verdict en trois lignes

1. Le schéma cible (solde en euros rechargé par carte, gardé par le site, retirable « à tout moment » vers un compte bancaire) n'est pas exploitable tel quel : garder des fonds du public à charge de les restituer est une activité réservée et pénalement sanctionnée, et l'exemption de « réseau limité » ne couvre pas un solde retirable en argent.
2. Le verrou réel arrive avant le régulateur : les prestataires courants excluent les jeux de hasard à lot de valeur, et les réseaux de cartes n'admettent le jeu d'argent que sous licence. Tant que la qualification « vente » ou « jeu d'argent » n'est pas tranchée, aucun prestataire sérieux ne suivra, et faire passer pour du commerce de détail une activité jugée jeu d'argent mène à la résiliation.
3. Le plus simple à mettre en conformité : pas de solde, paiement par carte à chaque achat, rachat payé directement (remboursement sur la carte d'origine, puis virement nominatif) ou en avoir non remboursable. À éviter absolument : le portefeuille maison retirable, avec vérification d'identité seulement au moment du retrait.

## 2. Constats, du plus grave au moins grave

### C1 — Solde retirable tenu par le site : activité réservée — risque **bloquant**

**Élément concerné.** `js/store.js` l. 227 (`withdrawable()` : tout le solde hors bonus est retirable, y compris une recharge jamais dépensée) ; `js/views/wallet.js` l. 19-36 et l. 62 (« tout ton solde ») ; `js/ui/topup.js` l. 36 (« Ton dépôt, lui, reste retirable ») ; `js/config.js` l. 83 ; `docs/GERANT.md` l. 302-303.

**Analyse.**

- **Monnaie électronique : non, tant que le solde reste mono-émetteur.** La définition exige une valeur monétaire stockée, représentant une créance sur l'émetteur, émise contre remise de fonds aux fins d'opérations de paiement, « et qui est acceptée par une personne physique ou morale autre que l'émetteur » (CMF, art. L315-1). Un solde utilisable seulement auprès du site ne remplit pas ce dernier critère. Il le remplirait dès qu'un tiers l'accepterait ou que les joueurs pourraient se payer entre eux. [R — libellé vu dans le projet de loi de 2012 qui a créé l'article, https://www.senat.fr/leg/pjl11-737.html ; version en vigueur non relue]
- **Service de paiement : non, tant que le site est partie à chaque opération.** Il vend son propre stock et rachète pour son propre compte : il encaisse son prix et paie sa dette. Ce n'est pas exécuter des paiements pour autrui. [G — CMF art. L314-1 et L133-3 non relus]
- **Le problème est la recharge librement retirable.** Sont des fonds remboursables du public « les fonds qu'une personne recueille d'un tiers, notamment sous la forme de dépôts, avec le droit d'en disposer pour son propre compte mais à charge pour elle de les restituer » (CMF, art. L312-2) [R — https://french-business-law.com/rench-legislation-art/article-l312-2-of-the-french-monetary-and-financial-code, source secondaire]. Les recevoir à titre habituel est réservé aux établissements de crédit (art. L511-5 [G pour le libellé actuel]) ; la violation du monopole est punie de trois ans d'emprisonnement et 375 000 € d'amende, 1 875 000 € pour une personne morale (art. L571-3) [R — Revue Banque, https://www.revue-banque.fr/binrepository/0000000000000000000_RB00583_MG108080297.pdf]. Recharger 100 €, ne rien acheter, retirer 100 € : c'est exactement ce que le site permet et annonce. Le vocabulaire du site (« ton argent », « dépôt », « retirable à tout moment ») décrit lui-même un dépôt.
- **Qualification alternative, même résultat.** L'ACPR peut y voir un compte de paiement (versements, retraits), donc un service de paiement soumis à agrément d'établissement de paiement [G — art. L314-1, L521-2, L522-6], dont l'exercice sans agrément est puni des mêmes peines (art. L572-5) [R — https://french-business-law.com/rench-legislation-art/article-l572-5-of-the-french-monetary-and-financial-code et https://www.swim.legal/blog/agent-prestataire-services-paiement, sources secondaires]. La frontière entre les deux qualifications se discute ; la conclusion pratique ne change pas. À faire trancher par un avocat en droit bancaire.
- **Les exemptions ne sauvent pas un solde retirable.**
  - Art. L511-7, I, 5° : une entreprise peut émettre des instruments de paiement « délivrés pour l'achat auprès d'elle […] d'un bien ou d'un service déterminé » sans enfreindre le monopole bancaire [R — https://french-business-law.com/rench-legislation-art/article-l511-7-of-the-french-monetary-and-financial-code, version non datée].
  - Art. L521-3, I : exception pour les moyens de paiement acceptés seulement dans les locaux de l'entreprise, dans un réseau limité, ou pour un éventail limité de biens ou de services [R — extrait Légifrance, https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000035430673]. Art. L521-3, II : déclaration à l'ACPR dès que la valeur des opérations des douze derniers mois dépasse un million d'euros, puis rapport annuel [R — même source secondaire et instruction ACPR 2013-I-13, https://acpr.banque-france.fr/sites/default/files/media/2024/11/20/20241120_instruction_2013-i-13.pdf]. L'ACPR compterait flux entrants et sortants [R — Forum Fintech 2025, https://acpr.banque-france.fr/system/files/2025-10/20251017_Forum-Fintech-ACPR-AMF-2025_Atelier_Paiement.pdf ; ce support parle d'« autorisation » au-delà du seuil, à confirmer]. Avec des packs jusqu'à 249 €, un million par an est atteint à environ 2 740 € de flux par jour.
  - Position ACPR 2022-P-01 (20 juillet 2022, modifiée le 11 juillet 2023) : un réseau limité peut être uniquement en ligne ; l'exemption tombe si l'instrument a vocation à un usage général [R — https://acpr.banque-france.fr/system/files/import/acpr/media/2023/07/26/20230726_position_2022-p-01.pdf]. L'art. L525-5 est le pendant pour la monnaie électronique [R — cité par la position ; texte non lu] ; il est sans objet si le solde n'est pas de la monnaie électronique.
  - Ces textes visent des moyens de paiement servant à **acquérir des biens ou des services**. À mon analyse, ils ne couvrent pas un retrait en euros vers un compte bancaire. [analyse — à confirmer auprès de l'ACPR]
- **Agent de prestataire de services de paiement** (art. L523-1 et s.) : l'agent agit sous mandat et sous la responsabilité d'un prestataire agréé, qui le fait enregistrer auprès de l'ACPR ; il applique ses obligations LCB-FT (art. L523-3) [R — FAQ ACPR du 6 janvier 2022, https://acpr.banque-france.fr/sites/default/files/20220106_faq_devenir_un_agent_de_psp.pdf]. Les fonds restent ceux du mandant et sous sa protection : ce statut ne permet pas au site de les garder pour son propre compte. [G]
- **Établissement partenaire.** La seule façon propre d'offrir un solde retirable : les fonds sont détenus par un établissement de monnaie électronique ou de paiement, dans des portefeuilles ouverts au nom des joueurs, avec protection des fonds (cantonnement : art. L522-17 pour les établissements de paiement [G — non vérifié]). Le solde devient alors une vraie monnaie électronique émise par le partenaire et acceptée par le site [analyse]. Mais ces partenaires excluent les jeux d'argent (voir C2). Stripe Connect est conçu pour reverser à des vendeurs tiers, pas pour tenir des soldes de consommateurs [G].
- **Ce que dit `docs/GERANT.md` (l. 302-303) est juste mais incomplet** : un prestataire qui encaisse les cartes ne « garde » pas l'argent des joueurs. Une fois les fonds versés sur le compte bancaire du site, le solde est une simple dette du site.

### C2 — Acceptation par les prestataires et les réseaux de cartes — risque **bloquant en pratique**

**Élément concerné.** Tout le modèle (pack au contenu tiré au sort, rachat en argent, bonus à « rejouer », cashback, roue) ; `js/ui/topup.js` l. 27 et `js/data/faq.js` l. 55 (« prestataire de paiement agréé »).

- **Stripe** : la liste des activités interdites vise les jeux de hasard, dont les jeux d'argent en ligne, les jeux de casino, les loteries promotionnelles et concours « à lot monétaire ou matériel ». Les « mystery boxes » n'y sont pas nommées ; la liste est indicative. [R — extrait de https://stripe.com/legal/restricted-businesses, page non relue en entier]
- **Mangopay** : jeux d'argent interdits (paris, casinos en ligne, loteries, pronostics, jeux d'adresse avec mise), plus toute activité interdite par les réseaux de cartes [R — https://mangopay.com/prohibited-businesses]. **Lemonway** : liste publique indicative, liste complète confidentielle [R — https://support.lemonway.com/hc/en-us/articles/360020013757-What-activities-are-Prohibited-at-Lemonway].
- **Code marchand 7995** (paris et jeux d'argent) : catégorie à haut risque, enregistrement obligatoire auprès des réseaux [R — blogs de prestataires] ; licence valable dans le pays du porteur et avis juridique demandés par les acquéreurs [G — non vérifié dans les règles Visa / Mastercard]. En France, aucune licence n'existe pour ce type de jeu en ligne [G — à confirmer par l'agent chargé de la qualification] : la voie 7995 est fermée.
- **Le piège** : se faire accepter en commerce de détail (jouets, cartes, objets de collection) alors que l'acquéreur ou le réseau y voit un jeu d'argent. Le programme BRAM de Mastercard vise le jeu d'argent illégal ou mal codé et le « blanchiment de transactions » ; le programme VIRP de Visa sanctionne l'acquéreur, sans barème d'atténuation [R — LegitScript, https://www.legitscript.com/wp-content/uploads/2023/05/BRAM-and-VIRP-Basics-Info-Sheet.pdf, source secondaire]. Conséquence usuelle : résiliation et inscription sur les fichiers de marchands résiliés [G].
- **Blocage administratif des flux** : le ministre chargé du budget peut, sur proposition de l'ANJ, interdire pour six mois renouvelables tout mouvement de fonds vers ou depuis un opérateur illégal (CMF, art. L563-2) ; l'ANJ dit y recourir depuis janvier 2025 [R — exposé des motifs de l'amendement n° 144 au texte n° 2797, https://www.assemblee-nationale.fr/dyn/17/amendements/2797/AN/144.pdf ; article non relu].
- **État du droit sur les « mystery boxes »** : un cabinet d'avocats indique qu'à sa connaissance ni l'ANJ ni un juge n'ont statué sur les sites de ce type, tout en estimant les critères du jeu d'argent réunis [R — https://kohenavocats.com/mystery-box-en-ligne-hypedrop-packdraw-rillabox-jeu-argent-interdit-france-recuperer-argent/, opinion]. Qualification : hors de ma mission, mais elle commande l'accès au paiement.
- **« Certifications »** : la norme PCI DSS porte sur la sécurité des données de carte ; elle n'est ni un agrément ni une autorisation, et aucune certification ne remplace l'accord écrit d'un acquéreur informé du modèle réel. [G]

### C3 — Circuit dépôt → pack → rachat → retrait : canal de blanchiment — risque **élevé**

**Élément concerné.** `withdrawable()`, rachat à 90 % dans les 10 minutes (`RULES.buybackRate`), retrait par virement (`js/views/wallet.js` l. 27-32), vérification d'identité seulement « avant tout retrait » (`js/views/transparency.js` l. 35).

**Le site est-il une entité assujettie ?** Probablement non aujourd'hui.

- L'art. L561-2 du CMF, dans sa version en vigueur du 5 août 2026 au 10 juillet 2027 (modifié par la loi n° 2026-725 du 3 août 2026), liste les assujettis [R — métadonnées Légifrance, https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000050361172 ; texte intégral non lu].
- Le 9° bis vise les opérateurs de jeux ou de paris **autorisés** sur le fondement de l'art. 21 de la loi n° 2010-476 [R — table de concordance Légifrance] ; le 9° (casinos et autres opérateurs autorisés, de mémoire) n'a pas été relu [G]. Les entreprises de JONUM sont assujetties [R — guide ANJ de février 2026, https://anj.fr/sites/default/files/2026-02/Guide%20pratique%20obligations%20LCB-FT%20JONUM.pdf].
- Le 11°, réécrit par l'art. 67 de la loi n° 2026-534 du 25 juin 2026 et en vigueur depuis le 1er août 2026, vise l'horlogerie, la bijouterie, la joaillerie et l'orfèvrerie pour des biens de plus de 10 000 €, en plus des commerçants acceptant de gros paiements en espèces ou en monnaie électronique [R — https://www.cabinet-angeli.fr/2026/07/03/lutte-contre-le-blanchiment-de-nouveaux-professionnels-concernes/ et https://www.victorisavocat.com/blog/lcb-ft-horlogers-bijoutiers-comptoirs-or-obligations ; numérotation exacte à vérifier]. Les cartes à collectionner n'y figurent pas.
- Conséquences : pas d'obligation légale propre d'identification, de vigilance ni de déclaration à Tracfin. Mais (i) le **gel des avoirs** s'impose à toute personne, assujettie ou non (CMF, art. L562-4, depuis l'ordonnance n° 2020-1342 du 4 novembre 2020) [R — DG Trésor, https://www.tresor.economie.gouv.fr/services-aux-entreprises/sanctions-economiques/dispositif-national-de-gel-des-avoirs] ; (ii) le délit de blanchiment vise quiconque facilite la justification mensongère de l'origine de fonds [G — code pénal, art. 324-1, non vérifié] ; (iii) le prestataire de paiement, lui, est assujetti : il imposera par contrat l'identification, la surveillance et ses propres plafonds, et déclarera les flux douteux.
- Un opérateur de jeu **non autorisé** n'est pas un « assujetti » : il est simplement illégal, et les fonds qu'il brasse sont le produit d'une infraction. C'est la raison pour laquelle les prestataires refusent (C2).

**Risque propre au schéma.** Entrée par carte, sortie par virement, avec un coût de 8 à 14 % (voire nul si la recharge est retirée sans achat), en quelques minutes :

1. encaissement de cartes volées : recharge, rachat immédiat ou retrait direct, virement vers le compte d'une « mule » ;
2. intégration : des fonds douteux ressortent sous forme de virement d'une société, libellé « rachat de cartes de collection » ;
3. double gain : retrait par virement, puis contestation du paiement par carte d'origine ;
4. sortie en nature : carte de plusieurs milliers d'euros expédiée à une adresse tierce ;
5. comptes multiples pour le bonus.

**Mesures attendues** (bonne pratique, et ce qu'exigera un prestataire) : identité et âge vérifiés **avant le premier paiement**, pas au retrait ; sortie d'argent d'abord par remboursement sur la carte d'origine à hauteur des sommes payées, le surplus par virement vers un IBAN au nom vérifié du joueur ; aucun retrait d'une recharge non dépensée autrement que par remboursement sur la carte d'origine ; plafonds de recharge, de solde et de sortie ; filtrage de chaque bénéficiaire contre le registre national des gels ; alerte sur les boucles « achat puis rachat immédiat » et les ratios sorties / entrées ; revue manuelle des sorties élevées ; expédition à l'adresse vérifiée ; conservation des pièces et des journaux.

**Règlement (UE) 2024/1624.** Applicable à partir du 10 juillet 2027 (10 juillet 2029 pour les entités de l'art. 3, point 3, n et o) [R — extrait EUR-Lex, https://eur-lex.europa.eu/eli/reg/2024/1624/oj/fra]. Ce qu'il change : règles directement applicables et identiques dans toute l'Union, à la place de la transposition nationale (l'art. L561-2 actuel est d'ailleurs daté « jusqu'au 10 juillet 2027 ») ; liste européenne des assujettis incluant les prestataires de services de jeux d'argent, définis de façon fonctionnelle (mise d'une valeur monétaire dans un jeu de hasard, y compris avec part d'adresse, sur place ou à distance) [R — Bird & Bird, https://www.twobirds.com/en/insights/2025/germany/navigating-the-eu-aml-package-implications-for-online-gambling-service-providers] ; vigilance à l'égard du client dès 2 000 € de mises ou de gains, en une ou plusieurs opérations liées [R — extrait EUR-Lex] ; négociants de biens de grande valeur (annexe IV : bijoux, montres de plus de 10 000 €, etc.) ; plafond européen de 10 000 € pour les espèces (art. 80), la France gardant 1 000 € [R]. Une dérogation nationale pour les jeux à faible risque existe (art. 4) mais ne vaudrait pas pour le jeu en ligne [R — commentaire, https://gicnt.org/eu-aml-package/, non vérifié sur le texte]. **Point d'attention** : la définition étant fonctionnelle, un site de packs avec rachat en argent pourrait y être lu comme prestataire de services de jeux, sans que cela le rende licite en France. [analyse — à valider]

### C4 — Rétrofacturations et programmes de surveillance — risque **élevé** (opérationnel)

- Opération non autorisée : remboursement par la banque du payeur (CMF, art. L133-18), contestation possible pendant treize mois (art. L133-24) [R — INC, https://www.inc-conso.fr/content/comment-contester-une-operation-de-paiement-par-carte-bancaire]. Les litiges commerciaux relèvent des règles des réseaux [G].
- **Visa VAMP** : depuis le 1er avril 2026, un marchand est « excessif » à 1,5 % (fraudes déclarées + litiges, rapportés aux transactions) avec un plancher de 1 500 événements par mois en Europe ; seuils acquéreur à 0,5 % et 0,7 % [R — fiche Visa 2025, https://corporate.visa.com/content/dam/VCOM/corporate/visa-perspectives/security-and-trust/documents/visa-acquirer-monitoring-program-fact-sheet-2025.pdf]. Un petit site n'atteint pas le plancher, mais son acquéreur, tenu à 0,5 %, fixera un seuil contractuel plus bas. Mastercard : 1,5 % et 100 rétrofacturations [R — une seule source, non vérifié].
- Un produit où le client perd de l'argent sur tirage au sort attire les contestations de regret (« je n'ai rien reçu », « je n'ai pas autorisé »). Les fraudes déclarées comptent dans le ratio même quand l'authentification forte transfère la perte à la banque émettrice. [R pour le calcul, G pour le reste]
- **Authentification forte (DSP2)** : obligatoire pour un paiement à distance, sauf dérogation décidée par le prestataire — faible montant (30 € par opération, 100 € cumulés, art. 16 du règlement délégué (UE) 2018/389) ou analyse de risque (100, 250 ou 500 € selon le taux de fraude, art. 18) [R — questions-réponses de l'ABE, https://www.eba.europa.eu/single-rule-book-qa/qna/view/publicId/2018_4040]. `docs/GERANT.md` l. 277 prévoit l'authentification forte sur chaque dépôt : c'est la bonne règle, à tenir en refusant les dérogations.
- **DSP3 / règlement sur les services de paiement** : pas encore publiés. Accord politique le 27 novembre 2025, textes de compromis le 23 avril 2026, position du Conseil en première lecture le 29 octobre 2026, vote du Parlement en deuxième lecture annoncé pour le 14 décembre 2026, publication attendue en janvier 2027, application 21 mois après l'entrée en vigueur, soit vers fin 2028 [R — veilles de cabinets, https://psd3changes.com/ et https://www.legance.com/publications/psd3-and-psr-council-approvalbringsthe-eu-payments-reformcloser/ ; non vérifié sur les registres officiels]. Un lancement en 2027 se fait donc sous DSP2.

### C5 — Ce que le site annonce sur le retrait : incohérent, et trompeur en argent réel — risque **moyen**

1. **« Ton argent n'est jamais bloqué » / « retirable à tout moment »** (`wallet.js` l. 26 et 68, `topup.js` l. 36, `faq.js` l. 49, `config.js` l. 83) contredit trois conditions affichées au même endroit : minimum de 20 € (un solde inférieur est bloqué ; avec des packs à 9,95 € ce sera le cas courant), vérification d'identité préalable, délai de 7 à 14 jours ouvrés. La formule de `transparency.js` l. 67 (« jamais bloqué par un bonus ») est, elle, exacte.
2. **Le délai** (`config.js` l. 107) contredit `docs/GERANT.md` : « délai de quelques jours sur le premier retrait » (l. 251) et « rendre un retrait plus difficile qu'un dépôt » parmi les interdits (l. 266). Un virement SEPA s'exécute en un jour ouvré : deux à trois semaines sont un choix interne. Aucun délai maximal légal ne s'applique à un marchand non régulé [analyse] ; à titre de comparaison, une décision publiée par l'ANJ porterait sur un opérateur agréé sanctionné pour des retraits traités hors délai [R — décision 2024-032 du 14 janvier 2025, https://anj.fr/sites/default/files/2025-01/D%C3%A9cision%202024-032%20du%2014%20janvier%202025.pdf, contenu non lu].
3. **Destination** : `wallet.js` l. 29 annonce un virement « vers un compte à ton nom » ; `GERANT.md` l. 250 dit « uniquement vers le moyen de paiement d'origine ». Il faut choisir (recommandation : carte d'origine d'abord, voir C3).
4. **Identité vérifiée seulement avant le premier retrait** : c'est trop tard pour un produit réservé aux majeurs (`GERANT.md` l. 267 l'interdit lui-même) et pour la prévention du blanchiment, et c'est le moment où le contrôle est vécu comme un obstacle.
5. **Bonus séparé du dépôt** : la mécanique (argent du joueur dépensé d'abord, dépôt jamais gelé par le bonus) est saine et meilleure que les usages du secteur. Deux réserves : le vocabulaire (« dépôt », « mises », « à jouer 10 fois ») est celui d'un casino et pèsera dans l'analyse d'un prestataire ou d'une autorité ; la reprise du reliquat de bonus (`store.js` l. 304-306) doit figurer dans les conditions. Le crédit de bienvenue de 100 € (`config.js` l. 91) est à mettre à zéro, comme le fichier le note.
6. **« Avoir » ou argent ?** `legal.js` l. 23 parle de « crédit en avoir » et de « versement par virement ». Un avoir n'est pas remboursable ; un solde retirable n'est pas un avoir. Le terme doit suivre le schéma retenu.

### C6 — Limites : rien ne borne les entrées d'argent — risque **moyen**

- `deposit()` (`store.js` l. 373-386) : plafond de 1 000 € par recharge, aucun plafond cumulé, aucun contrôle de pause ni de limite. La limite quotidienne ne porte que sur les achats de packs (`store.js` l. 124 et 403).
- La limite est facultative (aucune par défaut) et se retire d'un clic, avec effet immédiat (`settings.js` l. 105-108).
- La pause suspend achats et évolutions, pas les recharges (`settings.js` l. 72).
- Tout cela vit dans le navigateur ; `transparency.js` l. 37 reconnaît que l'application côté serveur reste à faire.

### C7 — « Prestataire de paiement agréé » : promesse incomplète — risque **moyen**

`topup.js` l. 27, `faq.js` l. 55, `transparency.js` l. 34. Vrai pour l'encaissement, mais le lecteur comprend que son solde est protégé. Sans établissement détenteur des fonds, il n'y a ni cantonnement ni garantie des dépôts : en cas de défaillance de la société, le joueur est un créancier ordinaire. À corriger par le schéma (pas de solde) ou, à défaut, à dire.

### C8 — Pistes de `docs/GERANT.md` (l. 314-319) — risque **élevé** si elles sont mises en œuvre

- **Vente entre joueurs avec commission** : le site encaisserait pour le compte d'un tiers. C'est un service de paiement ; il faut un partenaire agréé et, selon le montage, le statut d'agent [R pour l'existence de la doctrine ACPR « J'encaisse des fonds et les reverse à une tierce personne », https://acpr.banque-france.fr/en/node/26817, contenu non lu]. C'est le cas d'usage des portefeuilles de place de marché.
- **Duels de packs** : mises entre joueurs et commission. Jeu d'argent caractérisé, et transferts de valeur entre comptes (risque de blanchiment par perte volontaire). À écarter.

### C9 — Base légale de la collecte des pièces d'identité — risque **faible**

`legal.js` l. 46 invoque les « obligations légales (lutte contre le blanchiment) ». Si le site n'est pas assujetti (C3), cette base ne tient pas pour lui-même ; elle vaut pour le prestataire, ou pour le site s'il devient agent. Sinon : intérêt légitime (lutte contre la fraude) ou exécution du contrat, à documenter.

## 3. Variantes

| Variante | Statut réglementaire | Ce qui reste à traiter |
|---|---|---|
| **Solde retirable tenu par le site** (cible actuelle) | Activité réservée (C1) | Sans issue hors partenaire agréé |
| **Solde retirable tenu par un établissement partenaire** | Régulier : monnaie électronique du partenaire, fonds protégés, identification selon ses règles | Acceptation du modèle par le partenaire (C2) ; coût ; statut d'agent ou de distributeur |
| **Solde non retirable (avoir utilisable sur le site)** | Hors monnaie électronique (L315-1) ; exceptions L511-7, I, 5° et L521-3, I ; déclaration à l'ACPR au-delà d'un million d'euros sur douze mois (L521-3, II) ; pas d'agrément | Remboursement de la recharge non dépensée (rétractation, clôture) sur la carte d'origine ; fonds non protégés, à dire ; le rachat en argent disparaît |
| **Paiement à l'acte, sans solde** | Rien de réglementé côté site : contrat d'acquisition ordinaire | Authentification forte à chaque achat (plus de friction, ce qui freine aussi le jeu compulsif) ; acceptation (C2) |
| **Rachat payé par virement direct** | Le site paie sa propre dette : pas d'agrément | Circuit carte → virement (C3) : carte d'origine d'abord, IBAN au nom vérifié, plafonds ; le rachat en argent reste le marqueur le plus fort du jeu d'argent ; registre des achats d'occasion auprès de particuliers [G — code pénal art. 321-7, non vérifié] |

## 4. Actions recommandées

### (a) Dans le site et le code

1. **Supprimer le retrait libre.** `withdrawable()` ne doit plus inclure une recharge non dépensée. Distinguer dans l'état : prépaiement non consommé (remboursable sur la carte d'origine seulement) et produit des rachats (seul payable par virement).
2. **Mieux : préparer le mode sans solde.** Achat de pack payé à l'acte ; choix au rachat entre paiement direct et avoir non remboursable. Garder `RULES.topups` seulement si le solde non retirable est retenu.
3. **Réécrire les annonces** : retirer « jamais bloqué » et « retirable à tout moment » de `wallet.js`, `topup.js`, `faq.js` et du commentaire de `config.js` ; aligner `wallet.js` l. 27-32 sur `GERANT.md` l. 250-252 ; remplacer « 7 à 14 jours ouvrés » par un engagement court (traitement sous 2 à 3 jours ouvrés, contrôle renforcé seulement sur alerte) ; pas de minimum à la clôture du compte.
4. **Vocabulaire** : « prépaiement » ou « crédit d'achat » plutôt que « dépôt », « ton argent », « retrait » ; choisir entre « avoir » et « solde » dans `legal.js`.
5. **Identité et âge avant le premier paiement** : corriger `transparency.js` l. 35 et la fenêtre de retrait ; prévoir l'état « compte non vérifié : achat impossible ».
6. **Limites** : plafonds par défaut sur les recharges et les achats (jour, semaine, mois) et sur le solde ; baisse immédiate, hausse différée ; la pause bloque aussi `deposit()` ; tout appliqué côté serveur.
7. **Paiement** : authentification forte systématique, page de paiement hébergée par le prestataire, une carte par compte au nom du titulaire, journal des entrées et sorties par moyen de paiement.
8. **Mention sur les fonds** : remplacer « prestataire de paiement agréé » par une phrase exacte sur qui détient l'argent.
9. **Confidentialité** : corriger la base légale des pièces d'identité (`legal.js` l. 46).
10. **Retirer de la feuille de route** les duels de packs ; conditionner la vente entre joueurs à un partenaire agréé.

### (b) Structure, entreprise, professionnels

1. **Faire trancher d'abord la qualification** (vente ou jeu d'argent) par un avocat, par écrit : tout prestataire la demandera.
2. **Consulter un avocat en droit bancaire** sur le solde : fonds remboursables du public ou compte de paiement, exemption L521-3, déclaration à l'ACPR. Le pôle Fintech de l'ACPR répond aux porteurs de projet.
3. **Présenter le modèle réel par écrit à deux ou trois acquéreurs** avant tout développement, rachat et tirage compris, et obtenir un accord écrit sur le code marchand. Ne jamais minimiser l'aléa.
4. **Si le solde retirable est maintenu** : contrat avec un établissement de monnaie électronique ou de paiement qui détient les fonds et accepte l'activité ; statut d'agent ou de distributeur si exigé.
5. **Dispositif anti-blanchiment volontaire**, écrit : cartographie des risques, plafonds, filtrage contre le registre des gels, procédure de signalement au prestataire, responsable désigné. À réévaluer avant le 10 juillet 2027.
6. **Réserve financière** pour les impayés et la réserve que retiendra l'acquéreur ; suivi mensuel du taux de fraude et de litiges, avec une cible sous 0,5 %.
7. **Expert-comptable** : TVA sur la marge, comptabilisation des prépaiements et des avoirs, registre des rachats auprès de particuliers.

## 5. Schéma le plus simple, schéma à éviter

**Le plus simple à mettre en conformité.**

1. Pas de solde. Chaque pack est payé par carte, avec authentification forte, auprès d'un acquéreur qui connaît le modèle.
2. Identité, majorité et carte au nom du joueur vérifiées avant le premier achat.
3. Rachat : au choix du joueur, soit un avoir non remboursable (utilisable sur le site, plafonné), soit un paiement direct : remboursement sur la carte d'origine à hauteur des achats récents, le surplus par virement vers un IBAN à son nom, sous deux à trois jours ouvrés.
4. Plafonds d'achat et de sortie, filtrage contre le registre des gels, surveillance des boucles achat-rachat.

Variante encore plus simple côté paiement : aucun rachat en argent (expédition ou avoir seulement). L'argent ne sort plus ; le risque de blanchiment et le problème du solde disparaissent. Reste l'aléa, donc la question de la qualification.

**À éviter absolument.**

- Le portefeuille maison : recharge par carte, fonds sur le compte bancaire du site, retrait libre vers n'importe quel IBAN, identité vérifiée au retrait, bonus à rejouer. C'est la cible actuelle.
- Ses aggravations : transferts ou paris entre joueurs ; prestataire « haut risque » hors Union, cryptoactifs ou code marchand de complaisance pour contourner un refus ; exemptions d'authentification forte pour fluidifier les recharges.

## 6. Non vérifié / à confirmer

**Recherches prévues, non faites (quota épuisé) :**

1. Loi n° 2010-476, art. 17 : approvisionnement et reversement des comptes joueurs sur un compte de paiement unique (modèle de la règle « moyen de paiement d'origine »).
2. Code de la consommation, art. L221-24 (remboursement par le même moyen de paiement), L212-1 (clauses abusives), L121-2 (pratiques trompeuses).
3. Règlement (UE) 2024/886 : vérification du bénéficiaire des virements (date du 9 octobre 2025 [G]).
4. Politiques de PayPal, Adyen, Checkout.com et Worldline sur les jeux de hasard et les « mystery boxes ».
5. Statut exact de Mangopay et de Lemonway et rôle demandé à la plateforme ; fonctionnement de Stripe Connect.
6. Doctrine ACPR sur l'encaissement pour compte de tiers.

**Textes cités sans lecture à la source (tous) et, plus particulièrement :**

- Libellés en vigueur des art. L312-2, L314-1, L315-1, L511-5, L511-7, L521-2, L521-3, L522-6, L522-17, L523-1, L523-3, L525-5, L561-2, L562-4, L563-2, L571-3, L572-5 du CMF ; art. 3, 4, 19 et 80 du règlement (UE) 2024/1624.
- Numérotation exacte des 9°, 9° bis et 11° de l'art. L561-2 après les lois de 2026 ; si la déclaration de l'art. L521-3, II vise aussi l'instrument accepté par le seul émetteur ; si le dépassement du million appelle une déclaration ou une autorisation.
- Art. 324-1 et 321-7 du code pénal ; arrêt CJUE C-191/17 sur la notion de compte de paiement [G] ; règles Visa et Mastercard elles-mêmes (code 7995, VIRP, BRAM, seuils Mastercard, délais de litige).
- Calendrier DSP3 / règlement sur les services de paiement : dates issues de veilles de cabinets.
- La thèse centrale de C1 (recharge librement retirable = fonds remboursables du public ou compte de paiement) est mon analyse ; je n'ai trouvé aucune prise de position de l'ACPR sur ce cas précis.
