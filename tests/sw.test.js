import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { makeServiceWorker } from '../tools/buildHtml.mjs';

const SOURCE = makeServiceWorker(readFileSync(new URL('../src/pwa/sw.js', import.meta.url), 'utf8'), 'v2');
const ORIGIN = 'https://me.github.io';

/** Run sw.js against a fake browser. Returns the handlers and the fake cache storage. */
function loadWorker(existingCaches = []) {
  const handlers = {};
  const store = new Map(existingCaches.map((name) => [name, new Map()]));
  const calls = { skipWaiting: 0, claim: 0, fetched: [] };
  const caches = {
    keys: async () => [...store.keys()],
    delete: async (name) => store.delete(name),
    open: async (name) => {
      if (!store.has(name)) store.set(name, new Map());
      const files = store.get(name);
      return {
        addAll: async (paths) => paths.forEach((path) => files.set(path, `file:${path}`)),
        match: async (request) => files.get(typeof request === 'string' ? request : new URL(request.url).pathname.replace(/^\/app\//, '') || './'),
      };
    },
  };
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type, fn) => (handlers[type] = fn),
    skipWaiting: () => calls.skipWaiting++,
    clients: { claim: async () => calls.claim++ },
  };
  const fetch = async (request) => (calls.fetched.push(request.url), 'network');
  runInNewContext(SOURCE, { self, caches, fetch, URL });
  return { handlers, store, calls };
}

const run = (handler, event) => {
  const waits = [];
  handler({ ...event, waitUntil: (p) => waits.push(p), respondWith: (p) => waits.push(p) });
  return Promise.all(waits);
};

test('install caches the app files under a versioned name', async () => {
  const { handlers, store } = loadWorker();
  await run(handlers.install, {});
  assert.deepEqual([...store.keys()], ['money-manager-v2']);
  assert.ok(store.get('money-manager-v2').has('index.html'));
  assert.ok(store.get('money-manager-v2').has('icons/icon-maskable-512.png'));
});

test('install does not skip waiting by itself (the person decides)', async () => {
  const { handlers, calls } = loadWorker();
  await run(handlers.install, {});
  assert.equal(calls.skipWaiting, 0);
});

test('SKIP_WAITING message activates the new worker; other messages do nothing', () => {
  const { handlers, calls } = loadWorker();
  handlers.message({ data: { type: 'other' } });
  handlers.message({ data: null });
  assert.equal(calls.skipWaiting, 0);
  handlers.message({ data: { type: 'SKIP_WAITING' } });
  assert.equal(calls.skipWaiting, 1);
});

test('activate deletes old money-manager caches only, keeps the current and foreign ones', async () => {
  const { handlers, store, calls } = loadWorker(['money-manager-v1', 'money-manager-v2', 'other-app']);
  await run(handlers.activate, {});
  assert.deepEqual([...store.keys()].sort(), ['money-manager-v2', 'other-app']);
  assert.equal(calls.claim, 1);
});

test('fetch ignores non-GET and other-origin requests', () => {
  const { handlers } = loadWorker();
  let answered = false;
  const event = (request) => ({ request, respondWith: () => (answered = true) });
  handlers.fetch(event({ method: 'POST', url: `${ORIGIN}/app/index.html` }));
  handlers.fetch(event({ method: 'GET', url: 'https://example.com/x.js' }));
  assert.equal(answered, false);
});

test('fetch answers from the cache first, a navigation falls back to index.html, then the network', async () => {
  const { handlers, calls } = loadWorker();
  await run(handlers.install, {});
  const ask = async (request) => {
    let answer;
    handlers.fetch({ request: { method: 'GET', ...request }, respondWith: (p) => (answer = p) });
    return answer;
  };
  assert.equal(await ask({ url: `${ORIGIN}/app/manifest.json`, mode: 'cors' }), 'file:manifest.json');
  assert.equal(await ask({ url: `${ORIGIN}/app/unknown-page`, mode: 'navigate' }), 'file:index.html');
  assert.equal(await ask({ url: `${ORIGIN}/app/other.png`, mode: 'cors' }), 'network');
  assert.deepEqual(calls.fetched, [`${ORIGIN}/app/other.png`]);
});
