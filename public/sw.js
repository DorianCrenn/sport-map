const CACHE_NAME   = 'sportlink-v3';
const DATA_CACHE   = 'sportlink-data-v3';  // Données Supabase REST
const IMG_CACHE    = 'sportlink-img-v3';   // Images Supabase Storage + logos
const OFFLINE_URL  = '/offline.html';

// NetworkFirst pour Supabase REST : essaie le réseau, fallback cache (pas de limite d'âge en offline)
async function supabaseNetworkFirst(request) {
  const cache = await caches.open(DATA_CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('offline — no cached data');
  }
}

// CacheFirst pour les images (logos, affiches)
async function imgCacheFirst(request) {
  const cache = await caches.open(IMG_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return new Response('', { status: 503 });
  }
}

// ── Install : pré-cache le shell ──────────────────────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll([OFFLINE_URL]))
  );
});

// ── Activate : purge anciens caches ──────────────────────────────────────────
self.addEventListener('activate', e => {
  const KEEP = new Set([CACHE_NAME, DATA_CACHE, IMG_CACHE]);
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !KEEP.has(k)).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // ── Supabase REST API : NetworkFirst + fallback cache ────────────────────
  if (url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.io')) {
    // Skip : auth, functions (Edge Functions), realtime (websockets)
    if (
      url.pathname.includes('/auth/') ||
      url.pathname.includes('/functions/') ||
      url.pathname.includes('/realtime/')
    ) return;

    // Supabase Storage (images, logos, affiches) → CacheFirst
    if (url.pathname.includes('/storage/')) {
      e.respondWith(imgCacheFirst(request));
      return;
    }

    // Supabase REST (events, clubs, profiles…) → NetworkFirst + offline fallback
    e.respondWith(supabaseNetworkFirst(request));
    return;
  }

  // ── Images CDN externes (logos clubs, Cloudflare CDN) ───────────────────
  if (
    url.hostname.includes('cloudflare') ||
    url.hostname.includes('cdninstagram') ||
    url.hostname.endsWith('.r2.dev')
  ) {
    e.respondWith(imgCacheFirst(request));
    return;
  }

  // Ne jamais intercepter les autres appels externes non listés
  if (url.origin !== self.location.origin) return;

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
