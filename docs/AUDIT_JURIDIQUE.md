# Audit juridique

Pré-audit du 27 novembre 2026. Il a été mené par des agents spécialisés, un par domaine, puis recoupé.
**Ce n'est pas un avis d'avocat** : il sert à savoir quoi demander à un avocat et à un expert-comptable, et quoi ne pas lancer en attendant.

Les rapports détaillés, avec les références et les textes prêts à coller, sont dans [`docs/audit/`](audit/).

## Verdict

1. **Tel qu'il est conçu, le site ne peut pas être exploité en argent réel en France.** Payer pour un tirage au sort dont le lot se revend aussitôt contre un solde retirable réunit les quatre critères du jeu d'argent et de hasard interdit : offre au public, sacrifice financier, hasard, espérance de gain (code de la sécurité intérieure, art. L320-1). Le nom donné à l'opération ne change rien : le texte vise les opérations « sous quelque dénomination que ce soit ».
2. **Il n'existe aucune « certification » à obtenir.** En ligne, l'Autorité nationale des jeux (ANJ) n'agrée que les paris sportifs, les paris hippiques et le poker. Les jeux de casino en ligne ne sont pas autorisés en France. Le régime expérimental des jeux à objets numériques (JONUM) ne couvre pas des cartes physiques et interdit justement à l'opérateur de racheter les lots. Une licence étrangère ne donne aucun droit de viser des joueurs français.
3. **Le risque est pénal et personnel** : trois ans d'emprisonnement et 90 000 € d'amende, sept ans et 200 000 € en bande organisée, plus le blocage du site, le gel des flux financiers et 100 000 € d'amende pour la publicité.
4. **Le présenter comme une « vente » ne marche pas non plus.** Une vente à distance ouvre un droit de rétractation de 14 jours, auquel on ne peut pas faire renoncer pour une carte physique tirée au sort ; et un solde rechargeable et retirable tenu par le site est une activité bancaire réservée.
5. **La démonstration actuelle est licite** : crédits fictifs, aucun paiement, aucune carte expédiée. Elle le reste tant qu'aucune valeur réelle n'y entre et qu'elle ne sert pas à annoncer un lancement en argent réel.
6. **Une voie existe**, mais c'est un autre produit : une boutique de cartes à prix fixe, avec des tirages promotionnels accessoires. Elle réutilise le stock réel, le catalogue, l'espace admin et le tirage vérifiable déjà construits.

## Méthode et limites

- Treize agents ont travaillé en parallèle : huit domaines juridiques, cinq volets de qualité (voir [`AUDIT_PROJET.md`](AUDIT_PROJET.md)).
- Les sites officiels (Légifrance, ANJ, CNIL, EUR-Lex, DGCCRF) ne s'ouvrent pas depuis l'environnement de travail. **Aucun texte n'a donc été lu à la source** : les articles ont été vérifiés par les extraits que renvoie le moteur de recherche et par des sources secondaires. Chaque rapport détaillé classe ses affirmations : extrait d'une page officielle, source secondaire, ou connaissance générale non vérifiée.
- Les points décisifs ont été recoupés par une seconde série de recherches indépendantes : définition de l'article L320-1, peines de l'article L324-1, articles 56 et 57 de la loi du 12 mai 2010, exception des loteries publicitaires, décret JONUM du 4 février 2026, loi du 3 août 2026, absence de légalisation des casinos en ligne. Les deux séries concordent.
- Aucune décision de justice n'est citée par son numéro : aucune n'a pu être vérifiée. Aucune décision française ne tranche, à notre connaissance, le cas précis d'un site de packs de cartes physiques.
- Avant tout usage, les numéros d'articles sont à relire sur Légifrance.

## 1. Jeux d'argent et de hasard

Rapport détaillé : [`audit/01-jeux-argent.md`](audit/01-jeux-argent.md).

### Qualification, mécanique par mécanique

| Mécanique | Sacrifice financier | Hasard | Espérance de gain | Conclusion |
|---|---|---|---|---|
| Pack tiré au sort, rachat contre solde retirable | le prix du pack | oui | oui : cote affichée, euros | jeu d'argent interdit |
| Évolution (miser une carte pour en gagner une plus chère) | la carte misée, qui a une valeur | pur | oui | jeu d'argent interdit, dans toutes les variantes |
| Roue du cashback | la cagnotte acquise, qu'on risque | oui | oui | jeu d'argent autonome |
| Giveaway à ticket lié à l'achat, financé par 5 % du prix | oui, pas de voie gratuite | oui | oui | loterie interdite ; l'exception publicitaire ne joue pas |
| Bonus de dépôt à rejouer 10 fois | le dépôt | non | — | pas un jeu en soi, mais la signature d'un casino |
| Classement doté | la dépense | non | oui | prime au volume de jeu : tombe avec le reste |

La carte n'est, dans ce circuit, qu'un jeton : mise en euros, tirage, paiement en euros.

### Sans rachat ni retrait

Vendre une carte par tirage au sort, avec des lots de valeurs très inégales dont le site publie lui-même la cote, reste une loterie d'objets : le gain peut être en nature. Publier les probabilités est loyal, mais ne change pas la qualification.

Ce qui distingue un booster du fabricant : produit standard, prix uniforme, aucune valeur attribuée aux cartes, aucun rachat. Un pack recomposé par un revendeur est construit comme une loterie : lots choisis pour leur cote, prix fixé d'après l'espérance, marge de l'organisateur.

### Titres et autorisations

| Piste | Réponse |
|---|---|
| Agrément de l'ANJ | Paris sportifs, paris hippiques et poker seulement (CSI, art. L320-6 ; loi n° 2010-476 du 12 mai 2010). |
| Casino en ligne | Non légalisé en novembre 2026. Aucun texte adopté ni inscrit à l'ordre du jour. |
| JONUM (loi n° 2024-449 du 21 mai 2024, art. 40 et 41 ; décret n° 2026-60 du 4 février 2026) | Objets numériques seulement, lots en nature accessoires et plafonnés, rachat par l'opérateur interdit. Expérimentation jusqu'en mai 2027. |
| Audit du tirage par un laboratoire, « provably fair » | Exigence technique, pas un droit d'exploiter. |
| Licence étrangère (Curaçao, Malte…) | Non reconnue en France. Viser des joueurs français reste une offre illégale. |

### Sanctions

| Risque | Texte |
|---|---|
| Trois ans et 90 000 € ; sept ans et 200 000 € en bande organisée | CSI, art. L324-1 ; loi n° 2010-476, art. 56 |
| Confiscation, interdictions, amende quintuplée pour la société | CSI, art. L324-13 ; code pénal |
| Publicité pour une offre non autorisée : 100 000 €, ou quatre fois la dépense publicitaire ; vise aussi créateurs et affiliés | Loi n° 2010-476, art. 57 |
| Blocage et déréférencement par l'ANJ, étendus aux VPN depuis août 2026 | Loi n° 2010-476, art. 61 ; loi n° 2026-725 du 3 août 2026 |
| Gel des flux financiers | Code monétaire et financier, art. L563-2 |
| Nullité des contrats, restitutions demandées par les joueurs | Code civil |

La responsabilité pénale est personnelle : la société ne fait pas écran.

### Les variantes, de la plus risquée à la plus défendable

| Variante | Risque | Pourquoi |
|---|---|---|
| Exploitation depuis l'étranger sous licence étrangère | bloquant | L'offre vise le public français : infraction, blocage, gel des flux. |
| Rachat en bon d'achat non remboursable | élevé, bloquant si le bon rachète des packs | Jetons de casino. |
| Packs avec expédition seule | élevé | Loterie d'objets. |
| Valeur garantie au moins égale au prix payé | moyen | Plus de perte possible, mais il faut un écart de valeurs étroit, aucun rachat, aucun solde. |
| **Boutique à prix fixe + tirages promotionnels** | faible à moyen | Seul ancrage dans les textes : CSI, art. L320-6, 7°, et code de la consommation, art. L121-20. |
| Participation gratuite financée autrement | faible | Pas de sacrifice financier. Économie fragile. |

Conditions de la voie « boutique » : le client choisit sa carte et la paie au prix du marché, sans surcoût ; la dotation vient du budget marketing, jamais d'une part affichée du prix ; tirage périodique et modeste ; règlement publié ; aucun rachat de lot, aucun solde, aucun retrait, aucune condition de mise ; pas d'habillage de casino qui ferait du tirage l'objet principal.

## 2. Protection des joueurs, mineurs, publicité

Rapport détaillé : [`audit/02-jeu-responsable.md`](audit/02-jeu-responsable.md).

- **Âge** : rien n'est vérifié (une case à cocher, une mention sous le choix du thème), sur un univers qui attire les mineurs. Un achat fait par un mineur est annulable même s'il s'est déclaré majeur (code civil, art. 1146 à 1149). La publicité pour un jeu d'argent ne peut pas utiliser des personnages de l'univers des mineurs (CSI, art. D320-10).
- **Limites** : une seule (dépense quotidienne en packs), facultative, relevable sans délai, qui ignore les recharges, l'Évolution et la roue. Les opérateurs agréés doivent faire fixer des plafonds de dépôts et de mises avant de jouer, avec un délai avant tout relèvement (décret n° 2010-518, art. 16).
- **Pause** : 30 jours au plus, ne bloque ni les recharges ni la roue. Référence : 24 heures à 12 mois, plus une clôture définitive (même décret, art. 18).
- **Message de mise en garde** : celui du site reprenait une formule abrogée. La formule en vigueur : « Les jeux d'argent et de hasard peuvent être dangereux : pertes d'argent, conflits familiaux, addiction… » (arrêtés du 11 juillet 2023 et du 4 mars 2026).
- **Mécaniques qui poussent à rejouer** : achat en un clic jusqu'à dix packs, mode rapide, pertes fêtées comme des gains (16 à 33 % des tirages), roue, minuteur de rachat, classement doté, taux de cashback croissant, bonus qui bloque l'expédition.
- **À venir** : proposition européenne « Digital Fairness Act » du 11 novembre 2026, qui viserait les récompenses variables payantes, paquets de cartes compris ; adoption peu probable avant 2028.

Déjà bien fait : probabilités publiées et recalculées, roulette sans quasi-gain fabriqué, contenus simulés étiquetés, bilan net dans le rappel de session, phrases franches sur l'espérance négative, argent déposé séparé du bonus.

## 3. Consommation et commerce en ligne

Rapport détaillé, avec douze textes prêts à coller : [`audit/03-consommation.md`](audit/03-consommation.md).

- **Rétractation** (bloquant) : aucune des exceptions de l'article L221-28 du code de la consommation ne vise une carte physique tirée au sort. La renonciation n'est pas valable ; tant que la carte est au coffre, le délai de 14 jours n'a même pas commencé. Un droit de rétractation respecté revient à un rachat à 100 % pendant 14 jours : la marge disparaît. Le seul régime qui écarte ce droit est celui des jeux d'argent.
- **Bouton de rétractation en ligne** : obligatoire depuis le 19 juin 2026 (ordonnance n° 2026-2 et décret n° 2026-3 du 5 janvier 2026).
- **Parcours de commande** : bouton qui dit qu'on paie, récapitulatif à chaque achat, acceptation des conditions de vente, confirmation par e-mail, frais de livraison annoncés avant l'achat, prix « TTC ».
- **Giveaways** : affecter une part affichée du prix à la cagnotte, sans voie gratuite, est la présentation la plus risquée ; annoncer douze lots quand seuls les lots « débloqués » sont tirés est trompeur.
- **« Retour de 86 à 92 % »** : chiffre exact, mais c'est une moyenne tirée par de rares gros lots. Sur le stock de démonstration, 70 à 80 % des tirages valent moins que le prix du pack. Cette information doit figurer là où le chiffre flatteur est mis en avant.
- **Conformité du bien** : image générique, nom français sur une carte imprimée en anglais, état et authenticité non décrits.
- **Livraison** : le risque de perte ou de casse pèse sur le vendeur jusqu'à la remise ; facturer une « assurance » laisse croire le contraire.
- **Mentions** : médiateur de la consommation à désigner ; la plateforme européenne de règlement des litiges est fermée depuis le 20 juillet 2025, ne pas la citer.

## 4. Paiements et lutte contre le blanchiment

Rapport détaillé : [`audit/04-paiements.md`](audit/04-paiements.md).

- **Solde retirable tenu par le site** (bloquant) : recevoir des fonds du public à charge de les restituer est réservé aux établissements agréés (code monétaire et financier, art. L312-2 et L511-5 ; peines de l'art. L571-3 : trois ans et 375 000 €). L'exemption de « réseau limité » (art. L521-3) vaut pour acheter des biens, pas pour un retrait en euros.
- **Prestataires et réseaux de cartes** (bloquant en pratique) : ils excluent les jeux de hasard à lot de valeur. Se faire accepter comme commerce de détail pour une activité jugée jeu d'argent mène à la résiliation.
- **Blanchiment** : le circuit recharge par carte, rachat, virement est un canal évident (cartes volées, comptes de complaisance, double gain par contestation). Identité et âge se vérifient avant le premier paiement, pas au retrait ; l'argent ressort d'abord vers la carte d'origine.
- **Annonces du site** : « retirable à tout moment » contredisait le minimum de 20 € et le délai de 7 à 14 jours ; « prestataire agréé » laissait croire que le solde est protégé.
- **Schéma le plus simple** : pas de solde, paiement par carte à chaque achat avec authentification forte. **À éviter absolument** : le portefeuille maison retirable, qui est la cible actuelle.

## 5. Fiscalité et comptabilité

Rapport détaillé : [`audit/05-fiscalite.md`](audit/05-fiscalite.md). Synthèse plus bas, section « Compléments ».

## 6. Données personnelles

Rapport détaillé : [`audit/06-rgpd.md`](audit/06-rgpd.md). Synthèse plus bas, section « Compléments ».

## 7. Propriété intellectuelle

Rapport détaillé : [`audit/07-propriete-intellectuelle.md`](audit/07-propriete-intellectuelle.md). Synthèse plus bas, section « Compléments ».

## 8. Autres pays et montages des concurrents

Rapport détaillé : [`audit/08-international.md`](audit/08-international.md). Synthèse plus bas, section « Compléments ».

## Ce qui a été corrigé dans le site

Voir la liste tenue à jour dans [`AUDIT_PROJET.md`](AUDIT_PROJET.md), section « Corrections appliquées ».

## Décisions qui reviennent au porteur du projet

1. **Ne brancher aucun paiement** sur le modèle actuel. Ni précommande, ni liste d'attente payante, ni giveaway réel réservé aux inscrits.
2. **Choisir la suite** :
   - garder le site comme démonstration, sans argent ;
   - ou le transformer en boutique à prix fixe avec tirages promotionnels (la voie défendable) ;
   - ou attendre une évolution de la loi, sans rien fonder dessus.
3. **Consulter un avocat en droit des jeux** avant toute immatriculation tournée vers ce modèle, avec le parcours exact du joueur.
4. **Ne pas faire de promotion** du concept actuel : ni créateurs, ni affiliés, ni campagne annonçant un lancement en argent réel.
5. **Changer de nom** avant toute communication (voir la propriété intellectuelle).

## Questions à poser à l'avocat

1. La boutique à prix fixe avec tirages promotionnels : conditions exactes de l'exception des loteries publicitaires, fréquence et dotation admissibles, voie gratuite, public majeur.
2. La variante « valeur garantie au moins égale au prix » : écart de valeurs admissible, à quelles conditions.
3. Le droit de rétractation quand la carte est gardée au coffre, et le cas d'un coffre tenu par un tiers gardien.
4. La nature d'un avoir non remboursable (réseau limité, déclaration à l'ACPR).
5. L'usage des images et des noms des cartes par un revendeur, et le choix du nom du site.
6. Le statut de la démonstration si elle est montrée publiquement.

## Principales sources

Textes (liens Légifrance, vus en extraits de recherche) :

- [Code de la sécurité intérieure, art. L320-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000039182525), [art. L320-6](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000039169738/), [art. L324-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000039182736)
- [Loi n° 2010-476, art. 56](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000028689534), [art. 57](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000045294013), [art. 61](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000038791253/)
- [Loi n° 2024-449, art. 40](https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000049563458) ; [décret n° 2026-60 du 4 février 2026](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000053443861/2026-10-21)
- [Code de la consommation, art. L221-28](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170) ; [ordonnance n° 2026-2, art. 3](https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000053298866)
- [Ordonnance n° 2019-1015 du 2 octobre 2019](https://www.legifrance.gouv.fr/jorf/id/JORFSCTA000039167505)

Autorités :

- [ANJ, jeux à objets numériques monétisables](https://anj.fr/jeux-objets-numeriques-monetisables-jonum) ; [ANJ, lutte contre l'offre illégale](https://anj.fr/lutter-contre-loffre-illegale) ; [ANJ, blocage de Polymarket](https://anj.fr/promotion-dune-offre-de-jeux-dargent-illegale-blocage-du-site-polymarket)
- [ARJEL, rapport d'activité 2017-2018](https://anj.fr/sites/default/files/2019-12/rapport-activite-Arjel%202018.pdf) (loot boxes et lots monétisables)
- [DGCCRF, fiche « Loterie : des pratiques commerciales réglementées »](https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/loterie-des-pratiques-commerciales-reglementees)
- [OFDT, note sur la réglementation des jeux d'argent](https://www.ofdt.fr/sites/ofdt/files/2025-07/note-reglementation-jah_8_1.pdf)
- [ACPR, position 2022-P-01 sur le réseau limité](https://acpr.banque-france.fr/system/files/import/acpr/media/2023/07/26/20230726_position_2022-p-01.pdf)

Analyses :

- [Le Club des juristes, blocage étendu aux VPN](https://think-tank.leclubdesjuristes.com/jeu-illegal-en-ligne-lanj-etend-son-pouvoir-de-blocage-aux-vpn-par-maxime-gervy-senior-legal-manager-la-francaise-des-jeux-fdj/) ; [loi du 3 août 2026, commentaire d'avocat](https://www.reynaud-avocat.com/2026/09/01/jeux-d-argent-ce-que-change-la-loi-du-3-ao%C3%BBt-2026/)
- [Analyse d'avocat sur les sites de « mystery box »](https://kohenavocats.com/mystery-box-en-ligne-hypedrop-packdraw-rillabox-jeu-argent-interdit-france-recuperer-argent/) : critères du jeu d'argent jugés réunis, aucune décision ni mesure de l'ANJ connue à ce jour
- [Bird & Bird, régime JONUM](https://cm.twobirds.com/en/insights/2025/france/loi-sren-nouvelle-definition-et-nouveau-regime-pour-les-jeux-a-objets-numeriques-monetisables-jonum)

La liste complète figure à la fin de chaque rapport détaillé.
