/* Cénacle : cache hors ligne. Changer VERSION à chaque publication pour forcer la mise à jour. */
const VERSION = 'cenacle-2026-10-27zl';
const CORE = ['./', './index.html', './vendor/three.min.js', './vendor/trystero-nostr.min.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png', './menu/art.jpg', './menu/th-jesus.jpg', './menu/th-apo.jpg', './i18n.js', './weapons.js', './armes.js'];
/* Première installation : activation immédiate. Mise à jour : on attend que le joueur clique « Mettre à jour » (message SKIP_WAITING). */
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => { if (!self.registration.active) return self.skipWaiting(); })); });
self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url); if (u.origin !== location.origin) return; if (u.pathname.startsWith('/api/')) return;
  const page = r.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('.html');
  if (page) { e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('./index.html')))); return; }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); } return res; })));
});
