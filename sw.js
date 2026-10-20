/** Shell PWA — JS/CSS toujours en network-first pour éviter les vieux builds en cache. */
const CACHE = 'pokiiiii-shell-v3';
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

  const path = url.pathname;
  const isCode =
    path.endsWith('.js') ||
    path.endsWith('.mjs') ||
    path.endsWith('.css') ||
    path.includes('/js/') ||
    path.includes('/css/');

  // Code : toujours le réseau d’abord (sinon l’ancien main.js reste éternellement)
  if (isCode) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then((res) => res)
        .catch(() => caches.match(e.request)),
    );
    return;
  }

  // Shell : network puis fallback cache
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request)),
  );
});
