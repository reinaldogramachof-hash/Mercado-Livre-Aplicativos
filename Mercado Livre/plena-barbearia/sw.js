
const CACHE_NAME = 'barber-manager-v5.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@0.378.0/dist/umd/lucide.js',
  'https://unpkg.com/lucide@latest',
  './lock.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cache => {
        if (cache !== CACHE_NAME) return caches.delete(cache);
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Strategy 0: API & Backend Calls (Network Only - Never Cache)
  if (url.pathname.includes('api_licenca_ml.php') || url.search.includes('action=')) {
    return; // Fallback to browser default (Network)
  }

  // Strategy 1: HTML (Network First - Garante updates de versão)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Strategy 2: Assets (Stale-While-Revalidate - Velocidade)
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => { });
      return cached || networkFetch;
    })
  );
});

// Mensageria: Permite o Frontend perguntar a versão
self.addEventListener('message', event => {
  if (event.data?.type === 'GET_VERSION') {
    const version = CACHE_NAME.split('-').pop();
    event.ports[0].postMessage({ type: 'VERSION', version: version });
  }
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
