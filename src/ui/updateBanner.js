/** A bar above the bottom nav: "A new version is ready" with Reload and Later buttons. */

import { el } from './dom.js';
import { button } from './button.js';

/**
 * Show the bar (only one at a time).
 * It is not a toast, because toasts ignore taps and this one has buttons.
 * @param {{onReload: Function}} options  onReload runs when the person taps Reload.
 */
export function showUpdateBanner({ onReload }) {
  if (document.querySelector('.update-banner')) return;
  const banner = el(
    'div',
    { className: 'update-banner', attrs: { role: 'status' } },
    el('span', { className: 'update-banner-text', text: 'A new version is ready.' }),
    button({ label: 'Later', variant: 'ghost', onClick: () => banner.remove() }),
    button({ label: 'Reload', variant: 'primary', onClick: onReload }),
  );
  document.body.append(banner);
}
