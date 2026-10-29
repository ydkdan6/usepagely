const CACHE = 'usepagely-shell-v3';
const SHELL = ['/offline', '/library/downloads', '/fonts/montserrat-variable.ttf'];

async function cacheWithAssets(cache, url) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok || res.redirected) return;
  const html = await res.clone().text();
  await cache.put(url, res);
  const assets = [...new Set(html.match(/\/_next\/static\/[^"'\\ )]+/g) || [])];
  await Promise.all(assets.map((a) => cache.add(a).catch(() => {})));
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(SHELL.map((u) => cacheWithAssets(cache, u).catch(() => {})))
    )
  );
});

self.addEventListener('activate', (event) =>
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'cache-urls') return;
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(event.data.urls.map((u) => cacheWithAssets(cache, u).catch(() => {})))
    )
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response.ok && !response.redirected) {
          const copy = response.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return response;
      })
      .catch(async () => {
        const isNav = req.mode === 'navigate';
        const cached = await caches.match(req, { ignoreSearch: isNav });
        if (cached) return cached;
        if (isNav) return caches.match('/offline');
        return Response.error();
      })
  );
});