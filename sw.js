// Shoot & Edit Board: opens instantly from cache, quietly updates in the background, and handles Windows notification clicks.
const CACHE = 'shoot-board-v6';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;                       // data calls go straight to your Google Sheet
  const same = url.origin === location.origin;
  const fontsOrLibs = /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(url.host);
  if (!same && !fontsOrLibs) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: same });
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
// clicking a Windows notification (or its button) brings the app to the front and passes the action on
self.addEventListener('notificationclick', e => {
  const n = e.notification; n.close();
  const msg = Object.assign({ action: e.action || 'open' }, n.data || {});
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const c = list[0];
    if (c) { c.postMessage(msg); return c.focus(); }
    return self.clients.openWindow('./');
  }));
});
