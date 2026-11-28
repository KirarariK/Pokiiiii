# Vérification des cotes

Relevé du 28 novembre 2026, carte par carte, sur les 798 cartes du fonds.

## Ce qui a été fait

Pour chaque carte, les prix Cardmarket relayés par pokemontcg.io ont été relus un par un (moyenne 30 jours, tendance,
moyenne 7 jours, prix moyen de vente, prix le plus bas) et comparés à la cote embarquée.

## Ce que la vérification a montré

- **Les cotes embarquées étaient exactes par rapport à la source** : pour les 798 cartes, la cote stockée est la
  moyenne 30 jours actuellement publiée. Aucune n'était mal recopiée.
- **Les prix ne sont pas tous du même jour, et beaucoup sont anciens.** L'API ne rafraîchit pas toutes les cartes en même temps :
  seules 292 cartes ont un prix de juillet 2026. 477 cartes (60 %) ont un prix de plus de six mois, dont 312 de
  novembre 2025, soit plus d'un an. Le site annonçait pourtant « cotes relevées le 1er juillet 2026 » : la mention était inexacte
  et a été corrigée. Relancer `node scripts/build-cards.mjs` ne donnera des prix plus récents que lorsque l'API aura été mise à jour.
- **La moyenne 30 jours seule est trop optimiste pour un site qui rachète.** Pour 387 cartes (48 %), au moins deux des
  autres indicateurs sont plus bas que cette moyenne. Une carte rare qui ne s'échange que quelques fois par mois a une moyenne
  tirée par une vente isolée : en la rachetant à 90 % de cette moyenne, le site paie plus que ce qu'il la revendrait.
- Le prix le plus bas à la vente est, pour la moitié des cartes, inférieur à un tiers de la cote : c'est l'annonce la moins
  chère, souvent en mauvais état ou à l'étranger. Il n'est pas utilisé pour fixer la cote, mais il donne la mesure de
  l'écart entre « cote » et « prix auquel on trouve la carte ».

## Ce qui a été changé

Règle de la **cote prudente** (`scripts/prudent-price.mjs`) :

1. on garde le deuxième plus bas des indicateurs disponibles, sans jamais dépasser la moyenne 30 jours : les indicateurs qui
   concordent donnent la cote habituelle, ceux qui divergent la tirent vers le bas ;
2. un prix relevé il y a plus de six mois est abaissé de 10 % (`STALE_FACTOR`, réglable dans le même fichier).

La mention de date de la FAQ et de la page Transparence dit désormais « de novembre 2025 à juillet 2026 ».

| | Avant | Après |
| --- | ---: | ---: |
| Valeur cumulée des 798 cartes | 53 396,61 € | 46 858,82 € (-12,2 %) |
| Cartes dont la cote baisse | | 622 (dont 387 par la règle des indicateurs, le reste par la décote d'ancienneté) |
| Cartes sorties du fonds (cote < 4 €) | | 12 : Greninja ex, Sneasel, Mewtwo V, Venusaur V, Snorlax, Gyarados, Gardevoir ex, Dragonite-EX, Pikachu ex, Eevee, Charizard ex, Flying Pikachu V |

Les tables de tirage se recalculent seules : le retour de chaque pack reste sur sa cible, mais il est désormais mesuré sur
des cotes plus proches de ce que valent les cartes.

### Les quinze plus fortes corrections

| Carte | Identifiant | Ancienne cote | Cote prudente |
| --- | --- | ---: | ---: |
| Shining Charizard | neo4-107 | 1 508,76 € | 927,00 € (-39 %) |
| Gengar & Mimikyu-GX | sm9-165 | 607,67 € | 322,27 € (-47 %) |
| Umbreon VMAX | swsh7-215 | 1 538,35 € | 1 384,52 € (-10 %) |
| Dark Gengar | neo4-6 | 403,03 € | 259,78 € (-36 %) |
| Mewtwo-GX | sm35-78 | 416,75 € | 291,95 € (-30 %) |
| Team Rocket's Mewtwo ex | sv10-231 | 635,74 € | 513,80 € (-19 %) |
| Gardevoir & Sylveon-GX | sm10-205 | 325,42 € | 223,28 € (-31 %) |
| Giratina V | swsh11-186 | 599,82 € | 509,77 € (-15 %) |
| Blastoise & Piplup-GX | sm12-215 | 252,48 € | 167,25 € (-34 %) |
| Shining Steelix | neo4-112 | 226,82 € | 142,32 € (-37 %) |
| Dragonite V | swsh7-192 | 293,54 € | 209,41 € (-29 %) |
| Rayquaza VMAX | swsh7-218 | 779,21 € | 701,29 € (-10 %) |
| Latias & Latios-GX | sm9-170 | 758,07 € | 682,26 € (-10 %) |
| Lugia-GX | sm8-227 | 185,47 € | 110,57 € (-40 %) |
| Charizard-GX | sma-SV49 | 544,46 € | 475,97 € (-13 %) |

### Cartes dont les prix divergent le plus (écart de 3 fois ou plus entre indicateurs)

Ce sont les cartes les plus risquées à racheter : à surveiller dans l'espace admin et à ne pas surpondérer dans un pack.

| Carte | Identifiant | Moy. 30 j | Tendance | Moy. 7 j | Prix moyen de vente | Plus bas |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Teal Mask Ogerpon | sv6-24 | 41,88 € | 43,45 € | 41,24 € | 0,15 € | 40,00 € |
| Tyranitar-GX | sm8-223 | 42,45 € | 39,35 € | 35,04 € | 6,39 € | 15,00 € |
| Venusaur | base1-15 | 504,39 € | 841,63 € | 1 023,43 € | 170,00 € | 142,90 € |
| Magnemite | neo2-7 | 43,09 € | 52,46 € | 19,97 € | 99,70 € | 1,99 € |
| Dragonite-EX | xy12-72 | 4,22 € | 7,11 € | 3,34 € | 2,00 € | 0,99 € |
| Dark Feraligatr | neo4-5 | 95,21 € | 155,05 € | 47,81 € | 123,23 € | 10,00 € |
| Blastoise VMAX | swshp-SWSH103 | 7,62 € | 12,82 € | 5,06 € | 4,25 € | 2,50 € |

## Limites

- **Pas de seconde source de marché.** Cardmarket et les autres places de marché ne sont pas joignables depuis l'environnement
  de travail : les prix n'ont pas été recoupés avec les annonces réelles. Les cinq indicateurs relevés viennent de la même source
  relayée par l'API ; la règle prudente atténue ses incohérences internes, elle ne remplace pas un contrôle sur le marché.
- Une cote reste un prix observé entre vendeurs tiers, sans distinguer l'état, la langue ni l'édition.
- Avant toute ouverture réelle : contrôler à la main les cartes de plus de 300 € (surtout celles du tableau ci-dessus), qui font
  l'essentiel du risque.

## Et la marge ?

Le modèle est rentable en moyenne mais fragile : la marge de jeu tenait à 14,6 % des ventes, et les gros packs en gardaient le
moins (8 % pour Joyau) alors qu'une seule carte peut y dépasser le prix du pack de plusieurs fois. Les retours affichés ont donc
été baissés d'un point sur sept packs (deux sur Zénith et Joyau), sans toucher au pack événement : ils vont maintenant de 86 % à 90 %. Le détail chiffré est
dans [GERANT.md](GERANT.md) : le seuil de rentabilité passe de 2 176 à 1 985 packs par mois et le résultat mensuel de 7 791 € à 9 117 € dans l'hypothèse de référence.
