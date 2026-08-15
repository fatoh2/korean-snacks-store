const CACHE_NAME = 'lulu-tokki-v4';
const PRECACHE_URLS = [
  '/', '/store', '/cart', '/manifest.json',
  '/icon-192-v3.png', '/icon-512-v3.png', '/icon-maskable-512-v3.png', '/apple-touch-icon-v3.png',
];

// Install: precache key pages
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for Firebase/API, cache-first for assets
self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (!url.startsWith('http') || event.request.method !== 'GET') return;
  // Skip Firebase/API calls
  if (url.includes('firestore.googleapis.com') || url.includes('firebase') || url.includes('googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      }).catch(() => cached);
      // For navigation requests prefer network; for assets prefer cache
      return event.request.mode === 'navigate' ? (fetchPromise || cached) : (cached || fetchPromise);
    })
  );
});
