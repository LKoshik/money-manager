/** The "More" card on Home: links to other screens. A new row = ONE line in LINKS. */

import { el } from '../../ui/dom.js';
import { listRow } from '../../ui/listRow.js';
import { navigate } from '../../ui/router.js';
import { sectionHeader } from './sectionHeader.js';

// show() decides from the state whether the row is visible.
const LINKS = [
  { icon: '🔁', title: 'Recurring', subtitle: 'Rent, salary, subscriptions', route: '/recurring', show: (state) => state.settings.recurringEnabled },
  { icon: '🎯', title: 'Goals', subtitle: 'Save toward a target', route: '/goals', show: () => true },
  { icon: '🤝', title: 'Lent & borrowed', subtitle: 'Money you gave or owe', route: '/lent', show: () => true },
];

/**
 * @param {{settings: object}} state
 * @returns {HTMLElement|null} The card, or null when no row is visible.
 */
export function moreLinks(state) {
  const visible = LINKS.filter((link) => link.show(state));
  if (visible.length === 0) return null;
  const rows = visible.map((link) =>
    listRow({ icon: link.icon, title: link.title, subtitle: link.subtitle, amount: '›', onClick: () => navigate(link.route) }),
  );
  return el('section', { className: 'stack' }, sectionHeader({ title: 'More' }), el('div', { className: 'list-card' }, ...rows));
}
