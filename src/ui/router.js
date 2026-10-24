/**
 * The router: shows the right feature screen for the current route.
 * It connects navigator.js (history logic) to the real browser and the page.
 * Screens call navigate(), back() and so on; they never touch the History API.
 */

import { createNavigator, parseRoute, pathFromHash } from './navigator.js';
import { emptyState } from './emptyState.js';

// Set once by startRouter(). Private to this file.
let navigator = null;

function requireNavigator() {
  if (!navigator) throw new Error('startRouter() must be called first');
  return navigator;
}

/** Draw one feature's screen. A broken screen shows a message instead of breaking the app. */
function mountScreen(feature, outlet, route) {
  const screen = document.createElement('div');
  screen.className = 'screen';
  outlet.replaceChildren(screen);
  outlet.scrollTop = 0;
  try {
    const cleanup = feature.render(screen, route);
    return typeof cleanup === 'function' ? cleanup : null;
  } catch (error) {
    console.error(error);
    screen.replaceChildren(
      emptyState({ icon: 'alert', title: 'This screen could not open', message: error.message }),
    );
    return null;
  }
}

/**
 * Start the router and show the first screen.
 * @param {{features: object[], outlet: HTMLElement,
 *   onChange: (info: {feature: object, isTab: boolean}) => void}} options
 *   onChange runs after every screen change (the shell updates its title and tabs).
 */
export function startRouter({ features, outlet, onChange }) {
  const byPath = new Map(features.map((feature) => [feature.route, feature]));
  let cleanup = null; // stops the old screen from listening to the store

  navigator = createNavigator({
    history: window.history,
    readRoute: () => pathFromHash(window.location.hash),
    listen: (handler) => window.addEventListener('popstate', handler),
    isKnownPath: (path) => byPath.has(path),
    onShow(route) {
      const { path, query } = parseRoute(route);
      const feature = byPath.get(path);
      try {
        cleanup?.();
      } catch (error) {
        console.error(error);
      }
      cleanup = mountScreen(feature, outlet, { path, query });
      onChange({ feature, isTab: feature.nav !== false });
    },
  });
  navigator.start();
}

/**
 * Open a screen (a new history entry).
 * @param {string} route  Example: "/accounts"
 * @param {{replace?: boolean}} [options]
 */
export const navigate = (route, options) => requireNavigator().navigate(route, options);

/** Switch to a tab. @param {string} route */
export const goToTab = (route) => requireNavigator().goToTab(route);

/** Go back one screen (the in-app back arrow). */
export const back = () => requireNavigator().back();

/**
 * Make a history entry for a modal or sheet, so the phone's Back button closes it.
 * @param {() => void} onClose  Called when Back closes it.
 * @returns {() => Promise<void>} Closes it from code.
 */
export const pushOverlay = (onClose) => requireNavigator().pushOverlay(onClose);
