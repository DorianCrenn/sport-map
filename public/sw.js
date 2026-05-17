const CACHE_NAME = 'sportlink-v2';
const SHELL = [
  '/',
  '/src/main.jsx',
];

self.addEventListener('install', e => {
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

// Network-first: try network, fall back to cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  // Never intercept OAuth callbacks — let Supabase PKCE exchange work natively
  const url = new URL(e.request.url);
  const isOAuthCallback = url.searchParams.has('code') || url.searchParams.has('error') || url.hash.includes('access_token');
  if (e.request.mode === 'navigate' && isOAuthCallback) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Handle scheduled notification messages from the main thread
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay, tag } = e.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: '/Logo-sportlink-sans-fond.png',
        badge: '/Logo-sportlink-sans-fond.png',
        tag,
        requireInteraction: false,
        data: { url: '/' },
      });
    }, Math.max(0, delay));
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow(e.notification.data?.url || '/');
    })
  );
});
