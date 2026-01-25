// 🔥 AUTO-UPDATE SERVICE WORKER
// Version changes on every build to force updates
// localStorage is NEVER touched - only cache is managed

const BUILD_VERSION = 'mku1am8m';
const BUILD_DATE = '2026-01-25T17:50:17.110Z';

const CACHE_VERSION = BUILD_VERSION;
const CACHE_NAME = 'yacht-manager-' + CACHE_VERSION;
const OFFLINE_URL = '/offline.html';

// Only cache essential static files (not API calls or dynamic content)
const ESSENTIAL_FILES = [
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache essential files and skip waiting immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new version:', CACHE_NAME);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential files');
        return cache.addAll(ESSENTIAL_FILES);
      })
      .then(() => {
        // CRITICAL: Skip waiting immediately to activate new SW
        console.log('[SW] Skip waiting - activating immediately');
        return self.skipWaiting();
      })
  );
});

// Activate event - delete ALL old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new version:', CACHE_NAME);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete ALL caches that aren't the current version
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // CRITICAL: Claim all clients immediately
        console.log('[SW] Claiming all clients');
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that update is complete
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
          });
        });
      })
  );
});

// Fetch event - NETWORK FIRST, cache fallback only for offline
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (API calls, CDN, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip Chrome extensions
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // NEVER cache API calls - always go to network
  if (url.pathname.includes('/api/') || url.pathname.endsWith('.php')) {
    event.respondWith(fetch(request));
    return;
  }

  // For app files: NETWORK FIRST with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Navigation request - show offline page
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }

          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Handle skip waiting message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

console.log('[SW] Service Worker loaded, version:', CACHE_VERSION);
