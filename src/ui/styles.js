/**
 * Loads each feature's own styles.css while we develop.
 * In the final build all CSS is already inside index.html (the build script
 * sets __BUNDLED__), so this does nothing there.
 * Rule: a feature's folder name must be the same as its id.
 */

/**
 * @param {Array<{id: string}>} features
 * @returns {Promise<void>} Finishes when every file has loaded (or failed).
 */
export function loadFeatureStyles(features) {
  // typeof is safe even when the name does not exist.
  if (typeof __BUNDLED__ !== 'undefined') return Promise.resolve();
  const loading = features.map(
    (feature) =>
      new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `features/${feature.id}/styles.css`;
        link.onload = resolve;
        link.onerror = resolve; // a missing file must not stop the app
        document.head.append(link);
      }),
  );
  return Promise.all(loading).then(() => undefined);
}
