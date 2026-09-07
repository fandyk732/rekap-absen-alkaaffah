const CACHE_NAME = 'izin-alkaaffah-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Biarkan request berjalan standar via jaringan
  event.respondWith(fetch(event.request));
});