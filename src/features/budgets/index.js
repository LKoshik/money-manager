import { renderLive } from '../../ui/dom.js';
import { store } from '../../state/store.js';
import { buildView } from './view.js';

export const id = 'budgets';
export const title = 'Budgets';
export const icon = 'target';
export const route = '/budgets';
export const order = 30;
export const nav = true;

/**
 * Draw the Budgets screen, and draw it again when the data changes.
 * The limit sheet is a separate overlay, so redrawing the screen never disturbs typing.
 * @param {HTMLElement} container
 * @returns {() => void} Stops listening to the store.
 */
export function render(container) {
  return renderLive(container, store.subscribe, () => buildView(store.getState()));
}
