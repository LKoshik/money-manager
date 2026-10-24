/** Data protection card: is the browser promising to keep our data? */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { describeStorage } from '../../core/storageStatus.js';

/**
 * Build the data protection card.
 * @param {'checking'|'protected'|'unprotected'|'unsupported'} status
 * @param {() => void} onProtect  Called when the person taps "Protect my data".
 * @returns {HTMLElement}
 */
export function storageSection(status, onProtect) {
  const info = describeStorage(status);
  return el(
    'section',
    { className: 'card stack' },
    el('h2', { className: 'settings-title', text: 'Data protection' }),
    el('p', { className: `settings-storage settings-storage--${status}`, text: info.title }),
    info.message && el('p', { className: 'muted', text: info.message }),
    info.canProtect && button({ label: 'Protect my data', variant: 'secondary', block: true, onClick: onProtect }),
  );
}
