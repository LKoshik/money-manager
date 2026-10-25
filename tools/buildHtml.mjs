/** Pure text steps of the build (no files, no esbuild), so they can be tested. */

/** Global CSS files, in the order the final page needs them. */
export const GLOBAL_CSS = [
  'tokens', 'theme-light', 'theme-dark', 'base', 'layout', 'components', 'lists', 'overlays', 'drawer', 'numpad', 'forms', 'charts',
].map((name) => `styles/${name}.css`);

/**
 * Paths (inside src/) of all CSS files in the final order:
 * global files first, then each feature's styles.css in registry order.
 * @param {Array<{id: string}>} features  Sorted like the app's registry.
 * @returns {string[]}
 */
export function cssPaths(features) {
  return [...GLOBAL_CSS, ...features.map((feature) => `features/${feature.id}/styles.css`)];
}

/**
 * A build number from the date, e.g. 20261024093015. It only has to be new every time.
 * @param {Date} date
 * @returns {string}
 */
export function makeVersion(date) {
  return date.toISOString().replace(/\D/g, '').slice(0, 14);
}

/** Replace text once, and fail loudly if it is not there (a silent miss would ship a broken app). */
function replaceOnce(text, find, replacement, label) {
  if (!text.includes(find)) throw new Error(`build: ${label} not found`);
  // A function replacement keeps "$&" and similar in minified code from being treated as special.
  return text.replace(find, () => replacement);
}

/**
 * Turn the development index.html into the final single file.
 * @param {string} template  Content of src/index.html.
 * @param {{css: string, js: string}} parts  Minified CSS and JavaScript to put inside.
 * @returns {string}
 */
export function makeHtml(template, { css, js }) {
  const script = '<script type="module" src="main.js"></script>';
  // "</script" inside inline code would end the tag early.
  const safeJs = js.replace(/<\/(script)/gi, '<\\/$1');
  let html = template.replace(/^[ \t]*<link data-dev-css[^>]*>\r?\n/gm, '');
  html = html.replace(/^[ \t]*<!-- data-dev-css[^>]*-->\r?\n/m, ''); // the comment that explains those links
  // manifest and icons sit in src/pwa/ while developing, next to index.html in dist/.
  html = html.replaceAll('href="pwa/', 'href="');
  html = replaceOnce(html, '</head>', `  <style>${css}</style>\n</head>`, '</head>');
  return replaceOnce(html, script, `<script type="module">${safeJs}</script>`, 'main.js script tag');
}

/**
 * Put the build number into the service worker.
 * @param {string} source  Content of src/pwa/sw.js.
 * @param {string} version
 * @returns {string}
 */
export function makeServiceWorker(source, version) {
  // With the quotes, so only the real value is replaced and never a comment that names it.
  return replaceOnce(source, "'__BUILD_VERSION__'", `'${version}'`, 'VERSION placeholder');
}
