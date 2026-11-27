# 07 — Propriété intellectuelle (France / UE)

Audit du 27 novembre 2026. Analyse, pas avis d'avocat.

**Statut des sources.** [CODE] = lu dans le dépôt. [RR] = vu dans un résultat de recherche. [NV] = connaissance générale, non vérifiée pendant l'audit.
Aucun texte de droit n'a pu être relu à sa source officielle : l'outil de lecture de pages n'atteint ni `www.pokemon.com` ni `docs.pokemontcg.io` (hôtes hors du réseau autorisé de la session ; il faudrait les y ajouter), et le budget de recherche web, partagé entre les agents, s'est épuisé après 16 recherches. Les articles et arrêts marqués [NV] sont cités de mémoire : numéros, dates et formules à contrôler avant tout usage. Les adresses EUR-Lex sont construites à partir du numéro CELEX, sans avoir été ouvertes. Le nom du projet n'a figuré dans aucune requête.

## 1. Verdict

1. Revendre des cartes authentiques et les nommer est licite en principe (épuisement, usage référentiel). Le projet sort de ce cadre sur trois points : un nom en « Pok… », des illustrations de cartes reproduites en masse et en décor sans licence, et surtout l'adossement d'une marque de renommée, destinée aux enfants, à un jeu de hasard payant.
2. Les huit boosters et le logo générés par IA sont propres : ni Poké Ball, ni personnage, ni logo, ni symbole officiel. Leur faiblesse est inverse : ils ne sont probablement pas protégeables par le droit d'auteur.
3. La chaîne de données est fragile : l'API est annoncée hors ligne au 1er mars 2027 et rien n'autorise un usage commercial des cotes. Polices en règle, mention Lucide incomplète, mention de non-affiliation présente mais à réécrire.

## 2. Relevé dans le dépôt [CODE]

- **Aucun logo officiel, symbole d'extension, symbole d'énergie, Poké Ball ni personnage** hors des scans de cartes. `assets/data/catalogue.json` ne contient ni logo ni symbole ; les types sont affichés en texte et en icônes Lucide ; le dos de carte est maison (`js/ui/card.js`, étoile à quatre branches) ; les boosters de secours en SVG n'ont que des glyphes génériques (`js/ui/pack-art.js`).
- Le mot « Pokémon » n'apparaît dans l'interface que dans le pied de page, les mentions légales et un filtre du catalogue. 933 correspondances de noms anglais → français (`js/data/names-fr.js`) ; noms d'extensions en français (`scripts/sets-fr.mjs`).
- **Scans de cartes** chargés depuis `images.pokemontcg.io`, seul hôte externe admis par la CSP d'`index.html` : 20 811 cartes, 177 extensions, y compris les cartes « Pas au coffre » (`js/views/cards.js`, `js/catalogue.js`). **Usages décoratifs** : héros de l'accueil (trois scans, `js/views/home.js`), écran « Choisis ton univers » où chaque thème est illustré par la carte la plus cotée d'un Pokémon vedette (`signatureCard` dans `js/theme.js` ; `js/data/themes.js` vise Pikachu, Charizard, Mewtwo…), aperçus de packs, flux simulé.
- **Vocabulaire de l'univers repris pour l'identité du site** : neuf thèmes « un par type » aux noms français des types (dont « Électrik »), « Pack Évoli » (`js/data/packs.js`), jeu « Évolution », badges « Badge Foudre », « Badge Esprit »… (`js/data/badges.js`).
- **Cotes** : Cardmarket (moyenne 30 jours, tendance) ; à défaut, prix TCGplayer en dollars × 0,92 (`scripts/build-catalogue.mjs`, lignes 30-41) ; relevées le 2026-07-01. API appelée sans clé (`scripts/tcg-api.mjs`). Le site dit « Cotes indicatives » sans nommer la source ; le README la nomme.
- **Mention de non-affiliation** : pied de page (`js/ui/shell.js:124`), mentions légales et CGU (`js/views/legal.js:61` et `:37`), README. La génération par IA n'est mentionnée que dans le README.
- **Licences** : `assets/fonts/LICENSE-Manrope.txt` et `LICENSE-Unbounded.txt` (OFL 1.1 complètes, aucun nom réservé déclaré). `js/icons.js` : 102 icônes Lucide, en-tête de deux lignes (source, « licence ISC », copyright), sans le texte de la licence. `package.json` : aucune dépendance ; pas d'autre code tiers.
- **Fichiers d'images** : aucun bloc de métadonnées (WebP : VP8X, ALPH, VP8 seulement ; PNG sans texte).
- `index.html` porte `noindex, nofollow` : la démo est peu exposée.

## 3. Constats, du plus grave au moins grave

### C1 — Marque de renommée pour enfants associée à un jeu de hasard — ÉLEVÉ (structurel)

Éléments : tout le modèle (packs à tirage, « Évolution », roue, bonus à rejouer) ; `js/data/packs.js`, `js/data/themes.js`.

- **Ce qui protège le revendeur.** Épuisement : CPI L713-4 al. 1 et RMUE (UE) 2017/1001 art. 15(1) — le titulaire ne peut interdire l'usage de la marque pour des produits mis dans le commerce dans l'EEE par lui ou avec son consentement [NV]. Usage référentiel : CPI L713-6, I, 3° et RMUE art. 14(1)(c), « conformément aux usages loyaux du commerce » [NV]. CJUE, 4 nov. 1997, Dior c/ Evora, C-337/95 : le revendeur peut annoncer la revente selon les modes usuels de son secteur, sauf atteinte sérieuse à la renommée [RR pour l'existence, la date et le résumé ; formule exacte NV].
- **Ce qui le limite.** CPI L713-4 al. 2 et RMUE art. 15(2) : « motifs légitimes » d'opposition [NV]. CJUE, 23 févr. 1999, BMW, C-63/97 : impression de lien commercial [NV]. CJUE, 17 mars 2005, Gillette, C-228/03 : l'usage n'est pas loyal s'il tire profit de la renommée ou discrédite la marque [NV]. CPI L713-3 et RMUE art. 9(2)(c) : usage sans juste motif qui tire indûment profit de la renommée ou lui porte préjudice ; ternissement : CJUE, 18 juin 2009, L'Oréal c/ Bellure, C-487/07 [NV].
- **Application.** Un tirage payant réservé aux majeurs, avec mise de cartes, roue et bonus à rejouer, n'est pas un « mode usuel » de revente de cartes : la marque sert à vendre une chance, pas seulement à désigner un produit. Le titulaire d'une marque destinée aux enfants a un argument sérieux d'atteinte à la renommée. Si l'activité est qualifiée de loterie prohibée (agent 01), les défenses tirées des « usages loyaux » et du « juste motif » tombent.
- **Épuisement limité à l'EEE.** Une carte importée du Japon ou des États-Unis sans le consentement du titulaire n'est pas épuisée (CJUE Silhouette, C-355/96 ; Zino Davidoff, C-414/99) [NV]. Revendre une contrefaçon, même de bonne foi, engage la responsabilité (CPI L716-4, L716-10) [NV].
- **Pratique des titulaires.** Aucune action trouvée contre des sites d'ouverture de packs ou de « mystery box » (deux recherches ; le marché américain compte de nombreux acteurs, dont une grande enseigne depuis avril 2026) [RR]. Absence de résultat ne vaut pas tolérance. Précédents trouvés [RR] : TGI Paris, 24 oct. 2001, Nintendo c/ Sakura Compagnie (contrefaçon de la marque POKEMON n° 98 712 317 et de droits d'auteur) ; 2020, mise en demeure d'une créatrice au pseudonyme en « Poke… » associé à des contenus pour adultes, contrainte de changer de nom ; retraits répétés de sites de fans (2024). Politique publique [RR] : la page « copyright » de pokemon.com n'admet d'usage que selon ses conditions ou avec autorisation écrite ; les « Media Usage Guidelines » réservent les visuels à l'usage éditorial, sans usage commercial ni suggestion de parrainage. Hors Japon, les marques appartiendraient à Nintendo seule [RR].

### C2 — Nom du site commençant par « Poki/Poké » — ÉLEVÉ (bloquant pour un dépôt de marque)

Éléments : `BRAND.name` (`js/config.js`), clés de stockage, `package.json`, `index.html`, `README.md`.

- **Opposition probable à tout dépôt.** CPI L711-3, I, 1° et 2° et L712-4 (opposition devant l'INPI, deux mois après publication) ; RMUE art. 8(1)(b), 8(5) et 46 (trois mois) [NV]. Produits et services identiques (cartes, vente de cartes, jeux), attaque du signe identique, marque antérieure de très forte renommée, possible « famille de marques » en « Poké » (CJUE Bainbridge, C-234/06 P) [NV]. Un préfixe qui n'a de sens que par référence à Pokémon caractérise le profit indu ; l'association avec un jeu d'argent, le préjudice.
- **Sans dépôt** : contrefaçon (CPI L713-2, L713-3), parasitisme (C. civ. art. 1240), litige de nom de domaine [NV].
- **Second conflit possible** : le nom de travail est, à quelques « i » près, celui d'une plateforme européenne de jeux en ligne. Ses marques n'ont pas été vérifiées (le nom ne pouvait pas être recherché) [NV].
- **Précédents d'opposition EUIPO/INPI contre des signes en « Poke… »** : aucun trouvé en trois recherches. Seule trace : opposition de Nintendo à « Poké Go » devant l'office américain en 2017, issue non vérifiée [RR]. À chercher dans eSearch Case Law (EUIPO) et la base de jurisprudence de l'INPI.
- **Recommandation.** Nom inventé, sans « Pok », « mon », « dex », « ball » ni terme de l'univers ; « Pokémon » réservé au texte descriptif (« cartes Pokémon authentiques ») ; recherche d'antériorités (marques, sociétés, domaines) ; dépôt FR et UE en classes 28, 35 et 41 (9 et 36 selon le montage).

### C3 — Illustrations des cartes : 20 811 scans, usages décoratifs, hôte tiers — ÉLEVÉ ; MOYEN pour les seules cartes en stock

Éléments : `js/catalog.js`, `js/catalogue.js`, `js/views/cards.js`, `js/views/home.js`, `js/theme.js`, CSP d'`index.html`.

- **Droit.** L'épuisement ne vaut que pour la distribution de l'exemplaire (CPI L122-3-1 ; directive 2001/29 art. 4(2)), pas pour la reproduction ni la mise en ligne de son image (CPI L122-1, L122-4 ; directive art. 2, 3 et 3(3)) [NV]. Dior c/ Evora (point 58 et dispositif) : le droit d'auteur ne protège pas plus que la marque contre la publicité usuelle du revendeur [NV pour le point]. Deux réserves : l'arrêt visait des flacons, pas des œuvres qui sont le produit lui-même, et le droit français ne connaît d'exception de catalogue que pour les ventes judiciaires (CPI L122-5, 3°, d) [NV] ; il ne couvre que la promotion de produits effectivement revendus.
- **Hors cadre ici** : la plupart des 20 811 cartes ne sont pas en stock ; héros d'accueil et choix de thème sont du décor, pas une offre de vente ; ce sont des scans génériques d'un tiers, pas des photos des exemplaires vendus.
- **Le chargement à chaud ne protège pas.** Un site à but lucratif qui affiche par lien une œuvre mise en ligne sans autorisation est présumé le savoir (CJUE GS Media, C-160/15 ; VG Bild-Kunst, C-392/19) [NV]. La base utilisée est un projet non officiel ; ses conditions n'ont pas pu être lues.
- **Échéance.** L'API est « deprecated », sans nouvelle inscription ; clés valides jusqu'au 1er mars 2027, mise hors ligne annoncée à cette date ; successeur payant (Scrydex) [RR : documentation de l'API et dépôt GitHub du projet]. Sort de l'hôte d'images non vérifié : s'il ferme, tous les visuels du site disparaissent.

### C4 — Données et cotes sans droit d'usage commercial — MOYEN

Éléments : `scripts/tcg-api.mjs`, `scripts/build-catalogue.mjs`, `scripts/build-cards.mjs`, `assets/data/catalogue.json`.

- TCGplayer, « API Terms & Conditions » (version du 8 juin 2022) : interdiction de redistribuer les contenus à des fins commerciales ou concurrentes et de combiner ses prix avec d'autres prix [RR] — ce que fait `build-catalogue.mjs`.
- Cardmarket : point d'accès « Price Guide » réservé à certaines catégories d'applications ; identifiants non partageables [RR]. Conditions complètes non lues.
- Le projet n'a de contrat avec aucun des deux. Ces conditions lient l'intermédiaire, mais la source peut être coupée, et le droit sui generis du producteur de base de données (CPI L342-1 ; directive 96/9 art. 7) ou le parasitisme peuvent être invoqués [NV].
- La « cote » fixe le prix de rachat et les paliers : elle doit venir d'une source que le site a le droit d'utiliser, nommée et datée. Les cotes embarquées ont cinq mois.

### C5 — Reprise cumulée de l'offre du concurrent — MOYEN (détail : autre agent)

Aucune marque, logo, texte ni visuel du concurrent dans le code ; son nom n'apparaît que dans `docs/`. Mais quatre packs portent les mêmes noms aux mêmes prix (« Booster Starter » 9,95 €, « Booster Pro » 24,95 €, « Booster Master » 49,95 €, « Booster Expert » 99,95 €), le pack événement est au même prix (39,90 €), les paliers du Starter sont identiques sauf le dernier, l'échelle de raretés, le « coffre », le rachat à 90 % pendant 10 minutes, la limite de 10 packs et les délais sont les mêmes. `docs/ANALYSE_CARDMATIK.md` (§7) liste lui-même ce qui est « repris ». Risque : concurrence déloyale ou parasitisme (C. civ. art. 1240) [NV]. Ne pas publier `docs/` avec le site.

### C6 — Illustrations générées par IA et logo — FAIBLE (droits des tiers) ; MOYEN (protection propre)

Éléments : `assets/packs/*.webp`, `assets/brand/`, `js/ui/logo-mark.js`.

- **Ce que j'ai vu.** Huit sachets métallisés à soudures crantées, bandeau uni en bas, emblème central dans un anneau : goutte et flocons (Starter), huit gemmes de couleur autour d'une étoile (Évoli), éclair (Pro), étoile rouge (Rétro), flamme (Brasier), feuille (Master), couronne (Expert), diamant (Légende). Logo : carte inclinée jaune-orangé, étoile à quatre branches évidée.
- **Pas d'imitation de l'habillage officiel** : aucun logo, personnage, Poké Ball ni symbole d'extension ; la forme du sachet est commune à tous les jeux de cartes. Deux réserves : « un élément dans un disque » (flamme, goutte, éclair, feuille) reprend le principe des symboles d'énergie sans en copier le dessin — évocation, pas reproduction ; les huit gemmes du pack Évoli codent les huit évolutions, sans personnage mais sous un nom de personnage.
- **Protection.** Le droit d'auteur suppose une création humaine originale (CPI L111-1, L112-1 ; CJUE Infopaq, C-5/08 ; Painer, C-145/10) [NV]. Une image « générée puis détourée » et un tracé « repris tel quel » ne sont probablement pas protégés. Jurisprudence française sur l'image générée : sources secondaires contradictoires, dont un arrêt « Cass. 12 mars 2025, n° 24-10.542 » que je n'ai pas pu confirmer — à ne pas citer [RR]. Conséquence : protéger le logo par un dépôt de marque ; conserver invites et dates de génération.
- **Conditions de Figma** [RR]. Les « AI Terms » classent entrées et sorties comme « Customer Content », laissent au client la vérification et les autorisations, et excluent toute garantie. Une « AI copyright protection » est annoncée pour les offres Organization et Enterprise. La politique d'usage interdit de présenter une sortie comme purement humaine et de retirer filigranes ou métadonnées d'IA. Clause de propriété non lue en entier ; offre du compte utilisé inconnue. Les fichiers du dépôt n'ont aucune métadonnée : vérifier si l'outil en posait.
- **Règlement (UE) 2024/1689, art. 50.** Applicable depuis le 2 août 2026, non reporté par l'« omnibus numérique » (sursis jusqu'au 2 décembre 2026 pour le seul marquage technique des systèmes déjà sur le marché) [RR, sites de cabinets ; Journal officiel non consulté]. Le marquage (art. 50(2)) pèse sur le fournisseur de l'outil ; le déployeur ne doit signaler que les hypertrucages (art. 50(4), art. 3(60)) [NV]. Des illustrations stylisées d'emballage n'en sont pas : pas d'obligation légale, à mon sens. Mention volontaire recommandée ; préciser aussi qu'aucun sachet scellé n'est expédié (droit de la consommation).

### C7 — Licences des composants — FAIBLE

- Polices : OFL 1.1, fichiers de licence présents à côté des polices, aucun nom réservé : conforme [CODE].
- Lucide : la licence ISC exige de reproduire la notice de copyright **et** le texte de permission dans toute copie ; une partie des icônes vient de Feather (licence MIT, même exigence) [NV]. `js/icons.js` n'a que deux lignes.
- Crédits : présents dans le README et les mentions légales. Manquent dans le site : la génération par IA et la source des cotes.

### C8 — Mention de non-affiliation — FAIBLE (à réécrire)

Présente, mais : elle commence par « Site de démonstration » ; elle désigne des « propriétaires respectifs » sans les nommer ; elle n'est qu'en pied de page ; elle ne dit pas que les packs sont composés par le site. Une mention ne régularise rien : elle n'aide que contre l'impression de lien commercial (BMW, précité) et doit donc figurer là où la marque est utilisée.

Texte proposé, pied de page :

> [Nom] est un site indépendant de revente de cartes à collectionner authentiques. Il n'est ni édité, ni approuvé, ni parrainé par The Pokémon Company, Nintendo, Creatures Inc. ou GAME FREAK inc., et n'a aucun lien avec eux. Pokémon, les noms des Pokémon et des extensions sont des marques de Nintendo ; les illustrations des cartes sont © Nintendo, Creatures Inc. et GAME FREAK inc. Ils ne sont cités que pour désigner les cartes proposées. Les packs sont composés par [Nom] : ce ne sont ni des produits officiels ni des boosters scellés.

Page d'un pack et paiement :

> Pack composé par [Nom] à partir de cartes authentiques. Produit non officiel, sans lien avec The Pokémon Company ni Nintendo.

Crédits (mentions légales) :

> Photographies des cartes : [Nom]. Données de catalogue : [source sous licence]. Cotes : [source], relevées le [date], indicatives. Illustrations des packs et logo : images générées par IA, retouchées par [Nom]. Icônes : Lucide (licence ISC ; portions Feather, licence MIT). Polices : Unbounded et Manrope (SIL Open Font License 1.1).

## 4. Actions recommandées

### (a) Dans le site et le code

1. `js/config.js` : remplacer `BRAND.name` ; purger le nom actuel des clés (`STORAGE_KEY`, `STOCK_KEY`, `ADMIN_KEY`, `THEME_KEY`), de `package.json`, du titre d'`index.html`, de l'en-tête de `css/app.css`.
2. `js/data/packs.js` : renommer « Pack Évoli » (nom neutre, sous-titre descriptif) ; renommer et retarifer les quatre « Booster … » ; préférer « pack » à « booster ».
3. `js/data/themes.js`, `js/theme.js` : supprimer `signatureCard` (aperçu abstrait à la place) ; nommer les thèmes par leur ambiance (« Orage », « Brasier »… déjà dans `mood`) ; retirer « une par type ».
4. `js/views/home.js` : retirer les scans du héros et des éventails.
5. `js/views/cards.js`, `js/catalogue.js` : pas d'image pour une carte « Pas au coffre » (dos maison `cardBack()`).
6. `js/catalog.js`, `js/catalogue.js`, `index.html` : remplacer `images.pokemontcg.io` par des photos des exemplaires en stock, hébergées par le site (`img-src 'self'`), avant le 1er mars 2027.
7. `js/ui/shell.js:124`, `js/views/legal.js` : nouvelle mention ; ligne courte sur la page d'un pack et au paiement ; crédits complétés.
8. `js/icons.js`, `scripts/build-icons.mjs` : texte complet des licences ISC et MIT.
9. `js/data/badges.js` : renommer « Badge Foudre » et « Badge Esprit » (noms qui coïncident, sauf erreur, avec des badges officiels [NV]).
10. `scripts/build-catalogue.mjs` : supprimer le repli TCGplayer ; une seule source de cote, licenciée, nommée et datée dans le site.
11. Ne pas déployer `docs/`.

### (b) Structure, entreprise, professionnel

1. Consultation d'un avocat en propriété intellectuelle sur la revente par tirage au regard de L713-4 al. 2 et L713-3, et sur les visuels, après la qualification au titre des jeux d'argent.
2. Recherche d'antériorités, puis dépôt du nom et du logo (INPI, EUIPO).
3. Approvisionnement : cartes de première vente dans l'EEE, factures conservées, contrôle d'authenticité documenté.
4. Licences : données de catalogue (offre payante du successeur ou autre source), cotes (accord avec la place de marché, ou indice maison tiré des achats et ventes du site).
5. Figma : vérifier l'offre du compte, lire les « AI Terms » en entier, archiver les invites.
6. Ne pas compter sur une licence des titulaires pour un jeu d'argent ; prévoir la réponse à une mise en demeure (changement de nom et retrait des visuels en un jour : le code centralise déjà la marque).

## 5. Non vérifié / à confirmer

- Texte exact et en vigueur des articles du CPI, du RMUE et des directives cités ; points et dates des arrêts [NV].
- Existence de décisions EUIPO ou INPI contre des signes en « Poke… » ; portefeuille de marques de Nintendo dans l'UE (dont les noms de personnages) ; marques de la plateforme de jeux au nom voisin.
- Conditions d'utilisation de pokemontcg.io et de Scrydex (usage commercial, attribution, images) ; fermeture de l'hôte d'images.
- Conditions complètes de Cardmarket ; version en vigueur de celles de TCGplayer.
- « AI Terms » de Figma (clause de propriété, périmètre de la garantie) ; présence de métadonnées à la génération.
- Texte final de l'omnibus numérique (référence « règlement (UE) 2026/1744 » donnée par des sites de commentaire), lignes directrices sur l'article 50 (20 juillet 2026) et code de bonnes pratiques (10 juin 2026) [RR].
- Jurisprudence française sur les images générées par IA.
- Texte de la licence de Lucide ; noms français officiels des badges.
- Toute action des titulaires contre des sites d'ouverture de packs : rien trouvé, recherche courte.

## 6. Les trois risques les plus sérieux

1. **Nom en « Pok… » et identité bâtie sur l'univers Pokémon, pour un jeu d'argent** : mise en demeure, opposition, action en contrefaçon ou parasitisme. Réduit par un nom neutre, la purge du vocabulaire de l'univers (thèmes par type, Pack Évoli, badges) et un usage strictement descriptif du mot « Pokémon ».
2. **Illustrations de cartes** reproduites pour tout le catalogue et en décor, depuis un hôte non officiel qui ferme le 1er mars 2027. Réduit par des photos maison des seules cartes en stock, aucun usage décoratif, plus de chargement à chaud.
3. **Opposition du titulaire à une revente par tirage au sort** (motifs légitimes, atteinte à la renommée). Ne s'élimine pas sans licence ; se réduit par la sobriété dans l'usage de la marque, un stock d'origine EEE documenté, l'absence de toute communication vers les mineurs, la mention visible au point de vente et un avis d'avocat préalable. Il dépend d'abord de la qualification au titre des jeux d'argent.

## 7. Sources

Résultats de recherche [RR] :
- TGI Paris, 24 oct. 2001 : https://www.doctrine.fr/d/TGI/Paris/2001/INPIM20010825
- Mise en demeure de 2020 : https://www.nintendolife.com/news/2020/10/popular_twitch_and_tiktok_star_pokeprincxss_has_been_sued_by_nintendo ; https://bulbagarden.net/threads/nintendo-targets-influencer-over-use-of-pokemon-branding.282930/
- Opposition « Poké Go » (États-Unis, 2017) : https://briffa.com/blog/poke-trade-mark-wars
- Retrait d'un site de fans (2024) : https://www.techdirt.com/2024/03/28/site-that-listed-information-about-3rd-party-pokemon-fan-games-shuts-down-under-threat
- Marché des ouvertures de packs (avril 2026) : https://kotaku.com/pokemon-cards-gamestop-power-packs-digital-gambling-2000687494
- Politique des titulaires : https://www.pokemon.com/us/legal/copyright ; https://www.pokemon.com/us/legal/terms-of-use ; https://pokemon.gamespress.com/Media-Usage-Guidelines ; https://press.pokemon.com/en/Assets-Use-Terms
- API : https://docs.pokemontcg.io/ ; https://pokemontcg.io/ ; https://github.com/PokemonTCG/pokemon-tcg-data ; https://scrydex.com/faq
- Cotes : https://help.tcgplayer.com/hc/en-us/articles/360061115874-TCGplayer-API-Terms-Conditions ; https://help.cardmarket.com/en/cardmarket-api ; https://api.cardmarket.com/ws/documentation/API_2.0:PriceGuide
- Figma : https://www.figma.com/legal/ai-terms/ ; https://www.figma.com/aup/ ; https://help.figma.com/hc/en-us/articles/33558931634199-Request-AI-copyright-protection-for-your-organization
- Règlement IA, art. 50 : https://www.aiactblog.nl/en/posts/article-50-transparency-deadline-2-august-2026 ; https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/ ; https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/
- Images générées et droit d'auteur (sources contradictoires) : https://riant-avocat.fr/image-generee-ia-protection-droit-auteur/ ; https://iaavocat.com/blog/les-images-generees-par-ia-sont-elles-libres-de-droit-guide-2026 ; https://ledroit.ai/blog/ia-generative-et-photographie-ce-que-change-la-jurisprudence-2026
- Dior c/ Evora (texte anglais) : https://mansfield.bailii.org/eu/cases/EUECJ/1997/C33795.html

Textes et arrêts cités de mémoire [NV] — adresses non ouvertes :
- Code de la propriété intellectuelle : https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006069414/
- Code civil : https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070721/
- RMUE (UE) 2017/1001 : https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32017R1001
- Directive 2001/29/CE : https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32001L0029
- Directive 96/9/CE : https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:31996L0009
- Règlement (UE) 2024/1689 : https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689
- CJUE : C-337/95 (CELEX 61995CJ0337), C-63/97 (61997CJ0063), C-228/03 (62003CJ0228), C-487/07 (62007CJ0487), C-355/96 (61996CJ0355), C-414/99 (61999CJ0414), C-234/06 P (62006CJ0234), C-160/15 (62015CJ0160), C-392/19 (62019CJ0392), C-5/08 (62008CJ0005), C-145/10 (62010CJ0145) — forme : https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:<numéro>
- Lucide : https://lucide.dev/license ; SIL OFL : https://openfontlicense.org
