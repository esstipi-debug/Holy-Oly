/* Holy Oly · Volta · Service Worker
 * Push notifications minimal. No Workbox, no offline caching (por ahora).
 * Eventos:
 *  - install:           skipWaiting → toma control rápido
 *  - activate:          clients.claim → controla pestañas abiertas
 *  - push:              muestra notification con el payload JSON
 *  - notificationclick: focus / opens la URL del payload (o "/")
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

const SHELL_CACHE = 'ho-shell-v1';

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)))
      ),
    ])
  );
});

// Network-first para GET same-origin: online SIEMPRE sirve fresco (sin caches
// viejos trabados durante la iteración de UI), offline cae al cache (app shell).
// La API (cross-origin: holy-oly-3, fonts) y los POST pasan directo, sin tocar SW.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((c) => c || caches.match('/')))
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    // Fallback: payload no-JSON
    try {
      data = { title: 'Holy Oly', body: event.data ? event.data.text() : '' };
    } catch (_) {
      data = { title: 'Holy Oly', body: '' };
    }
  }

  const title = data.title || 'Holy Oly';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    image: data.image,
    tag: data.tag || 'holy-oly-default',
    renotify: data.renotify ?? false,
    requireInteraction: data.requireInteraction ?? false,
    silent: data.silent ?? false,
    data: {
      url: data.url || '/',
      ...data.data,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, le hacemos focus y navegamos
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            try { client.navigate(targetUrl); } catch (_) { /* ignore */ }
          }
          return client.focus();
        }
      }
      // Sino, abrimos ventana nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});
