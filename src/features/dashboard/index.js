import { renderLive } from '../../ui/dom.js';
import { store } from '../../state/store.js';
import { buildView } from './view.js';

export const id = 'dashboard';
export const title = 'Home';
export const icon = 'home';
export const route = '/';
export const order = 10;

/**
 * Draw the home screen, and draw it again when the data changes.
 * @param {HTMLElement} container
 * @returns {() => void} Stops listening to the store.
 */
export function render(container) {
  return renderLive(container, store.subscribe, () => buildView(store.getState()));
}
