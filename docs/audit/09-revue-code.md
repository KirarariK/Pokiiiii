# 09 — Revue de correction et de robustesse du code

Rapport rendu le 27 novembre 2026, sur le commit `22fe091`. Dépôt en lecture seule, aucun fichier modifié.
`npm run smoke` passe (« Tout est bon »). Les preuves sont les scripts de ce dossier et leur sortie.

## 1. Verdict

1. Le cœur du tirage est sain : sur 2 331 tirages aléatoires jusqu'à la rupture de tous les packs, aucune violation d'invariant de `packTable`, aucune quantité négative, et une commande ×10 servie partiellement n'est facturée que pour les packs servis.
2. Neuf bogues sont reproduits autour du tirage, dont six touchent l'argent ou le stock : double achat au double clic, bonus de premier dépôt versé deux fois, lots de giveaway tirables, exemplaires fantômes, achat annulé depuis un second onglet, tickets de giveaway jamais remis à zéro.
3. Rien ne bloque la démonstration. Avant toute exploitation en argent réel, les points 1 à 5 sont à corriger, et ils ne le sont vraiment que si l'état fait foi côté serveur.

## 2. Constats

### A. Bogues confirmés (reproduits)

Gravité donnée pour une exploitation en argent réel. Les diffs sont des propositions non appliquées et non testées.

#### 1. Double clic sur « Ouvrir » : deux achats, une seule carte révélée — élevé

- Où : `js/views/pack.js:175-205` (`buy` n'a aucun verrou), `js/views/pack.js:220`, `js/store.js:427` (`state.pending` est écrasé).
- Scénario : compte ayant déjà accepté l'ouverture immédiate, double clic sur le bouton d'achat de `#/packs/starter`.
- Observé (`b1-navigateur.mjs`, test T1, `page.dblclick` de Playwright, sans délai entre les deux clics) : deux lignes « 1 × Booster Starter », solde 650,00 € → 630,10 €, 2 cartes, 1 seule à révéler. La première carte n'est jamais montrée.
- Limite de la preuve : avec l'intervalle d'un double clic humain (50 à 300 ms), non mesuré. Le changement de page peut passer avant le second clic.

```diff
--- js/views/pack.js  (mount)
+    let buying = false;
     const buy = async () => {
@@
       navigate('/ouverture');
+      return true; // achat fait : verrou gardé jusqu'au changement de page
     };
@@
-      if (e.target.closest('[data-buy]')) buy();
+      if (e.target.closest('[data-buy]') && !buying) {
+        buying = true;
+        buy().then((done) => { buying = done === true; }, () => { buying = false; });
+      }
```

#### 2. Journal plafonné à 500 lignes utilisé comme source de vérité — élevé

- Où : `js/store.js:17` et `:242` (troncature), `:376` (premier dépôt), `:124` (`spentSince`, limite quotidienne), `:153` (`stats`, `houseLedger`), `js/ui/topup.js:21`.
- Scénario : 260 cycles « acheter un Starter, le revendre » (520 lignes), puis un dépôt.
- Observé (`r1-tx-cap.mjs`) :
  - le journal ne contient plus aucun dépôt, et un nouveau dépôt de 500 € reçoit de nouveau 50 € de bonus ;
  - `spentToday()` rend 2 487,50 € pour 2 587,00 € réellement dépensés, et un achat passe avec une limite quotidienne à 2 550 € ;
  - `houseLedger().sales` est faux du même écart.

```diff
--- js/store.js
@@ fresh()
-    totals: { wagered: 0, staked: 0, theo: 0 },
+    totals: { wagered: 0, staked: 0, theo: 0, deposits: 0, day: '', daySpent: 0 },
@@ load()
-      totals: { ...base.totals, ...data.totals },
+      totals: { ...base.totals, deposits: (data.tx || []).filter((t) => t.type === 'depot').length, ...data.totals },
@@ deposit()
-  const first = !state.tx.some((t) => t.type === 'depot');
+  const first = state.totals.deposits === 0;
+  state.totals.deposits += 1;
@@ spentToday()
-  return spentSince(midnight.getTime());
+  return state.totals.day === new Date(now).toDateString() ? state.totals.daySpent : 0;
@@ buyPacks(), après addTx('achat', …)
+  const day = new Date(now).toDateString();
+  if (state.totals.day !== day) Object.assign(state.totals, { day, daySpent: 0 });
+  state.totals.daySpent += paid;
```

À compléter : `stats().spent` et `houseLedger().sales` à lire dans `state.totals.wagered`, et `topup.js:21` à brancher sur le même compteur.

#### 3. Lots de giveaway mis de côté seulement après la visite de certaines pages — élevé

- Où : `js/data/giveaways.js:41` est le seul appel à `setReserved` ; `js/stock.js:61` garde la réservation en mémoire seulement. Ni `js/main.js` ni `buyPacks` ne l'appellent.
- Scénario : arrivée directe sur une page de pack (rechargement, favori), puis achat.
- Observé (`r3-reservations.mjs`) : aucun exemplaire réservé. Le lot n° 1 (`neo4-107`, 1 508,76 €), ramené à un exemplaire, est dans la table du pack Légende avec p = 0,823 %. Après un passage par l'accueil il n'y est plus.
- Observé dans le navigateur (T5) : `#/packs/legende` affiche la version `ee1e12e74f04` à l'arrivée directe, `d2437728fc37` après l'accueil. La table publiée diffère pour 7 packs sur 8.

```diff
--- js/store.js
+import { listGiveaways } from './data/giveaways.js';
@@ buyPacks(), avant « if (!packTable(pack).ok) » ; evolve(), avant drawableQty()
+  listGiveaways(); // les lots sont mis de côté avant tout tirage
--- js/main.js  (boot, avant render())
+  listGiveaways(); // et avant le premier affichage d'une table
```

#### 4. Stock et cartes détenues divergent — élevé

- Où : `js/stock.js:183-209` (`resetStock`, `importStock` ignorent les cartes détenues), `js/store.js:470` et `:565` (+1 au retour), `js/store.js:65` (autre version : `fresh()`, sans migration).
- Observé (`r2-stock-desync.mjs`), stock de départ 2 785 exemplaires :
  - achat ×10, `resetStock()`, revente : 2 795, soit 10 exemplaires fantômes ;
  - export, achat ×5, import de l'export, revente : 2 790 ;
  - état enregistré en `v: 3` puis rechargement : compte vide (solde 0, 0 carte) et les 5 cartes ne reviennent jamais au stock (2 780).

```diff
--- js/store.js
+/** À appeler après resetStock() ou importStock() : les cartes gardées par le joueur ne sont pas à vendre. */
+export function reapplyHeldCards() {
+  state.cards.filter((c) => c.status === 'coffre').forEach((c) => adjustStock(c.cardId, -1));
+}
@@ load()
-    if (!data || data.v !== VERSION || !data.fair?.serverSeed) return fresh();
+    if (!data || data.v !== VERSION || !data.fair?.serverSeed) {
+      // Ne pas jeter un compte en silence : copie de secours, et ses cartes reviennent au stock.
+      try { localStorage.setItem(`${STORAGE_KEY}.avant-v${VERSION}`, raw); } catch {}
+      (Array.isArray(data?.cards) ? data.cards : []).filter((c) => c?.status === 'coffre').forEach((c) => adjustStock(c.cardId, 1));
+      return fresh();
+    }
```

L'appel à `reapplyHeldCards()` est à placer dans `js/views/admin.js`, que je n'ai pas lu.

#### 5. Deux onglets : le second écrase l'état du premier — élevé

- Où : `js/store.js:85-93` et `js/stock.js:63-73` écrivent l'état entier ; aucun écouteur `storage` dans le dépôt.
- Scénario (T6) : l'onglet A achète 10 Starter (solde 0,50 €, 10 cartes). L'onglet B, ouvert avant, change un simple réglage.
- Observé après rechargement de A : solde 100,00 €, 0 carte, 0 achat, et le stock reste à 2 775 au lieu de 2 785.
- Conséquence : on peut voir le résultat d'un achat puis l'annuler, et dix cartes sortent du stock sans propriétaire.

```diff
--- js/store.js  (fin de fichier)
+// Un autre onglet a écrit : on reprend son état au lieu de l'écraser au prochain commit.
+globalThis.addEventListener?.('storage', (e) => {
+  if (e.key !== STORAGE_KEY) return;
+  state = load();
+  [...listeners].forEach((fn) => fn(state));
+});
--- js/stock.js  (fin de fichier)
+globalThis.addEventListener?.('storage', (e) => {
+  if (e.key !== STOCK_KEY) return;
+  state = load();
+  changed({ persist: false });
+});
```

Ce correctif réduit la fenêtre sans la fermer : seul un état côté serveur règle le problème.

#### 6. Dernier pack composable : l'ouverture reste bloquée — moyen

- Où : `js/views/opening.js:227` (`drawFromPack`) → `js/catalog.js:273` (exception) ; `busy` reste vrai (`js/views/opening.js:312`).
- Scénario : l'achat qui met le pack en rupture, puis clic sur le pack dans `#/ouverture`, animation complète.
- Observé (`r5-reel.mjs`, puis T3) : erreur de page « Pack « legende » : aucune table de tirage… », phase restée `idle`, indication masquée, second clic sans effet, pas de bouton « Tout révéler » pour une carte seule, carte toujours à révéler.
- Aucune perte d'argent : la carte est au coffre. Contournement : quitter la page, ou activer « Rapide » puis y revenir.

```diff
--- js/views/opening.js
-import { cardById, cardRef } from '../catalog.js';
+import { cardById, cardRef, packAvailable } from '../catalog.js';
@@ open()
-      if (fast) {
+      // Dernier pack composable : plus de table, donc pas de bande à faire défiler.
+      if (fast || !packAvailable(pack)) {
```

#### 7. Double clic sur « Créditer » : deux dépôts — moyen

- Où : `js/ui/topup.js:41-52` ; `js/ui/modal.js:33-42`, la fenêtre reste cliquable 180 ms après `close()` (`:39`).
- Observé (T2, `page.dblclick`) : dépôts 0 → 2, solde 100 € → 142 € (deux fois 20 €, plus 2 € de bonus).
- En production ce parcours passera par un prestataire de paiement, mais le défaut vaut pour toutes les fenêtres.

```diff
--- js/ui/modal.js  (close)
     wrap.classList.add('is-leaving');
+    wrap.inert = true; // encore 180 ms dans la page : plus aucun clic pendant la sortie
```

#### 8. Tickets de giveaway jamais remis à zéro — moyen

- Où : `js/store.js:434-438` et `:640-642`. L'identifiant « brasier » est le même chaque mois, et l'achat ne vérifie pas que le giveaway est en cours.
- Observé (`r3-reservations.mjs`) : 3 packs Brasier donnent 3 tickets ; quarante jours plus tard, pour le giveaway du mois suivant, toujours 3 tickets.

```diff
--- js/store.js
@@ buyPacks()
-    const g = state.giveaways[pack.giveaway] || { joined: false, followed: false, tickets: 0 };
+    const g = giveawayEntry(pack.giveaway);
+    g.period = monthKey(new Date(now));
@@ giveawayEntry()
-  return state.giveaways[id] || { joined: false, followed: false, tickets: 0 };
+  const g = state.giveaways[id];
+  return g && g.period === monthKey() ? g : { joined: false, followed: false, tickets: 0 };
@@ updateGiveaway()
-  state.giveaways[id] = { ...giveawayEntry(id), ...patch };
+  state.giveaways[id] = { ...giveawayEntry(id), ...patch, period: monthKey() };
```

#### 9. Évolution : verdict jamais affiché après un nouveau rendu pendant l'animation — faible

- Où : `js/views/evolution.js:185` marque la tentative « montrée » avant la fin de l'animation ; le nettoyage (`:257`) annule la minuterie.
- Scénario : pendant les 4,2 s de l'aiguille, un rendu arrive (changement de thème via `js/main.js:179`, navigation dans l'historique).
- Observé (T4, `hashchange` émis une seconde après le lancement) : six secondes plus tard, verdict, ticket et bouton « Nouvelle tentative » toujours masqués, sans erreur de page.

```diff
--- js/views/evolution.js  (mount)
       const last = ui.last;
-      last.shown = true;
@@
       const settle = () => {
+        last.shown = true; // « montrée » seulement une fois le verdict affiché
```

### B. Vérifié sans anomalie

- `packTable` (`r4-packtable.mjs`) :
  - les 8 packs sont au retour cible sur le stock de démonstration ;
  - 2 331 tirages jusqu'à la rupture, tables de tous les packs contrôlées après chaque carte : plages contiguës, couverture exacte de [0, 1 000 000), sommes des probabilités égales à 1, pas de doublon, exemplaires affichés égaux aux exemplaires tirables, aucune quantité négative ;
  - stock vide ou un seul palier garni : refus propre (`stock`, cote moyenne 0) ;
  - trois paliers d'une carte, ou cotes identiques dans un palier : table valide ;
  - recherche de la raison butant sur une borne : refus `calibrage` (vu pour Brasier, Évoli et Master pendant les tirages).
- Achat ×10 partiellement servi (`r5-reel.mjs`) : 10 demandés, 9 servis, 2 241 € payés (9 × 249 €).
- Par lecture seulement : double revente refusée par le statut (`js/store.js:457`) ; en Évolution la carte misée revient au stock dans les deux cas et la carte visée en sort en cas de réussite (`js/store.js:565-567`).

### C. Soupçons (lecture du code, non reproduits)

- Quota de localStorage, moyen. `commit()` et `changed()` avalent l'erreur (`js/store.js:86-90`, `js/stock.js:66-70`). `state.cards` n'est jamais purgé : 295 caractères par carte mesurés, donc environ 17 000 cartes pour 5 millions de caractères (ordre de grandeur, quota non testé). Compte et stock s'écrivent sous deux clés : un échec d'un seul côté les désaccorde, et le compteur de tirage reviendrait en arrière au rechargement.
- `load()` ne valide que `v` et `fair.serverSeed` (`js/store.js:65`), faible. Un état altéré (`cards: null`, `balance` en texte) ferait planter les vues ou concaténer des chaînes.
- `importStock`, faible. Une entrée `null` sur une carte du fonds lève un `TypeError` (`js/stock.js:204`). La fiche `c` n'est pas validée : identifiant différent de la clé, cote absente.
- Cartes hors fonds devenues orphelines après `resetStock()` ou `importStock()`, moyen. `cardById` rend `undefined` : carte invisible dans la collection (`js/views/collection.js:42`) mais comptée dans les totaux, et plantage probable du sélecteur d'Évolution (`js/views/evolution.js:66`).
- Performance, non mesurée. Chaque carte tirée réécrit tout le stock et invalide les 8 tables (`js/stock.js:63-73`, `js/catalog.js:249-256`) ; un achat ×10 recalcule dix fois la table.
- Arrondi de la roue du cashback, faible. `Math.round(base × 0,5)` et `× 1,5` avantagent le joueur d'un demi-centime quand la cagnotte est impaire (`js/store.js:609`).

## 3. Actions recommandées

### (a) Dans le code

1. Appliquer les diffs 1, 2 et 3 : verrou d'achat, compteurs durables, réservation avant tout tirage.
2. Appliquer les diffs 4 et 5 : stock tenant compte des cartes détenues, pas d'effacement silencieux du compte, écoute de `storage`.
3. Appliquer les diffs 6 à 9.
4. Ajouter à `scripts/smoke.mjs` les scénarios de `r1` à `r5` : ils échouent aujourd'hui et passeraient après correction.
5. Avertir l'utilisateur quand une écriture en localStorage échoue, au lieu de continuer en silence.

### (b) Structure

- En argent réel, solde, stock, tirage et journal doivent faire foi côté serveur, avec des opérations atomiques et une clé d'idempotence par achat et par dépôt. Les points 1, 2, 4, 5 et 7 n'ont pas d'autre correction complète.
- Stock, réservations et cartes détenues dans une seule base, avec un contrôle périodique « stock + cartes détenues + lots réservés = inventaire physique ».
- Journal comptable complet et non plafonné ; les limites de jeu se calculent sur lui.

## 4. Non vérifié

- Non lus : `js/economics.js`, `js/views/admin.js`, `pilotage.js`, `home.js`, `giveaway.js`, `rewards.js`, `settings.js`, `leaderboard.js`, `fairness.js`, `js/ui/shell.js`, `js/ui/effects.js`. `js/views/cards.js` et `js/views/wallet.js` lus en partie seulement.
- Performance avec 20 811 cartes en stock : aucune mesure.
- Tous les soupçons de la section C.
- Borne haute du ticket dans `js/fair.js` (999 999) : par raisonnement, non testée.
- Double clic avec un intervalle humain pour le bogue 1.

## Fichiers

Dans `` :

- `common.mjs` : chargement du shim de stockage du dépôt ;
- `r1-tx-cap.mjs`, `r2-stock-desync.mjs`, `r3-reservations.mjs`, `r4-packtable.mjs`, `r5-reel.mjs` : reproductions Node (`node <fichier>`) ;
- `b1-navigateur.mjs` : reproductions dans Chromium, tests T1 à T6 (`node b1-navigateur.mjs [nom du test]`), site servi sur `http://127.0.0.1:4173/`.
