const CACHE_NAME = 'zies-kitchen-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/generated/zies-kitchen-icon.dim_192x192.png',
  '/assets/generated/zies-kitchen-icon.dim_512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache for better real-time data
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache the fetched response for static assets
        if (event.request.method === 'GET' && 
            (event.request.url.includes('/assets/') || 
             event.request.url.includes('.css') ||
             event.request.url.includes('.js') ||
             event.request.url.includes('.png') ||
             event.request.url.includes('.jpg') ||
             event.request.url.includes('.svg'))) {
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            
            // Return offline page or fallback
            return new Response(
              JSON.stringify({
                error: 'Offline',
                message: 'Tidak dapat terhubung ke server. Silakan periksa koneksi internet Anda.'
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'application/json'
                })
              }
            );
          });
      })
  );
});
