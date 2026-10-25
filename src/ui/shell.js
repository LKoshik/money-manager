/** The app shell: top bar (menu button or back arrow, and the title), the screen area, and the bottom navigation. */

import { el } from './dom.js';
import { icon } from './icons.js';
import { buildBottomNav } from './bottomNav.js';
import { openDrawer } from './drawer.js';
import { visibleMenu } from './featureRegistry.js';
import { back, goToTab } from './router.js';
import { store } from '../state/store.js';

/**
 * Build the shell inside the root element.
 * @param {HTMLElement} root
 * @param {{tabs: object[], quickAction: object|null, menu?: object[]}} registry  From buildRegistry().
 * @returns {{outlet: HTMLElement, update: (info: {feature: object, isTab: boolean}) => void}}
 *   outlet is where screens are drawn; update() is called after every screen change.
 */
export function buildShell(root, { tabs, quickAction, menu = [] }) {
  let currentRoute = '/';
  let drawer = null; // the open drawer, so a double tap cannot open two
  const title = el('h1', { className: 'topbar-title' });
  const backButton = el(
    'button',
    { className: 'icon-btn topbar-back', attrs: { type: 'button', 'aria-label': 'Back' }, on: { click: () => back() } },
    icon('back'),
  );
  const menuButton = el(
    'button',
    {
      className: 'icon-btn topbar-menu',
      attrs: { type: 'button', 'aria-label': 'Menu', 'aria-haspopup': 'dialog' },
      on: {
        click() {
          if (drawer) return;
          drawer = openDrawer({ items: visibleMenu(menu, store.getState()), currentRoute, onClose: () => { drawer = null; } });
        },
      },
    },
    icon('menu'),
  );
  backButton.hidden = true;
  const outlet = el('main', { className: 'outlet' });
  const nav = buildBottomNav({ tabs, quickAction, onTab: goToTab });

  root.replaceChildren(
    el('div', { className: 'shell' }, el('header', { className: 'topbar' }, menuButton, backButton, title), outlet, nav.element),
  );

  return {
    outlet,
    update({ feature, isTab }) {
      currentRoute = feature.route;
      title.textContent = feature.title;
      backButton.hidden = isTab; // main tabs have no back arrow; deeper screens do
      menuButton.hidden = !isTab || menu.length === 0; // the menu sits where the back arrow sits
      nav.setActive(feature.route);
    },
  };
}
