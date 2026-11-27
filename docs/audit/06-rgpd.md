# Rapport 06 — Protection des données (RGPD, loi Informatique et Libertés, traceurs)

27 novembre 2026. Ce n'est pas un avis d'avocat.

**Méthode et limites.** Code lu fichier par fichier. Deux relevés dans un navigateur sans interface, site servi en local, requêtes externes enregistrées puis annulées (`mesure.cjs`, `mesure-catalogue.cjs`, résultats dans `mesure.json` et `mesure-catalogue.json`, même dossier que ce rapport). En-têtes HTTP du serveur d'images lus directement. Côté droit : **aucun texte n'a pu être relu à la source officielle** (cnil.fr et consilium.europa.eu injoignables depuis la session, puis budget de recherche épuisé). Chaque référence porte donc l'un de ces statuts : **[mesuré]** (fait technique constaté par moi), **[recherche]** (vu dans un résultat de recherche), **[non vérifié]** (connaissance générale, à confirmer).

**Dépôt modifié pendant l'audit.** Entre 15:44 et 15:55 UTC, neuf fichiers du dépôt ont été modifiés par un autre acteur (`js/data/faq.js`, `js/data/giveaways.js`, `js/ui/shell.js`, `js/ui/topup.js`, `js/views/collection.js`, `js/views/faq.js`, `js/views/home.js`, `js/views/pack.js`, `js/views/wallet.js`) ; aucun par moi. Mes relevés datent de 15:43-15:44. Les lignes citées ci-dessous ont été revérifiées à 15:56 et restent exactes ; les fichiers en cause dans mes constats (`js/views/legal.js`, `index.html`, `js/store.js`, `js/admin.js`, `js/views/auth.js`, `js/theme.js`) n'ont pas changé.

## 1. Verdict

1. **Site actuel : pas de bandeau de consentement à prévoir.** Aucun cookie, rien d'écrit avant une action du visiteur, stockage strictement fonctionnel [mesuré]. Deux écarts réels, corrigeables en une heure : les images de cartes sont demandées à un tiers dès la première seconde (adresse IP transmise, sortie de l'UE probable) sans que ce soit annoncé, et la politique de confidentialité affirme le contraire de ce que fait le code.
2. **Version réelle : rien de l'architecture actuelle n'est réutilisable pour de vraies données.** Tout l'état vit dans le navigateur et l'espace admin s'ouvre sans mot de passe en deux lignes de console [mesuré]. Analyse d'impact obligatoire, registre, délégué quasi certain, vérification d'identité, classement public à inverser.
3. **Préalable hors de mon périmètre :** si l'activité est un jeu d'argent non autorisé (agent 01), aucun traitement de données n'a de base légale (licéité, art. 5.1.a et 6 du RGPD).

## 2. Faits mesurés sur le site actuel

| Moment | Stockage local | Cookies | Requêtes vers des tiers |
|---|---|---|---|
| Première visite, aucune action | vide | aucun | **20 images demandées à `images.pokemontcg.io`** (écran de choix du thème + accueil) |
| Après « Entrer avec le thème » | `pokiiiii.theme.v1` = `{id, at}` | aucun | 16 images |
| Après inscription | + `pokiiiii.demo.v1` : `user {pseudo, since}`, session, solde, cartes, mouvements, limites, graine « serveur » en clair | aucun | 8 images |
| Après dépôt fictif, achat, livraison, limite, pause | + **nom et adresse postale en clair**, limite quotidienne, pause ; + `pokiiiii.stock.v1` (inventaire, aucune donnée personnelle) | aucun | — |
| Catalogue complet, extension récente | — | — | 60 balises vers `images.scrydex.com`, **0 requête émise** : bloquées par la CSP (120 violations) |
| `#/admin`, visiteur neuf | formulaire de connexion affiché, puis après deux écritures manuelles (`pokiiiii.admin.v1` quelconque + `sessionStorage['pokiiiii.admin.v1.session']='1'`) : **les 6 onglets admin, sans mot de passe** | — | — |

Réponses aux questions posées :

- **Pseudo** : oui, en clair (`js/store.js` l. 341). **E-mail** : non (le formulaire de contact n'envoie ni ne garde rien, `js/views/contact.js` l. 49). **Mot de passe** : aucun pour le joueur ; pour l'admin, identifiant en clair + SHA-256 salé en une seule passe (`js/admin.js` l. 24 et 58), pas une fonction lente.
- `js/theme-init.js` ne fait que lire. `js/theme.js` écrit au choix du thème (Échap à la première visite vaut validation, l. 204). `js/stock.js` n'écrit qu'un inventaire.
- **Ce que reçoit le tiers d'images** : adresse IP, `user-agent`, `accept-language`, `sec-ch-ua*`, nom de l'image, et `referer` réduit à l'origine du site ; aucun cookie envoyé.
- **Hébergement du tiers** : `server: cloudflare`, origine Amazon S3 (`x-amz-request-id`), **aucun `set-cookie`**, en-tête `nel` vers `a.nel.cloudflare.com` [mesuré]. L'exploitant est le projet « Pokémon TCG API », dont Scrydex se présente comme la suite (https://scrydex.com/docs) [recherche] ; sa société, son pays et son adhésion au cadre UE–États-Unis sont [non vérifié].
- **Polices** : auto-hébergées (`assets/fonts`, `css/app.css` l. 9-23). CSP : `script-src 'self'`, `connect-src 'self'`, `font-src 'self'`. Seul `fetch` : `assets/data/catalogue.json`. Aucune mesure d'audience, liens sociaux vides (`#`).

## 3. Constats sur le site actuel

**A1 — Images chargées chez un tiers, non annoncé. Risque moyen (faible si la démo reste confidentielle).**
Même problème de principe que les polices Google : l'éditeur fait transmettre l'adresse IP du visiteur à un tiers alors qu'il pourrait héberger lui-même. LG München I, 20 janvier 2022, 3 O 17493/20 : intérêt légitime refusé pour ce motif, 100 € de dommages (https://www.gesetze-bayern.de/Content/Document/Y-300-Z-GRURRS-B-2022-N-612) [recherche]. Aucune position de la CNIL trouvée [recherche]. L'éditeur est responsable de la collecte et de la transmission : CJUE, 29 juillet 2019, C-40/17, Fashion ID ; l'adresse IP est une donnée personnelle : CJUE, 19 octobre 2016, C-582/14, Breyer [non vérifié]. Intensité moindre ici : pas de cookie, pas de régie publicitaire. À mon analyse, l'article 82 n'est pas en jeu (rien n'est lu ni écrit sur l'appareil par ces images) [non vérifié : lignes directrices 2/2023 du CEPD, version 2 du 7 octobre 2024, non relues, https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf]. Restent dus : l'information sur le destinataire et le transfert (art. 13.1.e et f), et une base légale fragile. Élément : `js/catalog.js` l. 18, `js/catalogue.js` l. 6, `index.html` l. 6, 7 et 16.

**A2 — Politique de confidentialité inexacte et incomplète. Risque moyen.** `js/views/legal.js` l. 41-53.
- Inexact : « ne collecte aucune donnée » (IP transmise au tiers d'images et à l'hébergeur) ; « aucun traceur n'est déposé » (quatre clés de stockage local, qui sont des traceurs au sens de l'article 82, simplement exemptés).
- Exact : « tes adresses restent dans le stockage local » [mesuré].
- Manque au regard de l'article 13 du RGPD (https://eur-lex.europa.eu/eli/reg/2016/679/oj) : intérêts légitimes poursuivis (13.1.d), transferts hors UE (13.1.f), droit à la limitation, retrait du consentement (13.2.c), caractère obligatoire ou non des données (13.2.e), décision automatisée et profilage (13.2.f), modalités d'exercice des droits ; en droit français, directives après décès (art. 85 de la loi du 6 janvier 1978) [non vérifié].

**A3 — Adresse postale réelle gardée en clair, sans avertissement. Risque faible.** `js/store.js` l. 503-511, formulaire `js/views/collection.js` l. 155-177. Sans durée limite ; lisible sur un appareil partagé.

**A4 — « J'accepte […] la politique de confidentialité ». Risque faible.** `js/views/auth.js` l. 41. Une information ne s'accepte pas ; mêler les deux brouille le consentement.

**A5 — Espace admin. Risque faible en démo, bloquant en production.** Contournement mesuré ; en démo l'admin ne voit que les données du même navigateur. Lien public dans le pied de page (`js/ui/shell.js` l. 112).

**A6 — 993 cartes sans image, et un piège. Risque faible.** Extensions `me2pt5`, `me3`, `me4`, `me5`, `me55`, `me55c`, `me6` : URL sur `images.scrydex.com`, bloquées par la CSP. « Réparer » en ajoutant ce domaine ouvrirait un second flux vers un tiers.

**A7 — Bandeau : non requis (constat positif).** Art. 82 de la loi n° 78-17 (https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000886460) : exemption des opérations strictement nécessaires au service demandé. Lignes directrices de la CNIL, délibération n° 2020-091 du 17 septembre 2020, et recommandation n° 2020-092, modifiée par la délibération n° 2025-131 du 18 décembre 2025 (https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/lignes-directrices-modificatives-et-recommandation ; version consolidée : https://cnil.fr/sites/default/files/2026-01/recommandation_cookies_consolidee.pdf) [recherche : existence et dates ; liste des exemptions (authentification, panier, personnalisation de l'interface) et devoir d'informer sur les traceurs exemptés : non relus].

**A8 — Réinitialisation partielle. Risque faible.** `resetDemo()` (`js/store.js` l. 363) efface compte et adresses, mais laisse thème, stock et accès admin.

## 4. Constats sur la version réelle

| # | Chantier | Risque | Fondement et statut |
|---|---|---|---|
| B1 | **Architecture et sécurité** : état côté serveur, authentification serveur, admin séparé avec double facteur, rôles, journal des accès aux dossiers, pièces d'identité chiffrées | bloquant | Art. 32 RGPD. Recommandation CNIL sur l'authentification multifacteur, 20 mars 2025 (https://www.cnil.fr/fr/recommandation-mfa) ; mots de passe, délibération n° 2022-100 du 21 juillet 2022 ; sanction de 5 M€ rendue publique le 18 novembre 2026 pour mots de passe en clair et comptes d'administration partagés (https://cnil.fr/fr/conservation-des-mots-de-passe-sanction-5-millions-deuros) [recherche] |
| B2 | **Analyse d'impact** avant tout lancement | bloquant | Art. 35 RGPD. Liste CNIL, délibération n° 2018-327 du 11 octobre 2018, 14 types (https://www.cnil.fr/fr/liste-traitements-aipd-requise) [recherche : existence]. Rubriques « profilage pouvant conduire à l'exclusion d'un contrat » et « profilage avec sources externes » : [non vérifié]. Critères du CEPD réunis : notation, surveillance systématique, données financières, personnes vulnérables |
| B3 | **Vérification d'identité** : pièce, justificatif, éventuelle comparaison faciale (biométrie, art. 9 : consentement exprès et solution de rechange) | élevé | Art. 5.1.c, 9, 13.2.e RGPD [non vérifié pour la doctrine CNIL] |
| B4 | **Classement public et flux des gains** : le classement publie la dépense de chacun (1 € = 1 point, `js/config.js` l. 72). Affichage public à activer par le joueur, pseudonyme masqué par défaut | élevé | Art. 25.2 RGPD : par défaut, pas d'accès par un nombre indéterminé de personnes sans intervention de l'intéressé [non vérifié, cité de mémoire] |
| B5 | **Profilage, relances, décision automatisée** : blocage de compte, refus de retrait, score de fraude | élevé | Art. 22 RGPD. CJUE, 7 décembre 2023, C-634/21, SCHUFA ; 27 février 2025, C-203/22 (droit à l'explication) [recherche]. Prospection : art. L. 34-5 du code des postes et des communications électroniques [non vérifié] |
| B6 | **Données de jeu, limites, auto-exclusion** : hautement personnelles ; un marqueur d'addiction peut être une donnée de santé | élevé | CJUE, 1er août 2022, C-184/20 ; 4 octobre 2024, C-21/23 [non vérifié]. Ne stocker que le fait (montant, dates), jamais le motif ; jamais d'usage commercial |
| B7 | **Mineurs** : la case à cocher ne suffit pas ; vérification réelle avant le premier dépôt. Le seuil de 15 ans (consentement numérique) n'est pas le sujet : le service est interdit aux mineurs | élevé | Art. 8 RGPD, art. 45 de la loi du 6 janvier 1978 [non vérifié]. Loi du 24 août 2026 sur les réseaux sociaux : contenu final incertain [recherche, sources divergentes] |
| B8 | **Durées** : identité et opérations, 5 ans après la fin de la relation ou l'opération, si l'activité est assujettie ; comptabilité 10 ans ; prospects 3 ans | moyen | Art. L. 561-12 du code monétaire et financier [recherche] ; code de commerce, art. L. 123-22 [non vérifié]. La sanction du 18 novembre 2026 vise aussi des données gardées plus de dix ans [recherche] |
| B9 | **Sous-traitants et transferts** : contrats art. 28 ; hébergement dans l'UE de préférence | moyen | Décision d'adéquation UE–États-Unis du 10 juillet 2023 toujours en vigueur ; pourvoi C-703/25 P pendant à la mi-novembre 2026 [recherche] |
| B10 | **Registre** dès le premier jour ; **délégué** : obligatoire dès que le suivi des joueurs est « à grande échelle », à désigner d'emblée | moyen | Art. 30 et 37.1.b RGPD [non vérifié pour les lignes directrices] |
| B11 | **Violations** : notification sous 72 h, registre des incidents | moyen | Art. 33-34 RGPD. « Omnibus numérique » : mandat du Conseil du 21 octobre 2026, position du Parlement attendue, **rien en vigueur** (https://www.consilium.europa.eu/en/press/press-releases/2026/10/21/digital-rulebook-council-agrees-position-to-simplify-data-protection-privacy-and-cyber-reporting-rules/) [recherche] |
| B12 | **Droits** : export du compte et de l'historique, suppression limitée par les obligations légales, réponse sous un mois | moyen | Art. 12 à 21 RGPD |
| B13 | **Traceurs** : bandeau dès la première mesure d'audience non exemptée, pixel publicitaire ou d'affiliation ; pixels dans les e-mails | moyen | Art. 82 ; recommandation CNIL sur les pixels de suivi, 2026 (https://www.cnil.fr/sites/default/files/2026-04/recommandation-pixels_de_suivi.pdf) [recherche : existence seulement] |
| B14 | **« Certifications »** : aucune ne rend licite un traitement ; ISO 27001, PCI DSS (via le prestataire) ou un label de l'article 42 sont des plus, pas des autorisations | information | [non vérifié] |

## 5. Actions recommandées

### a) Dans le site

1. `js/views/legal.js` l. 41-53 : remplacer le bloc `confidentialite` par l'annexe.
2. `index.html` l. 7 : `<meta name="referrer" content="no-referrer">` (le tiers n'apprend plus de quel site vient le visiteur ; puis retirer « et l'adresse de notre site » de la politique). L. 16 : supprimer le `preconnect`.
3. Images : à court terme, garder et informer (points 1 et 2). Solution propre : héberger les images des 798 cartes du fonds (`js/catalog.js` l. 18, `js/catalogue.js` l. 6), puis `img-src 'self' data:` dans la CSP. **À arbitrer avec l'agent 07** : copier les visuels aggrave l'exposition en droit d'auteur. En production : photos maison des cartes réellement en stock.
4. `index.html` l. 6 : ne pas ajouter `images.scrydex.com` ; masquer ou héberger les 993 visuels.
5. `js/views/collection.js` l. 158 : note « Démonstration : n'entre pas ta vraie adresse, elle serait gardée en clair dans ce navigateur ».
6. `js/views/auth.js` l. 41 : « J'accepte les conditions d'utilisation. J'ai lu la politique de confidentialité. »
7. `js/views/settings.js` l. 84-86 et `js/store.js` l. 363 : bouton « Tout effacer de cet appareil » (les quatre clés et la session admin).
8. `js/views/admin.js` l. 55 : écrire que le verrou est local et n'est pas une sécurité. Production : retirer le lien `js/ui/shell.js` l. 112 et sortir l'admin du site public.
9. `js/views/transparency.js` l. 38 : « Analyse d'impact, registre, délégué à la protection des données, politique de confidentialité, consentement aux traceurs ».
10. Hébergement : hébergeur dans l'UE, durée des journaux fixée, CSP servie en en-tête HTTP.

### b) Structure, entreprise, professionnel

1. Trancher la qualification juridique (agent 01) avant toute collecte réelle.
2. Désigner un délégué (externe possible) et faire l'analyse d'impact avec lui avant le premier compte réel.
3. Choisir prestataires de paiement et de vérification d'identité hébergés dans l'UE ; contrats de sous-traitance ; solution de rechange à la biométrie.
4. Écrire le tableau des durées, le registre, la procédure de violation (72 h) et celle des demandes de droits.
5. Faire tester la sécurité par un tiers avant ouverture.
6. Marchés hors UE (Suisse, Québec) : lois propres, à traiter marché par marché.

## 6. Non vérifié / à confirmer

- Tous les textes de la CNIL (formulations exactes des exemptions, information sur les traceurs exemptés, FAQ du 29 avril 2026, rubriques de la liste des analyses d'impact) : à relire sur cnil.fr.
- « Omnibus numérique » : état après la mi-novembre 2026 et détail du mandat (délai de notification, exemptions de consentement).
- Exploitant, pays et garanties du service d'images ; existence d'un contrat avec lui.
- La démo est-elle en ligne, chez quel hébergeur ?
- Assujettissement à la lutte contre le blanchiment (dépend de la qualification) ; règlement (UE) 2024/1624, applicable le 10 juillet 2027.
- Qualification « donnée de santé » des marqueurs d'auto-exclusion.
- Références citées de mémoire : C-40/17, C-582/14, C-184/20, C-21/23, art. 45 et 85 de la loi de 1978, art. L. 34-5 CPCE, art. L. 123-22 du code de commerce.

## Annexe — Politique de confidentialité, prête à coller

À placer dans `js/views/legal.js` à la place du bloc `confidentialite` (l. 41-53). Texte brut, rendu tel quel par la page. Trois éléments entre crochets restent à remplir. La phrase « Nous n'avons pas de contrat avec lui » est à confirmer par le porteur du projet.

```js
  confidentialite: {
    title: 'Politique de confidentialité',
    sections: [
      ['Qui est responsable', `${BRAND.company}, ${BRAND.address}. Pour toute question sur tes données : ${BRAND.email}. Il n'y a pas de délégué à la protection des données à ce stade.`],
      ['Ce que la démo enregistre sur ton appareil', `La démo n'a pas de serveur. Elle écrit dans le stockage local de ton navigateur, et seulement quand tu agis. Ton thème, quand tu le choisis. Ton compte démo, quand tu t'inscris : pseudo, date de création, solde fictif, cartes, mouvements, tirages, réglages, limite de dépenses et pauses. L'adresse postale que tu saisis si tu testes une livraison. Le stock d'exemple, dès ton premier achat. Si tu ouvres l'espace admin : un identifiant et l'empreinte de son mot de passe. Le compte joueur ne demande ni e-mail ni mot de passe. Rien de tout cela ne nous est envoyé : nous n'y avons pas accès.`],
      ['Pourquoi, et sur quelle base', `Ces enregistrements servent à une seule chose : faire fonctionner ce que tu demandes, c'est-à-dire garder ton thème, ton compte et ta collection d'une visite à l'autre (exécution du service, article 6.1.b du RGPD). Ils sont strictement nécessaires au service : la loi ne demande pas ton consentement pour eux (article 82 de la loi Informatique et Libertés). Il n'y a ni cookie, ni mesure d'audience, ni publicité, ni profilage, ni décision automatisée. Il n'y a donc pas de bandeau de consentement.`],
      ['Ce qui part vers des tiers', `Deux choses seulement. Un : les images des cartes ne sont pas sur notre site. Ton navigateur les demande au service images.pokemontcg.io, diffusé par le réseau de l'entreprise américaine Cloudflare. Ce service reçoit donc ton adresse IP, le type et la langue de ton navigateur, le nom de l'image demandée et l'adresse de notre site. Il ne dépose pas de cookie. Nous n'avons pas de contrat avec lui, et tes données peuvent quitter l'Union européenne sans les garanties habituelles : c'est une limite de cette démo. Nous nous appuyons sur notre intérêt légitime à afficher les cartes (article 6.1.f du RGPD). Tu peux bloquer ce domaine dans ton navigateur : le site fonctionne sans les images. Deux : l'hébergeur du site, [nom et pays de l'hébergeur], reçoit ton adresse IP et la liste des fichiers demandés. Il les garde [durée] dans ses journaux techniques, pour la sécurité du site.`],
      ['Combien de temps', `Ce qui est sur ton appareil y reste tant que tu ne l'effaces pas. Pour effacer ton compte, ton solde, ta collection, tes tirages et tes adresses : Paramètres, puis « Réinitialiser la démo ». Le thème, le stock d'exemple et l'accès admin restent : pour les retirer aussi, efface les données du site dans ton navigateur. La session admin se ferme avec l'onglet.`],
      ['Contact', `Le formulaire de contact de la démo n'envoie rien et ne garde rien. Si tu nous écris par e-mail, nous utilisons ton adresse et ton message pour te répondre, puis nous les supprimons au bout de [durée].`],
      ['Âge', `Le site est réservé aux personnes de ${RULES.minAge} ans ou plus. La démo se contente d'une case à cocher : elle ne vérifie pas ton âge et ne demande ni date de naissance ni pièce d'identité.`],
      ['Sécurité', `Les données de la démo sont gardées en clair dans ton navigateur. Sur un appareil partagé, n'y saisis pas ta vraie adresse. L'espace admin de la démo est un simple verrou local, pas une protection.`],
      ['Tes droits', `Tu peux demander l'accès à tes données, leur rectification, leur effacement, la limitation de leur traitement, t'y opposer, les récupérer (portabilité) et laisser des consignes pour après ton décès. Écris à ${BRAND.email} : nous répondons sous un mois. Pour ce qui est gardé sur ton appareil, tu as la main : nous ne pouvons ni le lire ni l'effacer à ta place. Si tu estimes que tes droits ne sont pas respectés, tu peux saisir la CNIL (cnil.fr).`],
      ['Ce que la version définitive changera', `Paiement, vérification d'identité, livraison réelle, classement public : chaque traitement sera décrit ici avant son lancement, avec sa finalité, sa base légale, ses destinataires, ses transferts hors de l'Union européenne, sa durée de conservation et les décisions automatisées s'il y en a. Cette page sera alors réécrite et datée.`],
      ['Mise à jour', 'Version du [date].'],
    ],
    extra: `Cette démonstration n'a pas de serveur : ton compte, ton solde fictif et les adresses que tu saisis restent dans le stockage local de ton navigateur, en clair. Aucun cookie, aucune mesure d'audience, aucune publicité. Seules les images des cartes viennent d'un service tiers, qui reçoit donc ton adresse IP.`,
  },
```
