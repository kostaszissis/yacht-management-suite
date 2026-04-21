const BUILD_VERSION = 'mo8tsa9x';
const BUILD_DATE = '2026-04-21T16:15:44.133Z';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) {
        return caches.delete(name);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});
self.addEventListener('fetch', function(event) {});
