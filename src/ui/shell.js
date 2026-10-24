/** The app shell: top bar (title and back arrow), the screen area, and the bottom navigation. */

import { el } from './dom.js';
import { icon } from './icons.js';
import { buildBottomNav } from './bottomNav.js';
import { back, goToTab } from './router.js';

/**
 * Build the shell inside the root element.
 * @param {HTMLElement} root
 * @param {{tabs: object[], quickAction: object|null}} registry  From buildRegistry().
 * @returns {{outlet: HTMLElement, update: (info: {feature: object, isTab: boolean}) => void}}
 *   outlet is where screens are drawn; update() is called after every screen change.
 */
export function buildShell(root, { tabs, quickAction }) {
  const title = el('h1', { className: 'topbar-title' });
  const backButton = el(
    'button',
    { className: 'icon-btn topbar-back', attrs: { type: 'button', 'aria-label': 'Back' }, on: { click: () => back() } },
    icon('back'),
  );
  backButton.hidden = true;
  const outlet = el('main', { className: 'outlet' });
  const nav = buildBottomNav({ tabs, quickAction, onTab: goToTab });

  root.replaceChildren(
    el('div', { className: 'shell' }, el('header', { className: 'topbar' }, backButton, title), outlet, nav.element),
  );

  return {
    outlet,
    update({ feature, isTab }) {
      title.textContent = feature.title;
      backButton.hidden = isTab; // main tabs have no back arrow; deeper screens do
      nav.setActive(feature.route);
    },
  };
}
