/**
 * A tiny store (publish/subscribe).
 * It holds the loaded data. Screens read from it and re-draw when it changes.
 * Only state/actions.js should write to it; screens only read and subscribe.
 */

import { SETTING_DEFAULTS } from '../core/validate.js';

/**
 * Make a store. (A function, so tests can make their own fresh store.)
 * @param {object} initialState
 * @returns {{getState: () => object, setState: (patch: object) => void,
 *   subscribe: (listener: (state: object) => void) => () => void}}
 */
export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,

    /**
     * Merge a patch into the state and tell the subscribers.
     * Nothing happens if no value really changed.
     */
    setState(patch) {
      const changed = Object.keys(patch).some((key) => !Object.is(state[key], patch[key]));
      if (!changed) return;
      state = { ...state, ...patch };
      for (const listener of [...listeners]) {
        try {
          listener(state);
        } catch (error) {
          console.error(error); // one broken screen must not stop the others
        }
      }
    },

    /** Listen for changes. Returns a function that stops listening. */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** The one store of the app. Lists hold ALL items, archived ones too. */
export const store = createStore({
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  settings: { ...SETTING_DEFAULTS },
});
