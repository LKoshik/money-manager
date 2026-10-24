/**
 * Registers the service worker (offline mode) and tells the person when a
 * new version of the app is ready. The new version is only used after they tap Reload.
 */

import { shouldRegisterWorker, isUpdateReady } from '../core/pwaUpdate.js';
import { showUpdateBanner } from './updateBanner.js';

/** Switch to the waiting worker, then reload once it has taken over. */
function applyUpdate(worker) {
  // Reload only AFTER the switch, or the page would still load the old files.
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
  worker.postMessage({ type: 'SKIP_WAITING' });
}

function offerUpdate(worker) {
  showUpdateBanner({ onReload: () => applyUpdate(worker) });
}

function watchForUpdates(registration) {
  const hasController = () => Boolean(navigator.serviceWorker.controller);
  if (registration.waiting && hasController()) offerUpdate(registration.waiting);
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (isUpdateReady({ workerState: worker.state, hasController: hasController() })) offerUpdate(worker);
    });
  });
  // A phone app can stay open for days, so look for news whenever it comes back to the front.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') registration.update().catch(() => {});
  });
}

/**
 * Register the service worker and start watching for updates.
 * Does nothing in development. Problems are logged, never shown: the app works without offline mode.
 * @returns {Promise<void>}
 */
export async function registerServiceWorker() {
  const env = {
    bundled: typeof __BUNDLED__ !== 'undefined',
    supported: 'serviceWorker' in navigator,
    secure: window.isSecureContext,
  };
  if (!shouldRegisterWorker(env)) return;
  try {
    // Relative path: works under https://name.github.io/repo/ as well as at a domain root.
    watchForUpdates(await navigator.serviceWorker.register('sw.js', { scope: './' }));
  } catch (error) {
    console.warn('Offline mode is not available:', error);
  }
}
