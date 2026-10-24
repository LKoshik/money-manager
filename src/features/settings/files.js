/** Saving a file to the phone and picking a file from it. Browser jobs, so they live in the screen's folder. */

import { el } from '../../ui/dom.js';

const MAX_FILE_BYTES = 25 * 1024 * 1024; // a real backup is tiny; this only stops a wrong file from freezing the app

/**
 * Save text as a file (the browser puts it in Downloads).
 * @param {{filename: string, mime: string, text: string}} file
 */
export function downloadFile({ filename, mime, text }) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = el('a', { attrs: { href: url, download: filename } });
  document.body.append(link); // some browsers ignore clicks on links that are not in the page
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000); // not at once: the download may still be starting
}

/**
 * Let the person pick a backup file and read it as text.
 * @returns {Promise<string|null>} The text, or null if they cancelled. Rejects if the file is too big.
 */
export function pickTextFile() {
  return new Promise((resolve, reject) => {
    const input = el('input', { attrs: { type: 'file', accept: '.json,application/json' } });
    input.addEventListener('cancel', () => resolve(null));
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      if (file.size > MAX_FILE_BYTES) return reject(new Error('That file is too big to be a backup.'));
      file.text().then(resolve, reject);
    });
    input.click();
  });
}
