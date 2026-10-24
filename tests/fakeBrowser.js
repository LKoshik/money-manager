/**
 * A tiny fake of the browser's History API, for testing navigation in Node.
 * Like the real one: pushState cuts off "forward" entries, and back() is
 * asynchronous and then fires the popstate listeners.
 * Not a test itself (its name does not end with .test.js).
 */

/**
 * @param {string} [startRoute]  The route in the address when the app opens.
 * @param {object|null} [startState]  The history state of the first entry.
 * @returns {object} history, readRoute, listen, settle(), routes(), position()
 */
export function createFakeBrowser(startRoute = '', startState = null) {
  const entries = [{ state: startState, route: startRoute }];
  let index = 0;
  const listeners = [];
  const toRoute = (url, fallback) => (url === undefined ? fallback : String(url).replace(/^#/, ''));

  const history = {
    get state() {
      return entries[index].state;
    },
    pushState(state, _title, url) {
      const route = toRoute(url, entries[index].route);
      entries.splice(index + 1);
      entries.push({ state, route });
      index += 1;
    },
    replaceState(state, _title, url) {
      entries[index] = { state, route: toRoute(url, entries[index].route) };
    },
    back() {
      setTimeout(() => {
        if (index === 0) return;
        index -= 1;
        listeners.forEach((listener) => listener());
      }, 0);
    },
  };

  return {
    history,
    readRoute: () => entries[index].route,
    listen: (listener) => listeners.push(listener),
    /** Wait until pending back() calls have finished. */
    settle: () => new Promise((resolve) => setTimeout(resolve, 10)),
    routes: () => entries.map((entry) => entry.route),
    position: () => index,
  };
}
