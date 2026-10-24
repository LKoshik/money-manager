/** Keeps the Settings screen's own state (the storage status) and redraws it. */

import { renderLive } from '../../ui/dom.js';
import { showToast } from '../../ui/toast.js';
import { store } from '../../state/store.js';
import { checkStorage, protectStorage } from '../../state/actions.js';
import { buildView } from './view.js';

/**
 * Draw the screen now and again on every store change.
 * @param {HTMLElement} container
 * @returns {() => void} Stops listening. Late answers (the storage check) are ignored after that,
 *   because the container may already show another screen.
 */
export function createScreen(container) {
  const local = { storage: 'checking' };
  let redraw = () => {};
  let active = true;
  const setStorage = (value) => {
    if (!active) return;
    local.storage = value;
    redraw();
  };
  const handlers = {
    async onProtect() {
      const result = await protectStorage();
      setStorage(result);
      const message = result === 'protected' ? 'Your data is now protected.' : 'The browser did not agree yet. Installing the app on your home screen can help.';
      if (active) showToast(message);
    },
  };
  const stop = renderLive(container, (draw) => {
    redraw = draw;
    return store.subscribe(draw);
  }, () => buildView(store.getState(), local, handlers));
  checkStorage().then(setStorage);
  return () => {
    active = false;
    stop();
  };
}
