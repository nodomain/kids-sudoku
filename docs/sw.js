const CACHE_NAME = 'kids-sudoku-fab2ae65';
const ASSETS = [
  "./",
  "./index.html",
  "./app.7c219381.js",
  "./sudoku.6f5d9ed4.js",
  "./sounds.a55c9509.js",
  "./style.3c882d8f.css",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Network-first for HTML (always get latest references to hashed assets)
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first for hashed assets (immutable content)
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
