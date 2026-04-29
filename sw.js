const APP_CACHE_NAME = 'sigsenegal-app-shell-v1';
const TILE_CACHE_NAME = 'sigsenegal-tile-cache-v1';

// Fichiers de l'application à mettre en cache lors de l'installation.
// Les chemins doivent être relatifs à l'origine, pour GitHub Pages c'est /<nom-du-repo>/.
const urlsToCache = [
  '/sigsenegal/',
  '/sigsenegal/index.html',
  '/sigsenegal/css/leaflet.css',
  '/sigsenegal/css/qgis2web.css',
  '/sigsenegal/css/fontawesome-all.min.css',
  '/sigsenegal/css/leaflet-measure.css',
  '/sigsenegal/js/leaflet.js',
  '/sigsenegal/js/leaflet-measure.js',
  '/sigsenegal/data/Region_1.js',
  '/sigsenegal/data/Departement_2.js',
  '/sigsenegal/data/Arrondissement_3.js',
  '/sigsenegal/data/Routes_4.js',
  '/sigsenegal/data/localites_5.js',
  '/sigsenegal/manifest.json',
  '/sigsenegal/images/icon-192.png',
  '/sigsenegal/images/icon-512.png'
];

// Événement d'installation : mise en cache de l'App Shell.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Mise en cache de l\'App Shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// Événement d'activation : nettoyage des anciens caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [APP_CACHE_NAME, TILE_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Événement de fetch : servir depuis le cache ou récupérer depuis le réseau.
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Stratégie pour les tuiles de carte (cache-first).
  if (requestUrl.hostname.includes('tile.openstreetmap.org') || requestUrl.hostname.includes('arcgisonline.com')) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // Stratégie pour les autres ressources (cache-first).
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});