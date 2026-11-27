# Rapport 03 — Droit de la consommation et du commerce en ligne (France / UE)

État au 27 novembre 2026. Ce n'est pas un avis d'avocat. La qualification « jeu d'argent » est traitée par un autre agent ; elle n'est évoquée ici que là où elle commande la réponse.

## Limites de vérification (à lire avant le reste)

- L'outil de lecture de pages n'atteint ni Légifrance, ni economie.gouv.fr (hôtes hors du réseau autorisé de la session) : deux essais, puis arrêt, comme demandé.
- Le quota commun de recherches web a été épuisé après 24 requêtes. Cinq vérifications prévues n'ont pas pu être faites (liste en section 4).
- **Rien n'a donc été « lu à la source officielle ».** Statuts utilisés :
  - **[R-off]** vu dans un résultat de recherche qui pointe vers la page officielle (extrait seulement, page non ouverte) ;
  - **[R]** vu dans un résultat de recherche, source secondaire (cabinet d'avocats, INC, presse) ;
  - **[C]** connaissance générale non vérifiée : le contenu est sûr dans son principe, le numéro d'article ou d'alinéa est à contrôler sur Légifrance.

## 1. Verdict en trois lignes

1. Traité comme une vente en ligne, le modèle bute sur le droit de rétractation : aucune exception de l'article L221-28 ne vise une carte physique tirée au sort, et la renonciation recueillie une fois « pour tes prochains achats » est sans valeur. Tant que la carte reste au coffre, le délai de 14 jours n'a même pas commencé.
2. Le seul régime qui écarte la rétractation est celui des jeux d'argent, exclus du chapitre « contrats à distance » : la mention « sans droit de rétractation » est donc inexacte en droit de la vente et, en plus, elle désigne le produit comme un jeu. C'est le point à faire trancher avant tout le reste.
3. Le reste se corrige dans le site : parcours de commande, bouton de rétractation (obligatoire depuis le 19 juin 2026), giveaways, présentation du « retour » (moyenne tirée par de rares gros lots : 70 à 80 % des tirages valent moins que le prix du pack), frais de port, garantie de conformité, mentions légales, médiateur.

## 2. Constats, du plus grave au moins grave

### C1 — Renonciation au droit de rétractation : invalide. Aucune exception ne couvre un bien tiré au sort. **Bloquant**

Ce que fait le site : `js/views/pack.js` l. 186-196 affiche une seule fois « La carte est tirée tout de suite : l'achat est définitif, sans droit de rétractation. Cet accord vaut pour tes prochains achats. », puis mémorise `settings.instant`. `js/views/legal.js` l. 24 dit au contraire que l'accord est « recueilli à chaque achat ». Les deux textes se contredisent.

Analyse :

- **Nature du contrat.** Un pack = une carte physique dont la propriété est transférée. C'est un contrat de vente ; un contrat qui mêle bien et service reste une vente (C. conso L221-1 [C]). L'ouverture en ligne ne fait que révéler quel bien a été attribué.
- **Point de départ du délai.** Pour une vente, les 14 jours courent à compter de la réception du bien par le consommateur ou par un tiers qu'il désigne, autre que le transporteur (L221-18 [C]). Une carte gardée au coffre du vendeur n'est pas « reçue » : le délai ne court pas, et le client peut se rétracter à tout moment.
- **Exceptions (L221-28).** Version en vigueur depuis le 28 mai 2022, issue de l'ordonnance n° 2021-1734, non modifiée depuis d'après Légifrance [R-off] <https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170>. Liste limitative et d'interprétation stricte (CJUE, 27 mars 2019, C-681/17, slewo [R] <https://www.legalis.net/jurisprudences/cour-de-justice-de-lunion-europeenne-6eme-ch-arret-du-27-mars-2019/>). Examen des candidates (numérotation [C]) :
  - 13° contenu numérique sans support matériel : la carte est un bien corporel ; l'animation d'ouverture n'est pas l'objet du contrat. La CJUE vient de rappeler qu'un service numérique ne relève pas de cette exception (9 juillet 2026, C-234/25, Sky Österreich [R] <https://juricaf.org/arret/CJUE-COURDEJUSTICEDELUNIONEUROPEENNE-20260709-C23425>).
  - 1° service pleinement exécuté avec accord exprès : il faudrait un contrat de service. Ici c'est une vente. Et si le « service » rendu est le tirage, c'est un jeu de hasard.
  - 2° prix dépendant des fluctuations d'un marché financier : le marché des cartes n'en est pas un, et le prix du pack est fixe.
  - 3° bien confectionné selon les spécifications du client ou nettement personnalisé : non.
  - 5° et 9° biens descellés : hygiène, enregistrements, logiciels ; et descellés par le client après livraison. Non.
  - 11° enchère publique : non.
  - **Conclusion : aucune exception ne s'applique à un bien tiré au sort.**
- **Renonciation.** Les règles du chapitre sont d'ordre public (L221-29 [C] ; directive 2011/83/UE, art. 25 [C] <https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX%3A32011L0083>) : on ne renonce pas par avance à ce droit hors des cas prévus. Même dans les cas 1° et 13°, l'accord se donne contrat par contrat et se confirme sur support durable : un accord « pour tes prochains achats » ne vaudrait rien.
- **Réponses aux trois questions posées.**
  1. Pack ouvert en ligne immédiatement : la renonciation n'est pas valable. L'ouverture n'exécute pas le contrat, elle désigne la carte.
  2. Carte physique expédiée ensuite : 14 jours à compter de la réception ; retour de la carte, remboursement du prix du pack et des frais de livraison standard sous 14 jours (L221-23, L221-24 [C]).
  3. Exception réellement applicable à un bien tiré au sort : aucune.
- **Conséquences.** Information fausse sur le droit de rétractation : délai prolongé de 12 mois (L221-20 [C] ; confirmé pour le défaut de bouton [R]) ; pratique trompeuse sur les droits du consommateur (L121-2 [C]) ; amende administrative jusqu'à 15 000 € (personne physique) et 75 000 € (personne morale) [R, non confirmé à la source]. Économiquement, un droit de rétractation respecté revient à un rachat à 100 % du prix pendant 14 jours : le modèle (marge de 8 à 14 %) ne tient pas.
- **Le nœud.** Le seul régime qui supprime la rétractation est l'exclusion des jeux d'argent du chapitre (L221-2 [C] ; directive 2011/83, art. 3 § 3 c [C]). L'invoquer, c'est admettre que l'on exploite un jeu d'argent, interdit sans autorisation (CSI L320-1 [C]). Analyse voisine d'un avocat sur les « mystery boxes » en ligne [R] <https://kohenavocats.com/mystery-box-en-ligne-hypedrop-packdraw-rillabox-jeu-argent-interdit-france-recuperer-argent/>. Le vocabulaire du site (« mises », « jouer », « gain », « jeu responsable », numéro Joueurs Info Service en pied de page) va dans le même sens que la clause.

### C2 — Bouton de rétractation en ligne absent. **Élevé** (conséquence directe de C1)

Depuis le 19 juin 2026, tout professionnel qui conclut des contrats à distance par une interface en ligne doit offrir une « fonctionnalité de rétractation » gratuite, visible et accessible pendant tout le délai, et en informer le client avant le contrat. Textes : ordonnance n° 2026-2 du 5 janvier 2026, art. 3, complétant L221-21 [R-off] <https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000053298866> ; décret n° 2026-3 du 5 janvier 2026 (art. D221-5 : libellés « renoncer au contrat ici » puis « confirmer la rétractation », ou formules analogues ; accusé de réception) [R] <https://cadra.fr/contrats-conclus-avec-les-consommateurs-pensez-a-prevoir-la-possibilite-dune-retractation-en-ligne/>, <https://www.twobirds.com/fr/insights/2026/france/nouvelles-obligations-applicables-au-droit-de-r%C3%A9tractation>. Fiche du ministère mise à jour le 19 juin 2026 [R-off] <https://www.economie.gouv.fr/particuliers/mes-droits-conso/bien-consommer/vente-distance-tout-savoir-sur-votre-droit-de-retractation>. Le site n'a ni bouton, ni formulaire type, ni page « Mes commandes ».

### C3 — Parcours de commande non conforme. **Élevé**

| Point | Élément du site | Fondement |
|---|---|---|
| Bouton « Ouvrir · 9,95 € » : ne dit pas qu'on paie | `pack.js` l. 166 | L221-14 : mention « commande avec obligation de paiement » ou formule analogue sans ambiguïté [R] <https://french-business-law.com/rench-legislation-art/article-l221-14-of-the-french-consumer-code> ; nullité du contrat à défaut [C, article de sanction à vérifier] |
| Après le premier achat, « un clic suffit » : ni récapitulatif, ni étape de correction | `pack.js` l. 186-197 | C. civ. 1127-2 (« double clic » et accusé de réception) [C] ; L221-14 (rappel des caractéristiques et du prix juste avant la commande) [R] |
| CGV jamais acceptées : l'inscription ne fait accepter que les CGU et la confidentialité | `auth.js` l. 41 | C. civ. 1119 [C] ; L221-5 [C] |
| Aucune confirmation sur support durable (pas d'e-mail du tout) | `auth.js` l. 50 | L221-13 [C] |
| Frais de livraison (4,90 € / 9,90 € + 1 %) annoncés seulement au moment de l'expédition, pas avant l'achat du pack | `pack.js`, `collection.js` l. 172 | L221-5 ; à défaut le client ne doit pas ces frais (L221-6 [C]) |
| « TTC » jamais écrit à côté d'un prix | partout | L112-1 et arrêté du 3 décembre 1987 [C] |
| Bouton « Valider la demande » (livraison payante) et « Créditer » (recharge) | `collection.js` l. 177, `topup.js` l. 39 | L221-14 |
| Pas d'accès aux contrats archivés (10 ans dès 120 €) | absent | L213-1 [C] |

### C4 — Giveaways : achat obligatoire financé par le prix, lots non garantis, pas de règlement. **Élevé**

- Cadre : une loterie promotionnelle est licite si elle n'est pas déloyale (L121-20 [C]). La DGCCRF admet l'obligation d'achat, à condition que l'achat porte sur le produit et non sur l'accès au jeu (CA Paris, 14 février 2020, citée par la fiche) [R-off] <https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/loterie-des-pratiques-commerciales-reglementees>. À défaut, on retombe sur l'interdiction des jeux d'argent (CSI L320-1, dérogations L320-6 [R]).
- Le site écrit lui-même que « 5 % du prix de chaque pack vendu alimente la cagnotte » (`giveaway.js` l. 71, `transparency.js` l. 68) et « 1 pack = 1 ticket » (`pack.js` l. 47), sans voie gratuite. Une part identifiée du prix paie donc la participation : c'est la présentation la plus risquée possible. Le Pack Brasier a d'ailleurs le retour le plus bas du site (86 %, `js/data/packs.js` l. 94), et `docs/GERANT.md` l. 143 l'explique par ces 5 % : l'acheteur paie bien son ticket par un pack qui rend moins. L'achat ne se fait donc pas « aux conditions normales du produit ».
- « Douze cartes à gagner, douze gagnants » (`data/giveaways.js` l. 53) alors que seuls les lots « débloqués » par les ventes sont tirés : annoncer un prix sans l'attribuer est une pratique réputée trompeuse (directive 2005/29/CE, annexe I, point 19, transposé à L121-4 [C, alinéa à vérifier] <https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563107>).
- Règlement : le dépôt chez un officier ministériel n'est plus exigé depuis 2014 [R] <https://donneespersonnelles.fr/jeu-concours-rgpd>, mais un règlement accessible reste nécessaire pour l'information et la preuve. Il n'y en a pas.
- Classement doté (`leaderboard.js` l. 77-109) : pas de hasard, donc pas une loterie ; c'est une prime au plus gros acheteur. Dotation « estimée », joueurs simulés, versement « en crédits » sans dire s'ils sont retirables : à régler par un règlement. Prime licite si elle n'est pas déloyale (L121-19 [C]).

### C5 — « Retour 86 à 92 % » et cotes : chiffres exacts mais présentation de nature à tromper. **Élevé**

Chiffres calculés avec le code du site, sur le stock de démonstration par défaut (script de mesure en lecture seule, non versé au dépôt) :

| Pack | Prix | Cote moyenne | Retour | Carte sous le prix | Cote médiane | Rachat 90 % ≥ prix |
|---|---|---|---|---|---|---|
| Starter | 9,95 € | 9,73 € | 88 % | 77,9 % | 6,72 € | 18,6 % |
| Évoli | 19,90 € | 19,68 € | 89 % | 79,3 % | 8,72 € | 14,3 % |
| Pro | 24,95 € | 24,95 € | 90 % | 79,6 % | 14,27 € | 17,7 % |
| Rétro | 29,90 € | 29,57 € | 89 % | 79,5 % | 15,68 € | 18,2 % |
| Brasier | 39,90 € | 38,13 € | 86 % | 78,0 % | 24,24 € | 14,7 % |
| Master | 49,95 € | 49,95 € | 90 % | 76,1 % | 29,42 € | 18,7 % |
| Expert | 99,95 € | 101,06 € | 91 % | 70,9 % | 64,72 € | 23,9 % |
| Légende | 249,00 € | 254,53 € | 92 % | 70,1 % | 170,85 € | 25,3 % |

- La moyenne est tirée par de rares gros lots. Le tirage typique d'un pack à 19,90 € est une carte cotée 8,72 € (rachat : 7,85 €, soit 39 % du prix). L'accueil n'affiche que « 86 % – 92 % retour affiché » et « 90 % rachat immédiat » (`home.js` l. 160-162). La FAQ titre « Combien rapporte un pack en moyenne ? » (`faq.js` l. 26). Le site publie bien « Carte ≥ prix » sur la page du pack et en Transparence : c'est un vrai point fort, mais l'information décisive manque là où le chiffre flatteur est mis en avant. Fondement : pratique trompeuse par présentation ou par omission d'une information substantielle (L121-2, L121-3 [C]).
- Cotes : source tierce (Cardmarket, moyenne 30 jours, via pokemontcg.io), datée (`transparency.js` l. 58). Il manque : l'état, la langue et la version auxquels la cote correspond, et le fait que la carte réelle peut différer. Une cote d'une autre version que la carte en stock fausse « cote », « retour » et « Carte ≥ prix ». Même fondement.
- « Cote moyenne » proche de 100 % du prix : exact, mais c'est un prix moyen observé entre tiers, pas un prix que le client obtiendra. À dire.
- « Combien rapporte », « Puis-je perdre de la valeur ? » (`faq.js` l. 74) : vocabulaire de placement. La réponse honnête est « oui, le plus souvent ».

### C6 — Flux « En direct », classement, participants et ventes simulés. **Élevé en production, faible en démonstration**

En démonstration, tout est étiqueté (« Simulé », « Flux simulé », « Ventes simulées ») et rien n'est vendu : correct. En production, une preuve sociale fabriquée reste trompeuse même avec une étiquette discrète (L121-2 [C] ; directive 2005/29, annexe I, point 23 quater sur les fausses recommandations sociales [C]). La proposition de règlement « Digital Fairness Act » du 11 novembre 2026 (COM(2026) 1100) viserait expressément les fausses notifications [R] <https://commission.europa.eu/law/law-topic/consumer-protection-law/digital-fairness-act_en>, <https://www.freshfields.com/en/our-thinking/briefings/2026/11/digital-fairness-act-the-eus-new-consumer-protection-rulebook-takes-shape>. Fichiers : `js/data/community.js`, `home.js` l. 116-117, `pack.js` l. 149, `giveaway.js` l. 68, 108, 117.

### C7 — Conformité du bien : image générique, langue, état, authenticité. **Moyen à élevé**

- Garantie légale de conformité : le vendeur répond des défauts existant à la délivrance pendant 2 ans ; le bien doit correspondre à la description et au modèle présentés (L217-3 à L217-5 [C]). Présomption d'antériorité de 24 mois, 12 mois pour un bien d'occasion (L217-7 [R] <https://inc-conso.fr/sites/default/files/pdf/tableau-economie-circulaire-12-2024.pdf>). Fiche DGCCRF [R-off] <https://www.economie.gouv.fr/dgccrf/Publications/Vie-pratique/Fiches-pratiques/les-garanties-legales>.
- Le site montre un scan générique (pokemontcg.io), pas la carte réelle. Il affiche un nom français, alors que la fiche indique « Nom imprimé » en anglais (`collection.js` l. 90) : le client peut croire recevoir une carte française. L'état n'apparaît que sous la grille des packs (`packs.js` l. 14 : « Near Mint minimum pour les séries récentes, Excellent pour les anciennes »), pas sur la fiche ni dans la table de tirage. Rien sur l'authenticité.
- Carte unique : remplacement souvent impossible, donc remboursement. À écrire.
- L'encadré obligatoire sur les garanties légales dans les CGV (décret n° 2022-946 du 29 juin 2022 [C]) est absent de la trame.
- Depuis le 27 septembre 2026, notice européenne harmonisée sur la garantie légale (règlement d'exécution (UE) 2025/1960 [R] <https://www.acd.fr/garantie-legale-de-conformite-laffiche-europeenne-que-vos-clients-doivent-voir-en-magasin-comme-en-ligne/>). La transposition française de la directive 2024/825 n'était pas achevée (projet de loi DDADUE en cours, mise en demeure de la Commission du 28 mai 2026) [R] <https://www.ecologie.gouv.fr/politiques-publiques/renforcement-lencadrement-allegations-environnementales-effets-directive>. Portée exacte en France : à confirmer.

### C8 — Livraison : « assurance 1 % », transfert des risques, cartes « bonus » non expédiables. **Moyen**

- Le risque de perte ou de casse ne passe au client que lorsqu'il prend physiquement possession du bien (L216-2 [C] ; INC [R] <https://www.inc-conso.fr/sites/default/files/pdf/vi-delivrance-fourniture-transfert-risque.pdf>) ; le vendeur à distance répond de plein droit de la bonne exécution, transporteur compris (L221-15 [C]). Facturer une « assurance » (`collection.js` l. 173, `transparency.js` l. 70) laisse croire que, sans elle, le risque serait pour le client : présenter un droit légal comme un avantage propre à l'offre est réputé trompeur (directive 2005/29, annexe I, point 10 [C]). Le supplément peut exister comme frais d'envoi en valeur déclarée ; c'est le mot et le message qui posent problème.
- Délai annoncé (10 à 12 jours ouvrés) : conforme à l'obligation d'indiquer un délai ; à défaut 30 jours ; résolution et remboursement sous 14 jours en cas de retard (L216-1, L216-6, L216-7 [C]).
- « Une carte payée avec un bonus ne s'expédie qu'une fois le bonus joué » (`collection.js` l. 147) : le client est propriétaire d'un bien qu'on refuse de lui livrer. Clause à risque (clauses abusives, L212-1, R212-1 et R212-2 [C]) et, au minimum, à annoncer avant l'achat.

### C9 — Bonus, rachat, retrait, coffre : conditions à écrire, clauses à risque. **Moyen**

- Bonus (`topup.js` l. 36, `faq.js` l. 46-50) : la condition « à jouer 10 fois » est annoncée au bon endroit. Manquent au même endroit : la non-expédition, la reprise du reliquat, et un vrai choix (bonus refusable).
- Rachat : « prix garanti » (`faq.js` l. 32). À définir dans les CGV : cote retenue = celle affichée au tirage (c'est ce que fait le code, `store.js` l. 418) ; le taux de 85 % « ensuite » peut-il changer ? Une modification unilatérale du prix est une clause noire (R212-1 [C]).
- Retrait : minimum 20 €, 7 à 14 jours ouvrés (`wallet.js` l. 27-31). Un solde résiduel inférieur à 20 € ne doit pas être perdu à la clôture du compte. Régime du solde lui-même : voir l'agent Paiements.
- « Garder ta carte au coffre sans limite de durée » (`faq.js` l. 33), « coffre sécurisé et assuré » (`faq.js` l. 71) : ce sont des engagements. Faux au lancement, ils deviennent des allégations trompeuses (L121-2 [C]).
- Compte : « suspension et clôture » (`legal.js` l. 32) ne peut pas emporter confiscation du solde déposé ni des cartes.

### C10 — Mentions légales, CGV, médiation, allégations d'agrément. **Moyen** (normal en démonstration, bloquant le jour de l'ouverture)

- Mentions légales : base désormais à l'article 1-1 de la LCEN (loi n° 2004-575, renumérotée par la loi SREN du 21 mai 2024) [R] <https://entreprendre.service-public.gouv.fr/vosdroits/F37351>, <https://donneespersonnelles.fr/mentions-legales-site-internet> ; s'y ajoute l'article 19 pour les vendeurs en ligne [C]. La trame (`legal.js` l. 54-63) oublie le téléphone, le RCS et sa ville, le téléphone de l'hébergeur et le médiateur.
- Médiation : tout professionnel doit offrir un médiateur de la consommation et en donner les coordonnées sur son site et dans ses CGV (L612-1, L616-1, R616-1 ; amende L641-1 [C]). La trame le cite en un mot, sans nom.
- Plateforme européenne de règlement en ligne des litiges : **supprimée**. Le règlement (UE) n° 524/2013 est abrogé au 20 juillet 2025 par le règlement (UE) 2024/3228 [R-off] <https://eur-lex.europa.eu/eli/reg/2024/3228/oj/fra>. Ne pas mettre le lien « ec.europa.eu/consumers/odr » que proposent encore beaucoup de modèles de CGV.
- « Les agréments nécessaires » (`faq.js` l. 86), « tirage certifié », « laboratoire agréé » (`transparency.js` l. 33) et l'idée d'obtenir « des certifications » : se dire agréé, autorisé ou certifié sans l'être est réputé trompeur en toutes circonstances (directive 2005/29, annexe I, points 2 et 4 [C]). Aujourd'hui ces mentions figurent dans une liste « à faire », ce qui est correct. Aucun logo ni mot « certifié » sans certificat réel.

### C11 — Mineurs. **Moyen** (élevé si le produit est qualifié de jeu)

Une case « Je certifie avoir 18 ans » (`auth.js` l. 40) ne protège pas le vendeur : le mineur est incapable de contracter hors actes courants (C. civ. 1146, 1148), le contrat est annulable, et une simple déclaration de majorité n'y fait pas obstacle (C. civ. 1149) [R] <https://www.donneespersonnelles.fr/client-mineur-commande>, <https://www.inc-conso.fr/node/8177>. L'univers Pokémon, le tutoiement, l'XP et les badges parlent à des mineurs ; inciter directement des enfants à acheter est une pratique agressive réputée déloyale (directive 2005/29, annexe I, point 28 [C]). Une vérification d'âge réelle s'impose avant tout paiement.

### C12 — Comptes à rebours, « dernier », garantie de 10 minutes. **Faible à moyen**

- Compte à rebours des giveaways : en démonstration, les dates glissent pour qu'il y ait toujours un giveaway actif (`data/giveaways.js` l. 2-3). En production, une échéance fausse ou reconduite est réputée trompeuse (directive 2005/29, annexe I, point 7 [C]). Dates fixes, écrites au règlement.
- Badge « dernier » (`pack.js` l. 27) : licite s'il reflète le stock réel, tenu côté serveur.
- Rachat à 90 % « garanti encore 09:59 » puis 85 % (`collection.js` l. 94, `opening.js` l. 140 et 218) : la contrainte est vraie, mais elle pousse à décider vite. C'est le type d'interface que vise la proposition de règlement du 11 novembre 2026. À surveiller.

### C13 — Omnibus, DSA, accessibilité : peu d'enjeu aujourd'hui. **Faible**

- Avis en ligne : aucun sur le site. S'il en vient : dire s'ils sont vérifiés et comment (L111-7-2 [C]) ; faux avis réputés trompeurs.
- Réductions de prix : aucune. S'il en vient : prix de référence = prix le plus bas des 30 derniers jours (L112-1-1, en vigueur depuis le 28 mai 2022 ; fiche DGCCRF du 25 août 2026) [R-off] <https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/annonces-de-reduction-de-prix-ce-que-vous-devez-savoir>.
- DSA (règlement (UE) 2022/2065) : une boutique qui ne vend que ses propres produits n'est ni une place de marché ni, pour cette activité, une plateforme en ligne [R] <https://www.pinsentmasons.com/out-law/news/eu-retailers-online-platforms-regulation-clarification>. Il ne s'appliquerait qu'à la marge, si le site stocke et diffuse des contenus d'utilisateurs (pseudos publics, avatars, commentaires) ; les micro et petites entreprises sont dispensées des obligations propres aux plateformes, interfaces trompeuses comprises. Les interfaces trompeuses restent saisies par L121-1 et suivants.
- Accessibilité (directive (UE) 2019/882 ; loi n° 2023-171 du 9 mars 2023 ; décret n° 2023-931 du 9 octobre 2023 ; C. conso L412-13) : applicable aux services de commerce électronique depuis le 28 juin 2025 ; les microentreprises de services en sont dispensées (moins de 10 personnes et chiffre d'affaires ou total de bilan ne dépassant pas 2 M€) [R-off] <https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/professionnels-vos-produits-et-services-doivent-etre-conformes-la-directive-accessibilite>, [R] <https://cm.twobirds.com/en/insights/2026/france/accessibilit-numrique--ce-qui-change-pour-les-sites-e-commerce-depuis-juin-2025>. Le projet serait dispensé au lancement. Attention : le chiffre d'affaires est le montant des ventes, pas la marge ; le seuil peut être franchi vite. Le site a déjà de bonnes bases (rôles ARIA, libellés).

## 3. Actions recommandées

### (a) Dans le site et le code

1. `pack.js` l. 188-193 : supprimer « sans droit de rétractation » et « Cet accord vaut pour tes prochains achats ». Texte T1.
2. `pack.js` l. 166 : bouton « Acheter et ouvrir · 9,95 € » ; ligne sous le bouton T2.
3. `pack.js` l. 186-197 : récapitulatif à chaque achat (supprimer `settings.instant`), avec case d'acceptation des CGV.
4. `legal.js` l. 24 : article « Droit de rétractation » T3. Ajouter les articles manquants T9.
5. `shell.js` l. 115-119 : lien « Me rétracter d'un achat » dans la colonne Légal ; page « Mes commandes » avec bouton par commande (libellés T4).
6. `home.js` l. 160-162 : puces T5. `faq.js` : questions T6.
7. `transparency.js` l. 53-58 : ajouter la part des tirages sous le prix et la définition de la cote T7.
8. `data/giveaways.js` l. 53, `giveaway.js` l. 44-71 : textes T8 ; page de règlement.
9. `collection.js` l. 172-177 : textes T10. Afficher le barème de livraison sur la page du pack.
10. `topup.js` l. 36-39 : texte T11, bonus à cocher, bouton « Payer 50 € » en production.
11. `legal.js` l. 54-63 et `contact.js` l. 28-33 : mentions T12.
12. Fiche carte et table de tirage : afficher langue, version et état de l'exemplaire ; mention « Visuel de référence : ce n'est pas la photo de ton exemplaire ».
13. Prix : « TTC » partout où un prix est une offre.
14. Production : couper `js/data/community.js` (flux, classement, participants, ventes simulés) derrière `DEMO` ; aucune donnée fabriquée en réel.

### (b) Structure juridique, entreprise, professionnel

1. Faire trancher par un avocat le couple « vente avec rétractation » ou « jeu d'argent » avant toute autre dépense. Lui poser aussi le sort de la rétractation quand la carte a été revendue au site ou misée en Évolution.
   Question annexe à lui poser : si le coffre était tenu par un tiers gardien que le client désigne, la mise au coffre vaudrait-elle « réception » ? Cela ferait courir les 14 jours et passer les risques, sans supprimer le droit.
2. Désigner un médiateur de la consommation (convention avant l'ouverture).
3. Faire rédiger CGV, CGU, règlements des giveaways et du classement ; faire relire les clauses bonus, clôture de compte, retrait et modification des taux au regard des clauses abusives.
4. Garantie de conformité : procédure écrite (authenticité, état, remplacement ou remboursement), encadré légal et notice européenne.
5. Vérification d'âge réelle avant le premier paiement.
6. Assurance transport et contrat de garde du coffre réels avant d'écrire « assuré ».
7. Suivre : loi DDADUE (directive 2024/825), proposition « Digital Fairness Act » du 11 novembre 2026, seuils d'accessibilité.

## 4. Non vérifié / à confirmer

- Texte intégral et numérotation exacte de L221-28, L221-18, L221-2, L221-29, L221-6, L221-13, L221-20, L221-23 à L221-25 : non lus à la source.
- Article exact de la nullité attachée à L221-14 ; montants et articles des amendes administratives (15 000 € / 75 000 € vus en source secondaire seulement).
- Décret n° 2026-3 : libellés exacts du bouton, contenu de l'accusé de réception, emplacement imposé.
- Numérotation des alinéas de L121-4 et L121-7 (la liste française ne suit pas exactement l'annexe I de la directive) ; état exact de la transposition de la directive 2024/825 au 27 novembre 2026.
- L616-1, R616-1, L641-1 ; sort de L616-2 après la fermeture de la plateforme européenne.
- LCEN art. 19 (téléphone) ; décret n° 2022-946 (texte de l'encadré) ; L213-1 (archivage).
- Portée en France de la notice harmonisée (règlement d'exécution (UE) 2025/1960).
- Arrêt CA Paris du 14 février 2020 : non lu ; connu par l'extrait de la fiche DGCCRF.
- État, langue et version auxquels correspondent les prix Cardmarket fournis par pokemontcg.io : à vérifier dans la documentation de l'API (voir l'agent Catalogue).
- Recherches non faites faute de quota : L221-2 et L221-29 ; L221-14 et L221-6 ; décret n° 2026-3 ; L616-1 et suivants ; notice harmonisée.

---

## Annexe — Textes corrigés prêts à coller

Les textes T1 à T4 supposent que l'avocat retient la qualification de vente. Dans le cas contraire, ils sont sans objet.

### T1 — Dialogue d'achat (`js/views/pack.js`)

Démonstration (à poser tout de suite) :

- Titre : `Confirmer l'ouverture`
- Texte : `Démonstration : rien n'est vendu. La carte est tirée dès que tu confirmes.`
- Bouton : `Ouvrir`

Production, à chaque achat :

- Titre : `Ta commande`
- Texte :
  - `1 pack Brasier : 39,90 € TTC, payés avec ton solde.`
  - `Ta carte est tirée au sort dès que tu valides, parmi les cartes du coffre. La table de tirage est sur cette page.`
  - `Livraison sur demande, en plus : 4,90 € en France, 9,90 € en Europe, sous 10 à 12 jours ouvrés. Tu peux aussi garder ta carte au coffre ou nous la revendre.`
  - `Tu peux te rétracter jusqu'à 14 jours après avoir reçu ta carte. Tant qu'elle est au coffre, tu peux le faire à tout moment, depuis Mes commandes.`
- Case (non cochée) : `J'ai lu les conditions générales de vente et je les accepte.`
- Bouton : `Acheter et ouvrir · 39,90 €`

### T2 — Sous le bouton d'achat

`Prix TTC. Livraison sur demande : dès 4,90 €. Rachat à 90 % de la cote pendant 10 min, 85 % ensuite. Dans 78 % des tirages, la carte vaut moins que le prix du pack.` (chiffre = 1 − `profitChance(pack)`)

### T3 — CGV, article « Droit de rétractation » (`js/views/legal.js`)

Trame (démonstration) :

`Droit de rétractation de 14 jours à compter de la réception de la carte. Aucune exception légale ne vise un bien tiré au sort : la renonciation n'est pas possible. Bouton de rétractation en ligne, formulaire type, remboursement. Compatibilité du modèle avec ce droit : à faire trancher par un avocat.`

Texte définitif :

`Tu as 14 jours pour changer d'avis, sans donner de raison. Le délai part du jour où tu reçois ta carte. Tant que ta carte est au coffre, tu peux te rétracter à tout moment.`
`Pour te rétracter : bouton « Me rétracter » dans Mes commandes, formulaire ci-dessous, ou un message clair à [e-mail]. Nous t'envoyons un accusé de réception par e-mail.`
`Nous te remboursons le prix du pack, et la livraison standard si tu l'as payée, sous 14 jours, par le moyen de paiement utilisé.`
`Si ta carte t'a été livrée, renvoie-la sous 14 jours à [adresse]. Les frais de retour sont à ta charge. Une carte abîmée par une manipulation inutile peut réduire le remboursement.`
`[À trancher par l'avocat : carte déjà revendue au site ou misée en Évolution.]`

### T4 — Bouton de rétractation (page Mes commandes, lien en pied de page)

- Lien de pied de page : `Me rétracter d'un achat`
- Bouton par commande : `Renoncer au contrat ici`
- Écran de confirmation : `Tu renonces à l'achat du pack Brasier du 12 mars (39,90 €).` Bouton : `Confirmer la rétractation`
- Message final : `C'est noté. Nous t'envoyons un accusé de réception par e-mail. Remboursement sous 14 jours.`

### T5 — Puces de l'accueil (`js/views/home.js`)

- `86 à 92 % · retour moyen en revente immédiate`
- `3 tirages sur 4 · carte sous le prix du pack`
- `90 % de la cote · rachat pendant 10 min`

### T6 — FAQ (`js/data/faq.js`)

**Que vaut un pack en moyenne ?** (remplace « Combien rapporte un pack en moyenne ? »)
`Chaque pack affiche son retour moyen : ce qu'on récupère en moyenne en revendant la carte tout de suite, à 90 % de sa cote. Il va de 86 à 92 % du prix selon le pack.`
`C'est une moyenne, tirée vers le haut par quelques cartes rares. Le plus souvent, ta carte vaut moins que le prix du pack : c'est le cas de 70 à 80 % des tirages. La page de chaque pack donne le chiffre exact.`
`Sur la durée, tu dépenses plus que tu ne récupères.`

**Puis-je perdre de l'argent ?** (remplace « Puis-je perdre de la valeur ? »)
`Oui, et c'est le cas le plus fréquent. Environ trois fois sur quatre, la carte tirée est cotée moins que le prix du pack. N'achète que ce que tu peux te permettre de dépenser, et fixe-toi une limite.`

**D'où viennent les cotes ?** (nouvelle)
`La cote est le prix de vente moyen sur 30 jours relevé sur Cardmarket, fourni par pokemontcg.io. La date du relevé est sur la page Transparence.`
`C'est un prix observé entre vendeurs tiers, pour une carte [état], version [langue]. Ce n'est pas un prix que nous garantissons.`
`Seul le rachat est garanti : 90 % de la cote affichée au moment du tirage pendant 10 minutes, 85 % ensuite.`

**Puis-je me rétracter ?** (nouvelle) : reprendre T3 en trois phrases.

**Ma carte n'est pas conforme, que faire ?** (nouvelle)
`Ta carte doit correspondre à sa fiche : même carte, même version, même langue, état annoncé, authentique. Si ce n'est pas le cas, écris-nous dans les deux ans. Nous la remplaçons si nous avons la même au coffre. Sinon, nous te remboursons. C'est la garantie légale de conformité : elle est gratuite.`

**Le site est-il autorisé ?**
`[Nom] est aujourd'hui une maquette : rien n'y est vendu. Aucune autorité ne l'a autorisé, agréé ni certifié. L'ouverture au public dépend d'une validation juridique qui n'est pas acquise.`

**Où sont stockées mes cartes ?** (démonstration)
`En démonstration, le coffre est un inventaire d'exemple : aucune carte n'existe. Au lancement, cette page dira où les cartes sont gardées, par qui elles sont assurées, et que tu en restes propriétaire.`

### T7 — Transparence (`js/views/transparency.js`), sous le tableau

`La moyenne cache l'essentiel : dans 70 à 80 % des tirages, la carte vaut moins que le prix du pack. La colonne « Carte ≥ prix » donne le chiffre pour chaque pack.`
`Cote : prix de vente moyen sur 30 jours relevé sur Cardmarket le [date], fourni par pokemontcg.io, pour une carte [état], version [langue]. C'est un prix observé entre tiers, pas un prix garanti.`

### T8 — Giveaways (`js/data/giveaways.js`, `js/views/giveaway.js`)

Si les lots restent liés aux ventes :
`Jusqu'à douze cartes de type Feu à gagner. Un lot n'est tiré au sort que s'il est débloqué à la clôture. À ce jour : 4 sur 12.`

Version recommandée (lots garantis, voie gratuite, plus de part du prix affectée) :
`Douze cartes de type Feu à gagner, douze gagnants. Les douze lots sont tirés au sort quel que soit le nombre de participants.`
`1 Pack Brasier acheté = 1 ticket. Tu peux aussi participer sans acheter : 1 ticket par personne, avec le formulaire du règlement.`
`Clôture le [date] à [heure]. Tirage le [date]. Lots livrés gratuitement. Règlement complet.`

Règlement, dix rubriques : organisateur ; dates et heures ; qui peut participer (majeurs, un compte) ; comment participer, voie gratuite comprise ; nombre de tickets ; lots et valeur ; méthode et date du tirage ; annonce des gagnants et délai de réclamation du lot ; livraison gratuite du lot ; données personnelles et réclamations.

Classement : `Dotation du mois : [montant minimum garanti] €, versés en solde retirable. Règlement complet.`

### T9 — CGV : articles à ajouter à la trame (`js/views/legal.js`)

- `Prix : TTC, en euros. Frais de livraison indiqués avant chaque achat.`
- `Commande : récapitulatif, validation, e-mail de confirmation avec les présentes conditions.`
- `Description des cartes : langue, version, état de l'exemplaire, authenticité. Le visuel est une image de référence.`
- `Garantie légale de conformité (deux ans) et garantie des vices cachés : encadré légal reproduit tel quel ; notice européenne.`
- `Livraison : délai, suivi. La perte et la casse sont à notre charge jusqu'à la remise du colis.`
- `Médiation : [nom du médiateur], [adresse], [site]. Gratuit pour toi, après une réclamation écrite restée sans solution.`
- `Clôture du compte : ton solde déposé t'est reversé et tes cartes te sont livrées.`
- Ne pas ajouter de lien vers la plateforme européenne de règlement en ligne des litiges : elle est fermée depuis le 20 juillet 2025.

### T10 — Demande de livraison (`js/views/collection.js`)

- Ligne de frais : `Livraison suivie : 4,90 € · 10 à 12 jours ouvrés`
- Remplace la ligne « assurance » : `Dont [montant] d'envoi en valeur déclarée : 1 % de la cote au-delà de 50 €. Dans tous les cas, la perte et la casse sont à notre charge jusqu'à ce que tu aies ta carte en main.`
- Bouton : `Payer [total] et faire livrer`
- Message : `Demande enregistrée. Tu reçois une confirmation par e-mail.`
- Carte payée avec un bonus : annoncer la règle dans T11, avant le dépôt, pas au moment d'expédier.

### T11 — Recharge (`js/ui/topup.js`)

- Case (non cochée) : `Je veux le bonus de premier dépôt`
- Texte : `+10 % de bonus, jusqu'à 50 €. Le bonus et ce qu'il rapporte ne sont retirables qu'après 10 fois son montant dépensé en packs. Une carte payée avec le bonus ne s'expédie pas avant. Le bonus restant est repris s'il n'y a plus rien à jouer. Ton dépôt, lui, reste retirable à tout moment.`
- Bouton en production : `Payer 50 €`

### T12 — Mentions légales et contact (`js/views/legal.js`, `js/views/contact.js`)

- `Éditeur : [dénomination], [forme sociale] au capital de [montant] €. Siège : [adresse]. RCS [ville] [numéro]. TVA : [numéro].`
- `Téléphone : [numéro]. E-mail : [adresse].`
- `Directeur de la publication : [prénom, nom].`
- `Hébergeur : [nom], [adresse], [téléphone].`
- `Médiateur de la consommation : [nom], [adresse], [site].`
- Page Contact : ajouter le téléphone et `Réclamation : écris-nous d'abord. Sans solution sous [x] jours, tu peux saisir gratuitement le médiateur : [nom, site].`
