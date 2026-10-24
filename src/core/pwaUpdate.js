/** Small yes/no decisions for the offline cache and its updates (pure, so they can be tested). */

/**
 * Should the service worker be registered?
 * Not while developing (the files are not built, so there is no sw.js next to index.html).
 * @param {{bundled: boolean, supported: boolean, secure: boolean}} env
 *   bundled = this is the built app; supported = the browser has service workers;
 *   secure = https or localhost.
 * @returns {boolean}
 */
export function shouldRegisterWorker({ bundled, supported, secure }) {
  return Boolean(bundled && supported && secure);
}

/**
 * Is a freshly installed worker an UPDATE the person should be told about?
 * The very first install has no controller yet: that is not an update.
 * @param {{workerState: string, hasController: boolean}} info
 * @returns {boolean}
 */
export function isUpdateReady({ workerState, hasController }) {
  return workerState === 'installed' && hasController;
}
