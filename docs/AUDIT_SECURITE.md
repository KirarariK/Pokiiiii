# Audit de sécurité du 28 novembre 2026

Trois relectures indépendantes (injections côté client, logique et état, configuration et dépôt), chaque trouvaille
vérifiée dans le code avant correction, puis test dans Chromium. Le site est une démonstration sans serveur : tout ce qui
est « sécurité » ici protège le visiteur et l'intégrité de l'affichage, pas de l'argent. Le jour où un serveur existera,
toutes les règles de jeu devront y être revérifiées (voir la dernière section).

## Résultat en une phrase

Aucune exécution de script n'a pu être provoquée (la CSP `script-src 'self'` bloque les gestionnaires injectés), aucun
secret n'est dans le dépôt ni dans son historique, mais plusieurs valeurs lues dans le stockage du navigateur atteignaient
l'affichage sans filtre : c'est corrigé.

## Corrigé

| Faille | Où | Correctif |
| --- | --- | --- |
| Clé d'un inventaire JSON importé reprise telle quelle dans un attribut HTML (recouvrement de l'écran possible) | `js/views/evolution.js`, `js/stock.js` | Identifiants filtrés à l'import et à la relecture, valeur échappée à l'affichage |
| `uid` et `rarity` d'une carte relus du stockage sans contrôle, puis insérés dans des attributs | `js/store.js`, vues Évolution, ouverture, collection | Cartes de forme impossible écartées au chargement, valeurs échappées ou encodées |
| Quantité de stock non numérique insérée comme HTML | `js/stock.js`, vues Cartes, Accueil, Admin | Stock nettoyé à la relecture, quantités passées par `num()` |
| La limite de dépenses se contournait en réinitialisant la démo puis en se réinscrivant (le compteur du jour repartait à zéro) | `js/store.js` | Le compteur du jour survit à la réinitialisation |
| `setDailyLimit(NaN)` supprimait la limite sans le délai de 48 h ; `setPause(Infinity)` passait | `js/store.js` | Valeurs non finies refusées |
| Un changement de schéma ou un JSON abîmé effaçait limites et pause d'auto-exclusion | `js/store.js` | Limites et pause récupérées avant de repartir d'un état neuf |
| Un seul élément `null` dans une liste enregistrée faisait planter des pages et bloquait « Réinitialiser » | `js/store.js` | Listes filtrées au chargement |
| Échec d'écriture du stockage silencieux : un rechargement annulait des achats sans prévenir | `js/store.js`, `js/main.js` | Message d'alerte affiché une fois |
| Empreinte de l'accès admin : un seul tour de SHA-256, sel tiré de `Math.random()` | `js/admin.js` | Sel cryptographique, 6 000 tours ; les anciens accès restent valables et sont renforcés à la connexion suivante |
| CSP : `style-src 'unsafe-inline'` laissait passer des balises `<style>` injectées | `vercel.json`, `index.html` | Styles en ligne limités aux attributs (`style-src-attr`) ; testé sur les parcours achat, ouverture, Évolution, admin : 0 violation |
| Tout le dépôt (docs, scripts, README) était servi publiquement | `.vercelignore` | `docs/`, `scripts/`, `README.md` exclus du déploiement |
| Cache de 7 jours sur `assets/data/catalogue.json` (non versionné) | `vercel.json` | Cache long limité aux polices, packs et marque ; données à revalider |
| Image du tableau de stock admin non filtrée par `imgUrl()` | `js/views/admin.js` | Filtrée |
| `Cross-Origin-Resource-Policy`, `.env*` | `vercel.json`, `.gitignore` | Ajoutés (préventif) |

Tests : `npm run smoke` (nouveaux contrôles sur la limite et la pause), parcours navigateur sous les en-têtes réels de
`vercel.json`, état volontairement hostile (`uid`, `rarity`, clés de stock, quantités) sans injection, états abîmés
(`null`, ancien schéma, JSON tronqué) sans plantage.

## Constaté, non corrigé

- **E-mail personnel dans l'historique Git** : un commit de fusion porte l'adresse de son auteur. À traiter (option GitHub
  « garder mon e-mail privé », ou réécriture d'historique) si le dépôt est ou devient public. Je n'ai pas réécrit
  l'historique : c'est destructif et c'est votre décision.
- **Accès admin purement local** : n'importe quel visiteur crée son propre accès sur son navigateur ; un script dans la page
  le contourne en deux lignes. C'est écrit dans le code et dans l'interface. Avant toute vraie mise en ligne :
  authentification côté serveur, et retrait du lien « Espace admin » du pied de page public.
- **Deux onglets ouverts** : le dernier qui écrit gagne. Deux achats déclenchés dans la même milliseconde peuvent dépenser
  deux fois le même solde. Impossible à la main ; disparaît avec un serveur.
- **Nouvelle commande avant d'avoir ouvert la précédente** : seule l'animation de révélation des anciennes cartes
  disparaît, les cartes restent au coffre.
- **Cashback** issu de mises financées par un bonus : retirable tout de suite. Montant faible, à arbitrer.
- **Équité** : la graine du serveur est lisible dans le stockage local (le site le dit), et la table de tirage n'est pas
  engagée avant le ticket : l'empreinte n'est notée qu'après coup.
- **`Évolution` et roue** ne comptent pas dans le plafond de dépenses quotidien ; la revente alimente le solde sans plafond.
- **Tableau de la page Transparence** : défile encore horizontalement sur mobile.

## Ce qui deviendrait grave avec un serveur

Atomicité des achats et reventes (transaction, idempotence, verrou par compte) ; validation serveur de tous les montants ;
limites et pauses conservées côté serveur, jamais réinitialisables par le client ; graine serveur jamais exposée et table de
tirage engagée avant le ticket ; crédit de bienvenue et bonus de premier dépôt limités par identité réelle ; tickets de
giveaway et points du classement farmables par achat puis revente en boucle (à plafonner ou à net des reventes) ;
chiffrement et durée de conservation des adresses de livraison.

## Vérifié sain

Aucun `eval`, `new Function`, `document.write` ni `srcdoc` ; pseudo, libellés, adresses et journaux de tirage échappés à
l'affichage ; paramètres de l'URL jamais réinjectés ; redirections après connexion limitées à une liste blanche ; aucun
secret dans les 100+ commits ni sur aucune branche ; aucune dépendance npm ; une seule origine externe (images de cartes),
déclarée dans la CSP ; aucun cookie, service worker ni traceur ; liens externes en `rel="noopener noreferrer"` ; aléa de jeu
par `crypto.getRandomValues` sans biais de modulo (χ² de 90 pour 99 degrés de liberté sur 300 000 tickets) ; probabilités
affichées égales aux plages de tirage ; double clic sur « Ouvrir » : un seul achat.
