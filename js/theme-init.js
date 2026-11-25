// Applique le thème enregistré avant le premier rendu (évite le flash clair/sombre).
// Script classique, volontairement minuscule et sans dépendance.
(function () {
  try {
    var raw = localStorage.getItem('pokiiiii.demo.v1');
    var theme = raw ? (JSON.parse(raw).settings || {}).theme : null;
    if (theme !== 'light' && theme !== 'dark') theme = 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
