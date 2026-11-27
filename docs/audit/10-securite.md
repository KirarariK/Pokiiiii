# Sécurité de l'application et solidité du tirage vérifiable

Audit défensif du 27 novembre 2026, site servi en local (`http://127.0.0.1:4173/`). Dépôt non modifié.

Méthode : lecture du code, tests rejoués dans Chromium (Playwright) et script Node indépendant. Chaque point porte son statut :

- **[rejoué]** : observé dans le navigateur ou par script, sortie conservée dans le dossier ;
- **[lu]** : déduit de la lecture du code, non rejoué ;
- **[général]** : connaissance générale, non revérifiée à la source aujourd'hui.

Les correctifs proposés (diffs) ne sont **ni appliqués ni testés** (lecture seule).

## 1. Verdict

1. Avec la CSP en place, aucune charge n'a exécuté de script (83 champs de stockage, 17 gabarits d'URL, 13 fichiers d'inventaire) et aucun vecteur par URL n'injecte quoi que ce soit. Mais 7 points d'injection HTML existent, et les 7 exécutent du script dès qu'on retire la CSP : elle est la seule barrière, et elle est posée en balise meta.
2. L'espace admin ne protège rien : deux écritures dans le stockage du navigateur ouvrent l'accès sans mot de passe. Solde, stock, graine serveur et limites de jeu appartiennent au visiteur. Sans effet au-delà de l'appareil en démo, bloquant pour une version en argent réel.
3. Le calcul du ticket est correct et uniforme. Le schéma, lui, n'engage ni la table ni l'ordre des tirages, et crée la graine serveur après avoir reçu la graine client : transposé tel quel sur un serveur, il laisserait l'exploitant tricher sans que la page « Équité » le signale.

## 2. Constats

### A. Vulnérabilités confirmées

#### A1. Accès admin contournable sans mot de passe — bloquant (version réelle), faible (démo) [rejoué]

- Preuve : dans un navigateur vierge, `localStorage['pokiiiii.admin.v1'] = '{"user":"admin","salt":"x","hash":"x"}'` puis `sessionStorage['pokiiiii.admin.v1.session'] = '1'`. `#/admin/stock` s'affiche et l'import d'inventaire aboutit (« Inventaire importé : 1 référence au coffre. »).
- Cause : `js/admin.js:36-45`. `isAdmin()` ne teste que la présence d'un drapeau de session et d'un enregistrement ; l'empreinte n'est comparée qu'au moment de la saisie (`:69`).
- Aucun correctif côté navigateur n'a de valeur de sécurité. Au passage, l'empreinte est un SHA-256 salé à une seule passe, avec un sel tiré de `Date.now()` et `Math.random()` (`js/admin.js:24`, `:56`) : cassable hors ligne, mais sans objet tant que la porte s'ouvre sans elle.
- Ce qu'un visiteur peut faire en modifiant le stockage local [lu], sans passer par l'admin :
  - fixer son solde ;
  - s'ajouter des cartes de cote arbitraire et les revendre, le crédit étant calculé sur la cote rangée côté client (`js/store.js:121`, `:464`) ;
  - lire la graine serveur et calculer tous ses tickets à venir (`js/store.js:29`) ;
  - lever sa pause et sa limite quotidienne (`js/store.js:52`) ;
  - changer le stock et les cotes, donc les tables.
  Tout reste local à l'appareil.

#### A2. Injection HTML stockée par un inventaire importé — moyen [rejoué]

- Preuve : un fichier d'inventaire dont la fiche `c` porte `"img": "https://images.pokemontcg.io/base1/4.png'\"><img data-inj=9 src=x onerror=__x(9)>"`, importé par l'interface (Admin > Stock > Importer). L'élément injecté apparaît dans le DOM de `#/` et `#/cartes` (champ `img`) et dans la fiche détail ouverte depuis `#/cartes` (champ `imgHi`).
- Avec la CSP : gestionnaire bloqué (violation `script-src-attr`), 0 exécution. Sans la CSP (balise retirée à la volée) : script exécuté pour les deux champs.
- Cause : `js/ui/card.js:22` insère `card.img` et `card.imgHi` sans échappement ; `js/stock.js:198-205` recopie la fiche importée sans la valider. Même motif, non rejoué : `js/views/opening.js:232` et `:325`.
- Les champs de texte de la fiche (`name`, `nameEn`, `setId`, `set`, `code`, `number`, `type`, `tcgRarity`) et l'identifiant n'injectent rien sur 15 routes. Quantité et cote non numériques sont ramenées à des nombres à l'import (`js/stock.js:202-204`).
- Aggravation [lu] : `js/data/stock.js:6-7` invite à publier l'inventaire en collant l'export dans `PUBLISHED_STOCK`, chargé sans validation (`js/stock.js:43`). La charge serait alors servie à tous les visiteurs. Même puits pour l'adresse d'image d'exception du catalogue (`scripts/build-catalogue.mjs:76` vers `js/catalogue.js:31`), issue d'une API tierce.

#### A3. Injection HTML par un état local altéré — faible [rejoué]

Cinq champs de `pokiiiii.demo.v1` sont insérés sans échappement. HTML injecté avec la CSP, script exécuté sans elle.

| Champ | Page | Ligne |
|---|---|---|
| `cards[].uid` | `#/collection` | `js/views/collection.js:53`, `:54` (et `:101`, `js/views/opening.js:133` [lu]) |
| `cards[].rarity` | `#/collection`, `#/profil` | `js/ui/card.js:62`, `js/views/collection.js:82`, `js/views/profile.js:58` |
| `tx[].type` | `#/solde` | `js/views/wallet.js:80` puis `:83` |
| `giveaways[id].tickets` | `#/packs/brasier` | `js/views/pack.js:41` |
| `rolls[].id` | `#/equite` | `js/views/fairness.js:47` |

Il faut déjà pouvoir écrire dans le stockage de l'origine (accès à l'appareil, extension, autre page de la même origine) : c'est une défense en profondeur manquante, pas une attaque à distance.

Six horodatages altérés (`user.since`, `tx[].at`, `shipments[].at`, `fair.since`, `fair.archive[].until`, `rolls[].at`) font tomber la vue en « Oups » : `load()` ne valide aucun schéma (`js/store.js:60-80`).

#### Ce qui a résisté [rejoué]

- 17 gabarits d'URL (`?q=`, `/packs/:slug`, `/giveaways/:id`, `/legal/:doc`, `/admin/:tab`, chemin inconnu, `?redirect=`, `?mode=`, etc.), chacun encodé et brut, connecté et anonyme : aucune injection.
- 78 autres champs du compte, de l'accès admin et du thème (pseudo, adresse postale, numéro de suivi, graine client, libellés, identifiant admin) : aucune injection sur 28 routes.
- Pas de redirection ouverte [lu] : `safeRedirect` (`js/views/auth.js:12-14`), et `navigate()` n'écrit que l'ancre (`js/main.js:97-105`).

### B. Faiblesses de conception

#### B1. La table de tirage n'est pas engagée — élevé (version réelle)

- Le journal ne garde que 12 caractères d'empreinte (48 bits) calculés sur `identifiant:plage`, sans les cotes, le prix ni la date (`js/catalog.js:242`), plus la plage du lot gagné (`js/store.js:419`). La table du moment n'est pas reconstituable. [lu]
- L'exploitant connaît les deux graines et le compteur, donc le prochain ticket. Toute écriture de stock ou de cote avant de servir le tirage déplace les plages.
- Preuve de concept [rejoué, `03-verif-tirage.mjs` §5] : en retirant un seul exemplaire du lot gagnant, 19 gros lots sur 88 testés deviennent une carte moins cotée (perte moyenne 24,55 €). C'est la manœuvre la plus naïve : dans les 69 autres cas elle ne suffit pas. Les manœuvres plus fortes (vider un palier, `setReserved` de `js/stock.js:163`, changer une cote) n'ont pas été testées.
- La page afficherait « Conforme » [lu] : `status()` ne contrôle que le ticket recalculé et son appartenance à la plage notée au journal (`js/views/fairness.js:38-49`).

#### B2. Graine serveur créée après réception de la graine client — élevé (version réelle)

- `rotateSeeds(clientSeed)` appelle `freshSeeds(next)` (`js/store.js:626-630`) ; à la création du compte, le site tire les deux graines (`js/store.js:27-30`). [lu]
- Preuve de concept [rejoué, §6] : pour une graine client connue, la pire de 20 000 graines serveur candidates donne 540,92 € de cote sur les 5 premiers tirages du pack Légende, contre 1 267,03 € en moyenne (−57 %), à table fixe. Quelques secondes de calcul.
- La page affirme le contraire : « Comme nous ne la connaissons pas à l'avance, nous ne pouvons pas préparer un résultat » (`js/views/fairness.js:146`).

#### B3. La page de vérification recalcule le ticket, pas le reste — moyen [lu]

- Elle recalcule bien le HMAC (`js/views/fairness.js:45`, formulaire `:195`).
- Elle ne recalcule pas SHA-256(graine révélée) pour le statut automatique : `revealedSeed()` se fie à l'empreinte rangée avec la graine (`js/store.js:636`). Le formulaire affiche l'empreinte (`:197`) et laisse la comparaison à l'œil.
- Évolution et cashback : seul le ticket est contrôlé, pas le résultat (réussite face au seuil, multiplicateur face au barème).
- Packs : le vérificateur manuel résout sur « la table du moment » (`:23`), pas sur celle du tirage.
- Archive limitée à 20 graines, journal à 300 tirages (`js/store.js:18-19`) : au-delà, un tirage reste affiché « Graine en cours » (`js/views/fairness.js:40`).

#### B4. Pas de synchronisation entre onglets — moyen (démo) [lu]

Aucun écouteur `storage` dans `js/` ; l'état est lu une fois par onglet (`js/store.js:82`). Deux onglets réutiliseraient le même compteur et écraseraient leurs états. Non rejoué.

#### B5. Ce qui est sain dans le tirage [rejoué]

- `ticketFor()` égale un recalcul `node:crypto` en arithmétique entière sur 20 000 cas, graines Unicode comprises.
- Bornes : jamais de ticket 1 000 000. Biais de découpage (52 bits sur 10^6 tickets) : 2,2 × 10^-10.
- Uniformité sur 3 000 000 de tickets : khi² à 1 000 tranches p = 0,357 ; dernier chiffre p = 0,844 ; modulo 1 000 p = 0,141 ; par jeu p = 0,135, 0,529 et 0,130 ; moyenne z = 0,73 ; corrélation entre tirages consécutifs z = −0,47.
- Les 8 tables couvrent 0 à 999 999 sans trou ; retour exact égal à la cible (88 à 92 %).
- Bout en bout : 20 tirages recalculés après rotation, empreinte conforme, compteurs 0 à 19 sans trou ni doublon (un seul onglet).
- Graine client : deux-points et espaces refusés (`js/fair.js:126`), message non ambigu.

#### B6. CSP et en-têtes — moyen

- Le serveur local n'envoie aucun en-tête de sécurité [rejoué, `curl -I`]. Toute la politique tient dans `index.html:6`.
- Forces : `script-src 'self'` sans `'unsafe-inline'` ni `eval`, `base-uri`, `form-action`, `connect-src 'self'`.
- Lacunes :
  - en balise meta, `frame-ancestors`, `report-uri` et `sandbox` sont ignorés [général, spécification CSP niveau 3, section « meta element », https://www.w3.org/TR/CSP3/#meta-element] : aucune protection contre l'encadrement ;
  - `style-src 'unsafe-inline'` laisse passer une balise `<style>` injectée (maquillage de page, non testé) ;
  - pas de `object-src 'none'` ;
  - `data:` en `img-src` : risque faible, sans doute requis par le favicon généré (`js/theme.js:41`, non vérifié).
- `referrer` en `strict-origin-when-cross-origin` (`index.html:7`) : l'hébergeur d'images reçoit l'origine du site, l'adresse IP et les cartes vues par chaque visiteur.

#### B7. Divers

- Dépendances : `package.json` n'en déclare aucune ; les scripts n'utilisent que Node. Aucun script tiers à l'exécution, donc pas d'intégrité de sous-ressource à poser aujourd'hui. Seule ressource tierce : les images de `images.pokemontcg.io`. [lu]
- Secrets : rien dans les 61 commits (recherche de clés, jetons et mots de passe sur `git log --all -p`). L'API est appelée sans clé (`scripts/tcg-api.mjs:29`). [rejoué]
- Données en clair dans le navigateur : ni mot de passe ni e-mail de joueur ; l'adresse postale complète est dans `pokiiiii.demo.v1` (`js/store.js:503-511`), comme la graine serveur (documenté, `js/fair.js:12-13`). [rejoué sur l'état de test]
- Jeu responsable [lu] : pause et limite quotidienne vivent dans le stockage local. « Réinitialiser la démo » (`js/views/settings.js:142`, `js/store.js:363-368`) lève une pause annoncée comme non levable (`js/views/settings.js:72`).
- Hébergement [général] : le stockage local est partagé par toute l'origine. Sur une adresse du type `compte.github.io/depot`, les autres pages du même compte y accèdent. Prévoir un domaine dédié.

## 3. Actions recommandées

### (a) Dans le code

Diff proposé, non appliqué, non testé :

```diff
--- a/js/format.js
+++ b/js/format.js
@@ -6,2 +6,12 @@ export const esc = ...
+/** Adresse d'image acceptée : l'hébergeur prévu, en https. Sinon chaîne vide. */
+export function imgUrl(u) {
+  try {
+    const url = new URL(String(u));
+    return url.protocol === 'https:' && url.hostname === 'images.pokemontcg.io' ? url.href : '';
+  } catch {
+    return '';
+  }
+}
--- a/js/ui/card.js
+++ b/js/ui/card.js
-import { esc, eur } from '../format.js';
+import { esc, eur, imgUrl } from '../format.js';
@@ -12 @@
-  return `<span class="badge badge--rarity ${cls}" data-rarity="${rarity}">${r.label}</span>`;
+  return `<span class="badge badge--rarity ${cls}" data-rarity="${esc(rarity)}">${r.label}</span>`;
@@ -22 @@
-  ...<img src="${hi ? card.imgHi : card.img}" alt=...
+  ...<img src="${esc(imgUrl(hi ? card.imgHi : card.img))}" alt=...
@@ -62 @@
-  return `<${tag} class="tile ${cls}" ${rarity ? `data-rarity="${rarity}"` : ''} ${attrs}>
+  return `<${tag} class="tile ${cls}" ${rarity ? `data-rarity="${esc(rarity)}"` : ''} ${attrs}>
--- a/js/views/collection.js
@@ -53,54 @@
-  ... data-select="${owned.uid}" ...
+  ... data-select="${esc(owned.uid)}" ...
-  ... attrs: `type="button" data-detail="${owned.uid}"` ...
+  ... attrs: `type="button" data-detail="${esc(owned.uid)}"` ...
@@ -82 @@
-    body: `<div class="detail" data-rarity="${owned.rarity}">
+    body: `<div class="detail" data-rarity="${esc(owned.rarity)}">
@@ -101 @@
-      ? `<a class="btn btn--ghost" href="#/evolution?carte=${owned.uid}" data-close>
+      ? `<a class="btn btn--ghost" href="#/evolution?carte=${esc(encodeURIComponent(owned.uid))}" data-close>
--- a/js/views/profile.js
@@ -58 @@
-          ? `<div class="best" data-rarity="${s.best.rarity}">
+          ? `<div class="best" data-rarity="${esc(s.best.rarity)}">
--- a/js/views/wallet.js
@@ -83 @@
-  <td><span class="tx-type">${icon(type.icon, { size: 16 })}${type.label}</span></td>
+  <td><span class="tx-type">${icon(type.icon, { size: 16 })}${esc(type.label)}</span></td>
--- a/js/views/pack.js
@@ -41 @@
-      <strong>${tickets == null ? '–' : tickets}</strong>
+      <strong>${tickets == null ? '–' : esc(tickets)}</strong>
--- a/js/views/fairness.js
@@ -45,47 @@
-  const ok = ticketFor(seed, roll.clientSeed, roll.nonce, roll.game) === roll.ticket && inRange;
+  const committed = sha256Hex(seed) === roll.hash; // l'engagement lui-même
+  const outcomeOk = !('win' in o) || o.win === (roll.ticket < o.winBelow);
+  const ok = committed && outcomeOk && ticketFor(seed, roll.clientSeed, roll.nonce, roll.game) === roll.ticket && inRange;
-  ... data-fill="${roll.id}" ...
+  ... data-fill="${esc(roll.id)}" ...
--- a/js/views/opening.js
@@ -133, 232, 325 @@   même traitement : esc(owned.uid), esc(imgUrl(t.card.img)), esc(imgUrl(card.imgHi))
--- a/js/stock.js
+++ b/js/stock.js
+import { imgUrl } from './format.js';
+const text = (v, max = 80) => String(v ?? '').slice(0, max);
+/** Ne garde d'une fiche importée que les champs attendus, typés et bornés. */
+function cleanCard(id, c) {
+  return {
+    id, name: text(c.name), nameEn: text(c.nameEn), setId: text(c.setId, 20), set: text(c.set), code: text(c.code, 12), number: text(c.number, 12),
+    value: Math.max(0, Math.round(Number(c.value)) || 0), type: text(c.type, 20), tcgRarity: text(c.tcgRarity, 40), img: imgUrl(c.img), imgHi: imgUrl(c.imgHi),
+  };
+}
@@ -204 @@ importStock
-    items[id] = { q, ...(item.c ? { c: item.c } : {}), ...
+    items[id] = { q, ...(item.c ? { c: cleanCard(id, item.c) } : {}), ...
--- a/js/catalog.js
@@ -242 @@   empreinte complète, cotes et prix compris (l'affichage devra la tronquer)
-  const version = sha256Hex(drops.map((d) => `${d.card.id}:${d.from}-${d.to}`).join('|')).slice(0, 12);
+  const version = sha256Hex(`${pack.slug}|${pack.price}|` + drops.map((d) => `${d.card.id}:${d.card.value}:${d.from}-${d.to}`).join('|'));
```

Ajouter l'import de `esc` là où il manquerait (`js/views/pack.js` non vérifié).

Ensuite, par ordre d'utilité :

1. Appliquer `cleanCard` aussi dans `load()` de `js/stock.js` et à `PUBLISHED_STOCK` ; valider le schéma dans `load()` de `js/store.js` (types, bornes, `uid` et `rarity` sur liste fermée).
2. Remplacer les gabarits à échappement manuel par un gabarit étiqueté qui échappe par défaut : il reste au moins 150 interpolations d'attributs à tenir à la main.
3. Tirage : créer la graine serveur suivante et afficher son empreinte avant que le joueur choisisse sa graine client ; noter au journal l'empreinte complète de la table.
4. Onglets : écouter l'événement `storage` et recharger l'état avant toute action (`js/store.js`, `js/stock.js`).
5. Images : `referrerpolicy="no-referrer"` sur les `<img>`, ou mieux, images servies par le site.
6. Corriger le texte de `js/views/fairness.js:146` tant que B2 n'est pas traité.
7. CSP : la passer en en-tête HTTP, avec `style-src-elem 'self'; style-src-attr 'unsafe-inline'` (les gabarits utilisent des attributs `style`), `object-src 'none'` et `frame-ancestors 'none'`.

En-têtes à poser chez l'hébergeur (politique à essayer sur le site avant déploiement) :

```
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; style-src-elem 'self'; style-src-attr 'unsafe-inline'; img-src 'self' https://images.pokemontcg.io data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

Un hébergeur qui n'autorise pas d'en-têtes personnalisés ne convient pas.

### (b) Cahier des charges de la version avec serveur

1. **Autorité** : solde, stock, cotes, tables, tirages, rachats, livraisons, limites et exclusions font foi côté serveur. Tirage, sortie de stock et débit dans une même transaction ; écritures comptables en centimes entiers, idempotentes.
2. **Joueurs** : e-mail vérifié, mot de passe en Argon2id ou clés d'accès, session en cookie `HttpOnly; Secure; SameSite`, protection CSRF, limitation de débit, second facteur pour les retraits.
3. **Admin** : origine séparée, authentification forte (second facteur matériel), rôles distincts (stock, support, finance, super-admin), double validation pour les cotes, le stock et les crédits manuels.
4. **Journal** : inaltérable, chaîné par empreintes, horodaté, pour chaque action admin et chaque mouvement de stock, de cote et de table ; copie hors du système.
5. **Tirage** :
   - graine serveur dans un coffre à clés, jamais journalisée ;
   - empreinte de la graine suivante publiée avant le choix de la graine client, graine client créée dans le navigateur ;
   - empreinte SHA-256 complète de la table (pack, prix, lots, plages, cotes, numéro de version, date), signée et publiée dans un registre chaîné avant le tirage ;
   - aléa frais du client et empreinte de la table acceptée dans chaque demande, tous deux dans le message HMAC ;
   - compteur atomique, tout compteur consommé journalisé, reçu signé rendu au joueur, qui garde les engagements de son côté ;
   - la table publiée en entiers, pas sa recette de calcul.
6. **Entrées et sorties** : validation par schéma (inventaire compris), échappement par défaut, CSP en en-tête.
7. **Données** : adresses chiffrées au repos, rien de personnel dans le stockage du navigateur, secrets dans un coffre, analyse de secrets et verrouillage des dépendances en intégration continue.
8. **Paiement** : champs de carte hébergés par le prestataire, notifications signées.
9. **Avant ouverture** : test d'intrusion externe et audit du tirage par un tiers (à cadrer avec un professionnel).

## 4. Non vérifié, à confirmer

- B3, B4, la levée de pause par réinitialisation et la publication d'un inventaire piégé : lus dans le code, non rejoués.
- Quantité altérée directement dans `pokiiiii.stock.v1` : `js/views/cards.js:41` et `js/views/admin.js:141` l'insèrent sans échappement [lu]. Mon passage sur les 15 champs de stock n'est pas concluant (la carte de test, trop peu cotée, n'était pas affichée) ; seuls les imports de A2 font foi pour le stock. Même réserve pour une cote de fiche (`c.value`) non numérique.
- Une seule forme de charge (`'"><img … onerror>`) : les contextes CSS et les adresses `javascript:` ne sont pas couverts. L'animation d'ouverture n'a pas été parcourue jusqu'au bout.
- Effet réel d'une balise `<style>`, d'un lien ou d'un `<meta http-equiv="refresh">` injectés sous la CSP actuelle : non testé.
- Dans mes journaux, `c.imgHi` apparaît aussi sur `/collection` et `/giveaways` : j'attribue ces deux mentions à la fenêtre de détail de `#/cartes`, encore présente pendant ses 180 ms de fermeture (`js/ui/modal.js:39`). Non revérifié.
- Prise en charge de `style-src-attr` et `style-src-elem` par Safari ; reproductibilité de la table entre moteurs JavaScript (`Math.pow`, `js/catalog.js:195-221`).
- Diffs et en-têtes non appliqués ni testés ; `scripts/smoke.mjs` à relancer après application.

## Fichiers

Dossier : ``

| Fichier | Rôle |
|---|---|
| `01-build-state.cjs` | construit un compte de test réaliste en pilotant le site (`baseline-state.json`) |
| `02-xss-fuzz.cjs` | une charge par champ de stockage et par paramètre d'URL ; option `--no-csp` |
| `04-xss-import.cjs` | import d'inventaires piégés par l'interface admin ; option `--no-csp` |
| `03-verif-tirage.mjs` | vérification indépendante du tirage, uniformité, preuves de concept §5 et §6 |
| `fuzz-avec-csp.log`, `fuzz-sans-csp.log`, `import-avec-csp.log`, `import-sans-csp.log`, `verif-tirage.log` | sorties observées |

Relance : `node 02-xss-fuzz.cjs`, `node 04-xss-import.cjs`, `node 03-verif-tirage.mjs 3000000` (le site doit être servi sur le port 4173).
