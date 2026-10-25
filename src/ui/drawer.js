/**
 * The side menu (drawer): slides in from the left, lists the screens that have no tab, and closes by
 * tapping a row, the X, the dark area or the phone's Back button. Like a sheet it owns a history
 * entry, so Back closes it first and never leaves the app by accident.
 */

import { el } from './dom.js';
import { icon } from './icons.js';
import { pushOverlay, navigate } from './router.js';

function buildRow(item, currentRoute, onPick) {
  const attrs = { type: 'button' };
  if (item.route === currentRoute) attrs['aria-current'] = 'page';
  return el('button', { className: 'drawer-item', attrs, on: { click: () => onPick(item.route) } }, icon(item.icon, 22), el('span', { text: item.title }));
}

/**
 * Open the drawer.
 * @param {{items: Array<{route: string, title: string, icon: string}>, currentRoute: string, onClose?: () => void}} options
 *   onClose runs however it was closed.
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openDrawer({ items, currentRoute, onClose }) {
  const previousFocus = document.activeElement;
  let isOpen = true;
  const closeButton = el('button', { className: 'icon-btn drawer-close', attrs: { type: 'button', 'aria-label': 'Close menu' }, on: { click: () => close() } }, icon('close'));
  const rows = items.map((item) => buildRow(item, currentRoute, go));
  const panel = el(
    'div',
    { className: 'drawer-panel', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu', tabindex: '-1' } },
    el('div', { className: 'drawer-header' }, closeButton, el('span', { className: 'drawer-title', text: 'Menu' })),
    el('div', { className: 'drawer-items' }, ...rows),
  );
  const backdrop = el('div', { className: 'drawer-backdrop', on: { click: (event) => event.target === backdrop && close() } }, panel);
  const onKeyDown = (event) => event.key === 'Escape' && close();

  // Remove it from the page. Runs once, whichever way the drawer was closed.
  function finish() {
    if (!isOpen) return;
    isOpen = false;
    document.removeEventListener('keydown', onKeyDown);
    backdrop.remove();
    previousFocus?.focus?.();
    onClose?.();
  }

  const closeHistoryEntry = pushOverlay(finish); // finish runs when the phone's Back closes it

  async function close() {
    if (!isOpen) return;
    await closeHistoryEntry();
    finish();
  }

  // Close first, then open the screen, so Back from that screen returns to where we were.
  async function go(route) {
    await close();
    if (route !== currentRoute) navigate(route);
  }

  document.addEventListener('keydown', onKeyDown);
  document.body.append(backdrop);
  panel.focus();
  return { close, element: panel };
}
