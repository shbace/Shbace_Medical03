/* Shbace Medical PWA service worker.
 * Relative scope keeps this compatible with GitHub Pages project URLs.
 */
'use strict';

const CACHE_PREFIX = 'shbace-medical-pwa-';
const CACHE_NAME = CACHE_PREFIX + 'v1';
const SCOPE = self.registration.scope;
const APP_SHELL = [
  new URL('./pwa-boot.html', SCOPE).href,
  new URL('./index.html', SCOPE).href,
  new URL('./manifest.webmanifest', SCOPE).href,
  new URL('./splash_icon.png', SCOPE).href
];

function isCacheable(response, requestUrl) {
  if (!response || !response.ok || response.type !== 'basic') return false;
  if (requestUrl.origin !== self.location.origin) return false;
  const length = Number(response.headers.get('content-length') || 0);
  return !length || length <= 30 * 1024 * 1024;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(APP_SHELL.map(async url => {
      try {
        const response = await fetch(new Request(url, { cache: 'reload' }));
        if (isCacheable(response, new URL(url))) await cache.put(url, response.clone());
      } catch (_) {
        // A missing shell asset must not prevent service-worker installation.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (isCacheable(response, url)) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch (_) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(request, { ignoreSearch: true }))
          || (await cache.match(new URL('./index.html', SCOPE).href))
          || (await cache.match(new URL('./pwa-boot.html', SCOPE).href))
          || new Response('Shbace Medical is unavailable offline. Open the app once while connected to the internet.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
      }
    })());
    return;
  }

  // Stale-while-revalidate for local app assets (scripts, CSS, images and data).
  if (['script', 'style', 'image', 'font', 'worker'].includes(request.destination)
      || /\.(?:js|css|png|jpe?g|webp|svg|woff2?|ttf|json)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      const refresh = fetch(request).then(async response => {
        if (isCacheable(response, url)) await cache.put(request, response.clone());
        return response;
      });
      if (cached) {
        event.waitUntil(refresh.catch(() => undefined));
        return cached;
      }
      try { return await refresh; }
      catch (_) {
        return new Response('', { status: 504, statusText: 'Offline asset unavailable' });
      }
    })());
  }
});
