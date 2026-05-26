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

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
