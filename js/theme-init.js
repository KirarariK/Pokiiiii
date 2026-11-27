// Applique le thème avant le premier affichage, pour éviter tout flash.
// Script classique, volontairement minuscule et sans dépendance.
// La clé et les identifiants doivent rester alignés avec js/data/themes.js.
(function () {
  var IDS = ['electrik', 'feu', 'eau', 'plante', 'psy', 'tenebres', 'dragon', 'glace', 'fee'];
  var root = document.documentElement;
  var theme = null;
  try {
    var saved = JSON.parse(localStorage.getItem('coffreo.theme.v1') || 'null');
    if (saved && IDS.indexOf(saved.id) !== -1) theme = saved.id;
  } catch (e) {
    theme = null;
  }
  if (!theme) {
    // Première visite : thème d'attente, le choix est proposé dès le chargement.
    root.setAttribute('data-theme-pending', '');
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'glace' : 'electrik';
  }
  root.setAttribute('data-theme', theme);
})();
