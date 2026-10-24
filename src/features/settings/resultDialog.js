/** A small dialog with a few lines of text and an OK button. */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { openModal } from '../../ui/modal.js';

/**
 * Show a message the person has to dismiss.
 * @param {{title: string, lines: string[]}} options
 */
export function showResult({ title, lines }) {
  const content = el(
    'div',
    { className: 'stack' },
    ...lines.map((text) => el('p', { text })),
    button({ label: 'OK', block: true, onClick: () => modal.close() }),
  );
  const modal = openModal({ title, content });
}
