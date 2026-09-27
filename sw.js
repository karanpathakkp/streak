const CACHE = 'streak-v6';
const FILES = ['./', './index.html', './manifest.json', './widget.js', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './img/active-0.png', './img/active-1.png', './img/active-2.png', './img/active-3.png', './img/active-4.png', './img/active-5.png', './img/active-6.png', './img/lazy-0.png', './img/lazy-1.png', './img/lazy-2.png', './img/lazy-3.png', './img/lazy-4.png', './img/lazy-5.png', './img/lazy-6.png', './img/fire-red.png', './img/fire-blue.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const cached = await c.match(e.request, {ignoreSearch:true});
    const fresh = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => cached);
    return cached || fresh;
  }));
});
