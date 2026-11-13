const CACHE = 'sobhati-v3';
const FILES = ['./', 'index.html', 'style.css', 'script.js', 'manifest.json', 'assets/skyline.svg', 'assets/corner.svg', 'assets/favicon.svg', 'assets/icon-192.png', 'assets/icon-512.png'];

self.addEventListener('install', (e) => {
  // كل ملف يُخزَّن على حدة حتى لا يفشل التثبيت كله بسبب ملف واحد
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(FILES.map((f) => c.add(f).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((n) => n !== CACHE).map((n) => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isNav = req.mode === 'navigate';
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const ok = res.ok || res.type === 'opaque';
        const cacheable = new URL(req.url).origin === location.origin || /fonts\.(googleapis|gstatic)\.com/.test(req.url);
        if (ok && cacheable) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
        return res;
      }).catch(() => (isNav ? caches.match('index.html') : Response.error()));
    })
  );
});
