/**
 * Service worker: keeps the app files in a cache so the app opens offline.
 * build.mjs puts a new number into VERSION on every build, so each build gets
 * its own cache and the browser sees sw.js as changed.
 * This is a plain script (not bundled), so it uses no imports.
 */
const VERSION = '__BUILD_VERSION__';
const PREFIX = 'money-manager-';
const CACHE = PREFIX + VERSION;
// Paths are relative to this file, so the app works under a GitHub Pages sub-path.
const SHELL = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];

// No skipWaiting() here: a new version waits until the person taps "Reload"
// (see the message handler), so an open form is never replaced under their hands.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
});

/** Remove caches of older builds (and only ours, never another app's). */
async function deleteOldCaches() {
  const names = await caches.keys();
  await Promise.all(names.filter((name) => name.startsWith(PREFIX) && name !== CACHE).map((name) => caches.delete(name)));
}

self.addEventListener('activate', (event) => {
  event.waitUntil(deleteOldCaches().then(() => self.clients.claim()));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/** Cache first; the app only talks to its own files, so the network is just a fallback. */
async function answer(request) {
  const cache = await caches.open(CACHE);
  // Opening the app from the icon can add a query string; ignore it.
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  if (request.mode === 'navigate') return (await cache.match('index.html')) || fetch(request);
  return fetch(request);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(answer(request));
});
