/** Theme choice: Light, Dark, or follow the phone. */

import { el } from '../../ui/dom.js';
import { segmented } from '../../ui/segmented.js';
import { setTheme } from '../../state/actions.js';

const OPTIONS = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'Follow my phone' },
];

/**
 * Build the theme card.
 * @param {{theme: 'light'|'dark'|null}} settings
 * @returns {HTMLElement}
 */
export function themeSection(settings) {
  return el(
    'section',
    { className: 'card stack' },
    el('h2', { className: 'settings-title', text: 'Theme' }),
    segmented({
      options: OPTIONS,
      value: settings.theme ?? 'system', // null means "not chosen": the phone decides
      ariaLabel: 'Theme',
      onChange: (id) => setTheme(id === 'system' ? null : id),
    }),
  );
}
