/* Pokiiiii — service worker minimal (shell cache) */
const CACHE = 'pokiiiii-shell-v1';
const SHELL = [
  './',
  './index.html',
  './css/style.css',
  './manifest.webmanifest',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './js/main.js',
  './js/game.js',
  './js/ui.js',
  './js/shell-ui.js',
  './js/pokemon.js',
  './js/quests.js',
  './js/icons.js',
  './js/game-log.js',
  './js/minigame.js',
  './js/leaderboard.js',
  './js/data/types.js',
  './js/data/zones.js',
  './js/data/starters.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          const copy = res.clone();
          if (res.ok && request.url.startsWith(self.location.origin)) {
            caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    }),
  );
});
