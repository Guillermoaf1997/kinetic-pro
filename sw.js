// sw.js - Caché Offline para entrenar sin cobertura
const CACHE_NAME = 'kinetic-pro-v2.1';
const ASSETS = [
  './',
  './index.html',
  './utils.js',
  './catalog.js',
  './engine.js',
  './timer.js',
  './charts.js',
  './app.js',
  './sync.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});