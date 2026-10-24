/**
 * Theme: light, dark, or follow the phone.
 * The colors are CSS variables, so switching a theme only changes one
 * attribute on <html>. We also copy the background color to the browser's
 * theme-color tag, so the phone's status bar matches the app.
 */

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Decide which theme to show.
 * @param {'light'|'dark'|null} setting  null means "follow the phone".
 * @param {boolean} prefersDark  Does the phone use dark mode?
 * @returns {'light'|'dark'}
 */
export function resolveTheme(setting, prefersDark) {
  if (setting === 'light' || setting === 'dark') return setting;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Show a theme now.
 * @param {'light'|'dark'|null} setting
 * @returns {'light'|'dark'} The theme that is now shown.
 */
export function applyTheme(setting) {
  const theme = resolveTheme(setting, window.matchMedia(DARK_QUERY).matches);
  document.documentElement.dataset.theme = theme;
  const color = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();
  if (color) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  return theme;
}

/**
 * Apply the saved theme, and keep it up to date when the choice changes
 * or when the phone switches between light and dark.
 * @param {() => ('light'|'dark'|null)} getSetting  Reads the saved choice.
 * @param {(listener: Function) => Function} subscribe  Usually store.subscribe.
 */
export function initTheme(getSetting, subscribe) {
  let last = getSetting();
  applyTheme(last);
  subscribe(() => {
    const next = getSetting();
    if (next === last) return;
    last = next;
    applyTheme(next);
  });
  window.matchMedia(DARK_QUERY).addEventListener('change', () => applyTheme(getSetting()));
}
