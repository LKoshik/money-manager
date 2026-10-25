import { renderLive } from '../../ui/dom.js';
import { store } from '../../state/store.js';
import { buildView } from './view.js';

export const id = 'recurring';
export const title = 'Recurring';
export const icon = 'repeat';
export const route = '/recurring';
export const order = 70;
export const nav = false;
export const menu = 20;
/** The Recurring row is hidden while recurring transactions are switched off in Settings. */
export const menuVisible = (state) => state.settings.recurringEnabled;

/**
 * Draw the Recurring screen, and draw it again when the data changes.
 * The sheet is a separate overlay, so redrawing never disturbs typing.
 * @param {HTMLElement} container
 * @returns {() => void} Stops listening to the store.
 */
export function render(container) {
  return renderLive(container, store.subscribe, () => buildView(store.getState()));
}
