/** A small title with an optional link on the right ("Recent" + "See all"). */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';

/**
 * @param {{title: string, linkLabel?: string, onLink?: () => void}} config
 * @returns {HTMLElement}
 */
export function sectionHeader({ title, linkLabel, onLink }) {
  return el(
    'div',
    { className: 'section-header' },
    el('h2', { className: 'section-title', text: title }),
    linkLabel && button({ label: linkLabel, variant: 'ghost', onClick: onLink }),
  );
}
