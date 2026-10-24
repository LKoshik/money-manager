/**
 * Navigation with the History API.
 *
 * An installed PWA has no address bar and no browser back button. The phone's
 * own Back button still works, and it goes to the previous HISTORY ENTRY. So
 * every screen we open, and every modal or bottom sheet, gets a history entry.
 * Then Back closes the sheet first, then goes to the previous screen, and does
 * not close the app by accident.
 *
 * No DOM code here: the browser's tools are passed in, so tests can use a fake
 * browser. ui/router.js connects it to the real one.
 * Each history entry stores { depth } (entries below it), and overlays add { overlay: id }.
 */

const HOME = '/';

/**
 * Split a route like "/reports?month=2026-10" into its parts.
 * @param {string} text
 * @returns {{path: string, query: URLSearchParams}} The path always starts with "/", with no ending slash.
 */
export function parseRoute(text) {
  const [rawPath, search = ''] = String(text || '').split('?');
  const trimmed = rawPath.replace(/\/+$/, '');
  const path = trimmed.startsWith('/') ? trimmed || HOME : `/${trimmed}`;
  return { path, query: new URLSearchParams(search) };
}

/**
 * Get the route out of a location hash.
 * @param {string} hash  Example: "#/reports"
 * @returns {string} Example: "/reports"
 */
export function pathFromHash(hash) {
  return String(hash || '').replace(/^#/, '');
}

/**
 * Make a navigator.
 * @param {{history: History, readRoute: () => string, listen: (fn: Function) => void,
 *   onShow: (route: string) => void, isKnownPath?: (path: string) => boolean,
 *   home?: string}} deps
 *   readRoute reads the current route from the address; listen calls fn on every "popstate".
 * @returns {{start: Function, navigate: Function, goToTab: Function, back: Function,
 *   pushOverlay: Function, getCurrentPath: () => string}}
 */
export function createNavigator({ history, readRoute, listen, onShow, isKnownPath = () => true, home = HOME }) {
  const overlays = [];
  let overlayCounter = 0;
  let pendingClose = null;
  let currentPath = home;

  const depth = () => history.state?.depth ?? 0;

  function show(route) {
    const { path } = parseRoute(route);
    if (!isKnownPath(path)) return navigate(home, { replace: true });
    currentPath = path;
    return onShow(route);
  }

  /** Open a screen as a new history entry (so Back returns here), or swap the entry with replace: true. */
  function navigate(route, { replace = false } = {}) {
    const state = { depth: replace ? depth() : depth() + 1 };
    if (replace) history.replaceState(state, '', `#${route}`);
    else history.pushState(state, '', `#${route}`);
    show(route);
  }

  /**
   * Switch tab. Home stays below the other tabs, so Back from any tab goes Home.
   * Moving between two other tabs swaps the entry, so Back does not walk through every tab.
   */
  function goToTab(route) {
    if (parseRoute(route).path === currentPath) return;
    if (currentPath === home) navigate(route);
    else if (parseRoute(route).path === home && depth() === 1) history.back();
    else navigate(route, { replace: true });
  }

  /** The in-app back arrow. With nothing below us (a deep link), go Home instead of leaving. */
  function back() {
    if (depth() > 0) history.back();
    else navigate(home, { replace: true });
  }

  /**
   * Make a history entry for an overlay (modal or sheet).
   * @param {() => void} onClose  Called when the PHONE's Back button closes the overlay.
   * @returns {() => Promise<void>} Call it to close the overlay from your own code.
   *   (onClose is not called in that case.) Close the top overlay first.
   */
  function pushOverlay(onClose) {
    overlayCounter += 1;
    const id = `overlay-${overlayCounter}`;
    history.pushState({ depth: depth() + 1, overlay: id }, ''); // no URL: the address stays the same
    overlays.push({ id, onClose });
    return function closeOverlay() {
      const index = overlays.findIndex((overlay) => overlay.id === id);
      if (index === -1) return Promise.resolve(); // Back already closed it
      overlays.splice(index, 1);
      return new Promise((resolve) => {
        pendingClose = resolve;
        history.back();
      });
    };
  }

  function handlePopState() {
    if (pendingClose) {
      // We asked for this "back" ourselves, to remove an overlay's entry.
      const done = pendingClose;
      pendingClose = null;
      done();
      return;
    }
    const top = overlays[overlays.length - 1];
    if (top && history.state?.overlay !== top.id) {
      overlays.pop(); // Back was pressed while an overlay was open: close only the overlay
      top.onClose();
      return;
    }
    show(readRoute() || home);
  }

  /**
   * Make the first history entry correct, then show the first screen.
   * - Opened on a deep link (or after the app was restored): put Home below it.
   * - Page reloaded while an overlay entry was current: that overlay is gone, so make it a normal entry.
   */
  function normalizeFirstEntry(route) {
    const state = history.state;
    if (typeof state?.depth === 'number') {
      if (state.overlay) history.replaceState({ depth: state.depth }, '');
      return;
    }
    history.replaceState({ depth: 0 }, '', `#${home}`);
    if (parseRoute(route).path !== home) history.pushState({ depth: 1 }, '', `#${route}`);
  }

  function start() {
    const wanted = readRoute() || home;
    const route = isKnownPath(parseRoute(wanted).path) ? wanted : home;
    normalizeFirstEntry(route);
    listen(handlePopState);
    show(route);
  }

  return { start, navigate, goToTab, back, pushOverlay, getCurrentPath: () => currentPath };
}
