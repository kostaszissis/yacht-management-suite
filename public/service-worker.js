const BUILD_VERSION = 'moab8bpp';
const BUILD_DATE = '2026-04-22T17:11:52.141Z';

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
