/** Keeps the Reports screen's own state (picked month, table switches) and redraws it. */

import { renderLive } from '../../ui/dom.js';
import { store } from '../../state/store.js';
import { buildReportModel } from '../../core/reportModel.js';
import { buildView } from './view.js';

/**
 * Draw the screen now and again on every store change.
 * The state lives in this closure: it survives redraws but not leaving the screen.
 * @param {HTMLElement} container
 * @returns {() => void} Stops listening to the store.
 */
export function createScreen(container) {
  const state = { monthKey: null, tables: { pie: false, bars: false }, animate: true };
  let redraw = () => {};
  const ui = {
    get tables() { return state.tables; },
    get animate() { return state.animate; },
    onMonth: (key) => { state.monthKey = key; redraw(); },
    onToggle: (name) => { state.tables[name] = !state.tables[name]; redraw(); },
  };
  const build = () => {
    const model = buildReportModel(store.getState(), state.monthKey);
    state.monthKey = model.monthKey; // remembers the clamped month
    const view = buildView(model, ui);
    state.animate = false; // bars only grow the first time
    return view;
  };
  return renderLive(container, (draw) => {
    // A redraw replaces the buttons, so the one that had focus is found again by its key.
    redraw = () => {
      const key = document.activeElement?.dataset?.focusKey;
      draw();
      const again = key && container.querySelector(`[data-focus-key="${key}"]:not(:disabled)`);
      if (again) again.focus();
    };
    return store.subscribe(redraw);
  }, build);
}
