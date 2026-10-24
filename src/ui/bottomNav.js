/** The bottom navigation bar: the tabs, and the big "+" button in the middle. */

import { el } from './dom.js';
import { icon } from './icons.js';

function buildTab(tab, onTab) {
  return el(
    'button',
    { className: 'tab', attrs: { type: 'button' }, on: { click: () => onTab(tab.route) } },
    icon(tab.icon),
    el('span', { text: tab.tabLabel ?? tab.title }),
  );
}

function buildQuickAction(action) {
  return el(
    'div',
    { className: 'fab-slot' },
    el(
      'button',
      { className: 'fab', attrs: { type: 'button', 'aria-label': action.title }, on: { click: () => action.open() } },
      icon(action.icon ?? 'plus', 28),
    ),
  );
}

/**
 * Build the bar. The "+" goes in the middle of the tabs.
 * @param {{tabs: object[], quickAction: object|null, onTab: (route: string) => void}} options
 * @returns {{element: HTMLElement, setActive: (route: string) => void}}
 */
export function buildBottomNav({ tabs, quickAction, onTab }) {
  const buttons = new Map(tabs.map((tab) => [tab.route, buildTab(tab, onTab)]));
  const items = [...buttons.values()];
  const middle = Math.floor(items.length / 2);
  const element = el(
    'nav',
    { className: 'bottom-nav', attrs: { 'aria-label': 'Main' } },
    ...items.slice(0, middle),
    quickAction && buildQuickAction(quickAction),
    ...items.slice(middle),
  );

  return {
    element,
    /** Mark one tab as the current page. Pass a route that is not a tab to mark none. */
    setActive(route) {
      for (const [tabRoute, node] of buttons) {
        if (tabRoute === route) node.setAttribute('aria-current', 'page');
        else node.removeAttribute('aria-current');
      }
    },
  };
}
