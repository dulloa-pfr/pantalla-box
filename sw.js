/* Patagonia Fit — service worker
   La app queda cacheada: si se cae internet, la pantalla igual abre.
   Las sesiones de Google Sheets siempre se piden a la red (nunca del caché). */
const CACHE = 'pf-pantalla-v13';   /* subir este número en CADA cambio de index.html, si no el PC del box sigue mostrando la versión vieja */
const BASE = ['./', './index.html', './manifest.webmanifest',
              './config.js', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Datos del CMS y de Drive: SIEMPRE de la red, nunca del caché.
  // El tablero compartido es lo más cambiante del sistema: servir una copia
  // vieja haría que un computador creyera que ese es el estado actual y, al
  // tocar algo, publicara encima del bueno. Mejor fallar que mentir.
  if (url.pathname.includes('/api/') ||
      url.hostname.includes('docs.google.com') || url.hostname.includes('googleusercontent.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 504})));
    return;
  }
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
