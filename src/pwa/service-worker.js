const CACHE_NAME = 'cancerome-scanner-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  '/js/app.js',
  '/js/camera.js',
  '/js/hex-lookup.js',
  '/js/skin-calibration.js',
  '/js/body-mapper.js',
  '/js/splotch-analyzer.js',
  '/js/severity-scorer.js',
  '/js/doctor-router.js',
  '/js/timeline.js',
  '/js/cancerome-3d.js',
  '/js/export.js',
  '/data/cancer-types.json',
  '/data/body-regions.json',
  '/data/specialist-types.json',
  '/data/fitzpatrick-calibration.json',
  '/data/severity-rules.json',
  '/doctor-dashboard.html',
  '/dashboard.js'
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
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Cache-first for app assets, network-first for external
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
