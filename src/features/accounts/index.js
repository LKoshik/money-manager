import { renderLive } from '../../ui/dom.js';
import { store } from '../../state/store.js';
import { buildView } from './view.js';

export const id = 'accounts';
export const title = 'Accounts';
export const icon = 'wallet';
export const route = '/accounts';
export const order = 50;
export const nav = false;

/**
 * Draw the Accounts screen, and draw it again when the data changes.
 * @param {HTMLElement} container
 * @returns {() => void} Stops listening to the store.
 */
export function render(container) {
  return renderLive(container, store.subscribe, () => buildView(store.getState()));
}
