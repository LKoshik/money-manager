/** Starts the app: checks the browser, loads the data, builds the shell, shows the first screen. */

import * as featureModules from './features/index.js';
import { buildRegistry } from './ui/featureRegistry.js';
import { loadFeatureStyles } from './ui/styles.js';
import { buildShell } from './ui/shell.js';
import { startRouter } from './ui/router.js';
import { initTheme } from './ui/theme.js';
import { registerServiceWorker } from './ui/pwaUpdate.js';
import { emptyState } from './ui/emptyState.js';
import { store } from './state/store.js';
import { initApp } from './state/actions.js';

/** Stop with a clear message if the browser cannot run the app. */
function checkEnvironment() {
  if (!('indexedDB' in window)) {
    throw new Error('This browser cannot store data (IndexedDB is missing).');
  }
  if (!crypto?.randomUUID) {
    // Browsers only offer randomUUID on "secure" addresses.
    throw new Error('Open the app with https:// or http://localhost. Other http:// addresses are not secure enough.');
  }
}

/** Show a start-up problem with a Try again button. */
function showStartError(root, error, retry) {
  console.error(error);
  root.replaceChildren(
    emptyState({
      icon: 'alert',
      title: 'The app could not start',
      message: error.message,
      action: { label: 'Try again', onClick: retry },
    }),
  );
}

async function start(root) {
  try {
    checkEnvironment();
    const registry = buildRegistry(Object.values(featureModules));
    await Promise.all([loadFeatureStyles(registry.features), initApp()]);
    initTheme(() => store.getState().settings.theme, store.subscribe);
    const shell = buildShell(root, registry);
    startRouter({ features: registry.features, outlet: shell.outlet, onChange: shell.update });
    registerServiceWorker();
  } catch (error) {
    showStartError(root, error, () => start(root));
  }
}

start(document.getElementById('app'));
