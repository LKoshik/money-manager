import { renderLive } from '../../ui/dom.js';
import { store } from '../../state/store.js';
import { buildView } from './view.js';

export const id = 'planner';
export const title = 'Planner';
export const icon = 'calendar';
export const route = '/planner';
export const order = 85;
export const nav = false;
export const menu = 35;

/**
 * Draw the Planner screen, and draw it again when the data changes.
 * The sheet is a separate overlay, so redrawing never disturbs typing.
 * @param {HTMLElement} container
 * @returns {() => void} Stops listening to the store.
 */
export function render(container) {
  return renderLive(container, store.subscribe, () => buildView(store.getState()));
}
