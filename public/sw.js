const CACHE_NAME   = 'sportlink-v3';
const OFFLINE_URL  = '/offline.html';

// ── Install : pré-cache le shell ──────────────────────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll([OFFLINE_URL]))
  );
});

// ── Activate : purge anciens caches ──────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ne jamais intercepter les appels Supabase / externes
  if (!url.origin.startsWith(self.location.origin)) return;

  // Ne jamais intercepter les callbacks OAuth (PKCE)
  const isOAuth = url.searchParams.has('code') || url.searchParams.has('error') || url.hash.includes('access_token');
  if (request.mode === 'navigate' && isOAuth) return;

  // Stale-while-revalidate pour les assets compilés (hash stable)
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Network-first pour la navigation (SPA shell = index.html)
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached ?? caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Network-first pour tout le reste
  e.respondWith(
    fetch(request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
        return res;
      })
      .catch(() => caches.match(request))
  );
});

async function staleWhileRevalidate(request) {
  const cache  = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(res => {
    cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  return cached ?? fetchPromise;
}

// ── Web Push ──────────────────────────────────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data?.json?.() ?? {};
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'SportLink', {
      body:               data.body  ?? '',
      icon:               '/Logo-sportlink-sans-fond.png',
      badge:              '/Logo-sportlink-sans-fond.png',
      tag:                data.tag   ?? 'sportlink-push',
      requireInteraction: false,
      data:               { url: data.url ?? '/' },
    })
  );
});

// ── Notifications locales ─────────────────────────────────────────────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay, tag } = e.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon:             '/Logo-sportlink-sans-fond.png',
        badge:            '/Logo-sportlink-sans-fond.png',
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
