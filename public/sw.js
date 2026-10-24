// Service Worker para soporte de Instalación de Aplicación PWA de Escritorio
const CACHE_NAME = 'proyectoafd-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Estrategia Network-first con fallback a red
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request) as Promise<Response>;
    })
  );
});
