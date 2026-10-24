/** A card with a title and an optional "Show as table" switch (the text version of a chart). */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';

/**
 * Build a chart card.
 * @param {{title: string, toggle?: {key: string, on: boolean, onClick: () => void}}} config
 *   Leave out "toggle" when there is nothing to switch (for example an empty state).
 * @param {...(Node|Node[])} body
 * @returns {HTMLElement}
 */
export function chartSection({ title, toggle }, ...body) {
  let switchButton = null;
  if (toggle) {
    switchButton = button({ label: toggle.on ? 'Show chart' : 'Show as table', variant: 'ghost', onClick: toggle.onClick });
    switchButton.classList.add('chart-toggle');
    switchButton.dataset.focusKey = `toggle-${toggle.key}`; // lets the screen restore focus after a redraw
  }
  return el(
    'section',
    { className: 'card stack chart-card' },
    el('div', { className: 'chart-card-head' }, el('h2', { className: 'chart-card-title', text: title }), switchButton),
    ...body,
  );
}
