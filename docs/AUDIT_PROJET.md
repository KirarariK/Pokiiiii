# Audit du projet

Audit du 27 novembre 2026 : le site est-il bien fait, sûr, équilibré et original ? Cinq agents y ont travaillé, un par volet. Les rapports détaillés sont dans [`docs/audit/`](audit/). Le volet juridique est dans [`AUDIT_JURIDIQUE.md`](AUDIT_JURIDIQUE.md).

## Verdict

1. **Le site tient debout.** 38 pages testées sur ordinateur et sur mobile, connecté ou non : aucune erreur, aucun débordement, aucun lien mort. Le cœur du tirage est sain : 2 331 tirages jusqu'à la rupture de tous les packs sans une seule incohérence, tickets uniformes sur trois millions d'essais.
2. **Il n'était pas encore au niveau annoncé sur quatre points** : neuf bogues autour de l'argent et du stock, un tirage « vérifiable » qui n'engageait ni la table ni la graine suivante, une accessibilité en dessous du niveau AA, et une gamme encore reconnaissable comme celle du concurrent étudié au départ. Les quatre sont corrigés dans ce commit ou documentés ci-dessous.
3. **Trois faiblesses restent, et aucune ne se règle dans le code** : le nom, l'usage des visuels de cartes, et l'absence de serveur. Elles sont décrites à la fin.

## Notes

Avant corrections, par l'agent chargé de l'originalité (un critique, pas un flatteur) :

| Axe | Note |
|---|---|
| Originalité du concept | 5 / 10 |
| Originalité visuelle | 5 / 10 |
| Finition | 6,5 / 10 |
| Clarté pour le joueur | 6,5 / 10 |
| Confiance inspirée | 4 / 10 |

Ce qui est réellement distinctif : la table de tirage carte par carte tirée du stock réel, la recherche « de quel pack sort cette carte », le retour affiché par pack, la page de transparence. Le reste (rachat, Évolution, cashback, lobby, flux en direct) est le répertoire courant des sites de caisses et des casinos en ligne.

## 1. Revue de code

Rapport : [`audit/09-revue-code.md`](audit/09-revue-code.md).

| Bogue reproduit | Gravité | État |
|---|---|---|
| Double clic sur « Ouvrir » : deux achats, une seule carte révélée | élevé | corrigé (verrou d'achat) |
| Journal plafonné à 500 lignes utilisé comme source de vérité : bonus de premier dépôt versé deux fois, limite quotidienne contournée | élevé | corrigé (compteurs durables) |
| Lots de giveaway mis de côté seulement après la visite de certaines pages | élevé | corrigé (réservation au chargement et avant chaque tirage) |
| Stock et cartes détenues divergent après un retour au stock de départ | élevé | corrigé pour le retour au stock de départ ; un import reste une déclaration d'inventaire |
| Deux onglets : le second écrase l'état du premier | élevé | atténué (l'autre onglet relit l'état) ; la vraie correction est un serveur |
| Dernier pack composable : ouverture bloquée | moyen | corrigé |
| Double clic sur « Créditer » : deux dépôts | moyen | corrigé |
| Tickets de giveaway jamais remis à zéro | moyen | corrigé (tickets du mois) |
| Évolution : verdict masqué après un nouveau rendu | faible | corrigé |

Vérifié sans anomalie : les huit tables au retour cible, plages de tickets contiguës couvrant exactement le million, achat ×10 partiellement servi, double revente refusée.

## 2. Sécurité et tirage vérifiable

Rapport : [`audit/10-securite.md`](audit/10-securite.md).

- **Injection** : avec la politique de sécurité du contenu, aucune charge n'a exécuté de script (83 champs, 17 gabarits d'adresse, 13 fichiers d'inventaire). Mais sept points d'injection existaient derrière cette seule barrière. Corrigé : adresses d'image contrôlées, fiches d'un inventaire importé réduites aux champs attendus, attributs échappés, état local validé au chargement.
- **Espace admin** : il ne protège rien, deux écritures dans le stockage du navigateur l'ouvrent. Sans effet au-delà de l'appareil en démonstration ; bloquant en réel. Aucun correctif côté navigateur n'a de valeur.
- **Tirage vérifiable** : le calcul du ticket est correct et uniforme. Deux faiblesses de conception corrigées :
  - la graine serveur était créée après la graine client ; désormais l'empreinte de la graine suivante est affichée avant que le joueur choisisse la sienne ;
  - le journal ne gardait que 12 caractères d'empreinte de table ; il garde l'empreinte complète (cartes, cotes, plages), et la page Équité contrôle aussi l'engagement de la graine, le seuil d'une Évolution et le barème de la roue.
- **Reste à faire côté serveur** : publier l'empreinte de la table avant le tirage. Sans cela, rien n'empêche de modifier une table après avoir vu un ticket.

En-têtes à poser chez l'hébergeur (une balise `meta` ne suffit pas, `frame-ancestors` y est ignoré) :

```
Content-Security-Policy: default-src 'self'; img-src 'self' https://images.pokemontcg.io data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'none'
Strict-Transport-Security: max-age=63072000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Cross-Origin-Opener-Policy: same-origin
```

## 3. Tests navigateur et accessibilité

Rapport : [`audit/11-qa-accessibilite.md`](audit/11-qa-accessibilite.md).

Fonctionnel : solide. Accessibilité : non conforme au niveau AA avant corrections.

| Défaut | Gravité | État |
|---|---|---|
| Le lien d'évitement menait à « Page introuvable » | élevé | corrigé |
| Bouton « Recharger » sans nom sur mobile | élevé | corrigé |
| Badges et pastille « 18+ » à 2,4–2,8:1 | élevé | corrigé |
| Raretés, gains et bouton de suppression sous 4,5:1 sur les thèmes clairs | moyen | corrigé (couleurs rapprochées de celle du texte) |
| Onglets et choix sans flèches, focus perdu après un changement d'onglet | moyen | corrigé |
| Champs peu délimités, texte indicatif trop pâle | moyen | corrigé |
| Liens distingués par la seule couleur | moyen | corrigé (soulignés dans le texte) |
| Tableaux défilants inatteignables au clavier sur mobile | moyen | corrigé |
| Titres : pas de titre principal à l'ouverture, niveaux sautés | moyen | corrigé |
| Fenêtres : arrière-plan actif, repères en double, action destructive focalisée d'office | faible à moyen | corrigé |
| « Faire livrer » sans effet sur une carte payée en partie avec un bonus | moyen | corrigé : la raison est affichée, et le bonus n'est plus réparti sur toute la commande |
| Cibles tactiles sous 44 px sur mobile | faible | à reprendre |

Non mesuré : zoom à 200 %, lecteurs d'écran réels. Un audit par un tiers reste nécessaire avant toute ouverture commerciale.

## 4. Protection du joueur

Rapport : [`audit/02-jeu-responsable.md`](audit/02-jeu-responsable.md).

Corrigé dans le site :

- limite de dépenses : baisse immédiate, relèvement ou retrait différé de 48 heures ;
- pause de 24 heures à 12 mois, qui bloque aussi recharges, roue et participations, et qui survit à une réinitialisation ;
- inscription avec date de naissance ; à la première visite, Échap ne vaut plus déclaration de majorité ;
- plus de particules ni de fanfare pour une carte cotée sous le prix du pack (c'était le cas de 16 à 33 % des tirages) ;
- rappel de session toujours actif, avec un bouton pour arrêter ;
- après une ouverture, le bouton principal mène à la collection, plus à un nouvel achat ;
- la part des tirages sous le prix est affichée à côté du retour moyen (accueil, page du pack, Transparence, FAQ).

Laissé en l'état, à décider : le mode d'ouverture rapide, l'achat jusqu'à dix packs, la roue du cashback, le classement doté, le taux de cashback croissant. Ce sont les marqueurs d'un casino ; les références britanniques les interdisent ou les encadrent.

## 5. Économie et failles de jeu

Rapport : [`audit/12-economie.md`](audit/12-economie.md).

Les packs ne se battent pas : sur 11 027 tables et 1 497 états du coffre, le retour reste sur la cible (93 % au plus), et attendre une table favorable ne rapporte rien. Six portes étaient ouvertes ailleurs :

| Faille | Gravité | État |
|---|---|---|
| Cote figée au tirage, sans échéance : une carte dont la cote baisse restait rachetable à l'ancien prix | élevé | corrigé : passé la garantie, la plus basse des deux cotes |
| Bonus sans dépôt joué sur le pack le plus cher : 50 à 58 € retirables par compte | élevé | propre à la démonstration ; `welcomeCredit` à 0 pour tout usage réel |
| Bonus de premier dépôt gagnant sur les gros packs (+9 € par compte) | moyen | corrigé : mises pondérées par la marge du pack |
| Détour par l'Évolution meilleur que le rachat différé (85,07 % contre 85 %) | faible | corrigé : la carte gagnée hérite de la garantie de la carte misée |
| Classement : « coûte toujours plus qu'il ne rapporte » était faux | faible | texte corrigé |
| Giveaway : gros lot hors d'atteinte (2 466 packs pour 500 vendus par mois) | faible | corrigé : sept lots dimensionnés sur les ventes attendues |

Le compte de résultat est reproduit à l'euro, mais il reposait sur trois hypothèses favorables :

- **la TVA** : 4 111 € par mois dans la lecture retenue, 10 952 € vente par vente (résultat : 950 € au lieu de 7 791 €), 28 067 € sur tout le prix (perte de 16 165 €). Le pilotage affiche désormais les trois ;
- **le prix d'achat des cartes** à 75 % de la cote : le résultat s'annule vers 95 % ;
- **le stock et sa trésorerie**, absents du compte : environ 80 000 € immobilisés pour le coffre d'exemple.

## 6. Originalité

Rapport : [`audit/13-originalite.md`](audit/13-originalite.md).

Ni code, ni image, ni marque du concurrent n'ont été copiés. Mais la gamme (noms et prix de quatre packs, paliers, pack événement), une partie de la FAQ, le slogan et le squelette des pages en venaient encore, de façon reconnaissable. Corrigé :

- **gamme refaite** : huit packs renommés (Rosée, Prisme, Orage, Millésime, Brasier, Canopée, Zénith, Joyau), à prix ronds de 8 à 300 €, avec leurs propres paliers ;
- **FAQ réécrite** : elle décrit la démonstration, plus un service à venir ;
- **accroche d'accueil** remplacée par les deux atouts propres au site : « Chaque carte est au coffre. Chaque chance est affichée. »

Ce qui reste commun relève du genre (un pack, une carte, un rachat) et non d'un concurrent.

Jugement des différenciateurs :

| Différenciateur | Jugement |
|---|---|
| Tables pilotées par le stock réel | distinctif ; crédible seulement si chaque version est archivée et liée au ticket |
| « Vise une carte » | distinctif, sous-exploité |
| Retour affiché par pack | distinctif ici, courant dans le jeu d'argent |
| Page de transparence | distinctif, meilleur atout de confiance |
| Rachat à deux taux | déjà courant |
| Évolution | courant ailleurs, nouveau ici ; la mécanique la plus « casino » |
| Cashback | courant ; la roue est un gadget qui divise la remise par deux dans 43 % des cas |
| Thème par type | inhabituel mais accessoire, et adossé à Pokémon |

## Ce qui reste, et ne se règle pas dans le code

1. **Le nom.** Cinq « i », impossible à dicter, et dérivé de « Poké » : fragile comme marque et exposé à une opposition. À remplacer avant toute communication.
2. **Les visuels des cartes.** Images de référence chargées chez un tiers qui annonce sa fermeture en mars 2027, affichées aussi pour des cartes hors stock et en décor. La cible : des photos maison des cartes réellement en stock, avec langue, état et édition.
3. **Pas de serveur.** Solde, stock, tirages, limites et accès admin vivent dans le navigateur. Rien de tout cela ne peut porter de l'argent ou des données réelles.
4. **Les illustrations des packs et le logo** sont générés par IA : propres au regard des tiers, mais probablement pas protégeables, et d'un rendu inégal. Un graphiste, sur un gabarit unique.

## Les cinq changements qui feraient le plus

1. Une marque à soi : nom court et dictable, logo dessiné, couleur fixe.
2. L'atout unique en première ligne : « Quelle carte veux-tu ? », avec les packs d'où elle sort, la chance et les exemplaires restants.
3. Une fiche carte de marchand : langue, état, édition, source et date de la cote, photo de l'exemplaire.
4. Prouver la transparence : archive publique des versions de table, journal du stock, cotes du jour.
5. Refondre le modèle vers la boutique à prix fixe avec tirages promotionnels (voir l'audit juridique).
