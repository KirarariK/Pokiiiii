/** Shell PWA Nindō — network-first, sans modifier les Request (sinon les modules ES bloquent). */
const CACHE = 'nindo-shell-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (e.request.method !== 'GET') return;

  // Scripts / CSS / data JSON : réseau pur, Request intacte (critique pour type=module)
  const p = url.pathname;
  if (
    p.endsWith('.js') ||
    p.endsWith('.mjs') ||
    p.endsWith('.css') ||
    p.endsWith('.json') ||
    p.includes('/js/') ||
    p.includes('/css/')
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // HTML / shell : réseau puis cache
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((c) => c || caches.match('./index.html'))),
  );
});
