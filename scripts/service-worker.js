const CACHE = 'upskilling-__CACHE_VERSION__';
const PRECACHE = __PRECACHE_ASSETS__;
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('upskilling-') && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin)
    return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/assets/')) {
    // Build-hashed assets are immutable and can be served directly from cache.
    // Static asset bytes are identical for every same-origin request. Preview
    // servers may add Vary: Origin, while module loads send an Origin header.
    event.respondWith(
      caches
        .match(event.request, { ignoreVary: true })
        .then((cached) => cached || fetch(event.request)),
    );
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then(
            (cached) =>
              cached || (event.request.mode === 'navigate' ? caches.match('/') : undefined),
          )
          .then((response) => response || Response.error()),
      ),
  );
});
