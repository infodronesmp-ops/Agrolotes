// AgroLotes — permite abrir la app sin internet.
// Estrategia: SIEMPRE intenta traer la versión nueva de internet (así las actualizaciones
// llegan solas) y, si no hay señal o tarda más de 4 segundos, abre la última copia guardada.
// Este archivo no hace falta tocarlo cuando se actualiza la app.
const CACHE = 'agrolotes-offline';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Firebase, fuentes, etc.: que sigan su camino
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const red = fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); return r; });
    const tope = new Promise(res => setTimeout(() => res(null), 4000));
    try {
      const r = await Promise.race([red, tope.then(async () => (await cache.match(req, {ignoreSearch: true})) || red)]);
      return r;
    } catch (err) {
      return (await cache.match(req, {ignoreSearch: true})) || (await cache.match('./')) || Response.error();
    }
  })());
});
