// Inventaire publié avec le site.
//
// null : aucun inventaire réel n'a encore été publié, le site tourne sur le
// stock de démonstration (quelques exemplaires de chaque carte de js/data/cards.js).
//
// Pour publier un inventaire : dans l'espace admin, onglet Stock, « Exporter »,
// puis coller ici le contenu du fichier (objet { items: { identifiant: { q, c?, p? } } }).
// En production, l'inventaire vit côté serveur et ce fichier disparaît.

export const PUBLISHED_STOCK = null;
