const CACHE_NAME = 'vortex-v2.2.1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// Install: cache all assets
self.addEventListener('install', (e) => {
  // Skip waiting = activate immediately without waiting for old SW to die
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activate: delete OLD caches immediately
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME) // Delete anything that's not current version
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // Take control of all open tabs immediately
  );
});

// Fetch: Network-first for HTML, Cache-first for everything else
self.addEventListener('fetch', (e) => {
  const isHTML = e.request.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    // Always try network first for HTML pages → guarantees fresh content
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          // Update cache with fresh response
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request)) // Fallback to cache if offline
    );
  } else {
    // Cache-first for CSS/JS/fonts → fast loads
    e.respondWith(
      caches.match(e.request).then((cached) => {
        return cached || fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        });
      })
    );
  }
});

// Listen for SKIP_WAITING message from the page
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
