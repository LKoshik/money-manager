/** A grid of big tappable tiles where one can be selected (categories, accounts, colors...). */

import { el } from './dom.js';
import { icon } from './icons.js';

function buildTile(item, compact, onClick) {
  const attrs = { type: 'button', 'aria-label': item.label, 'aria-pressed': 'false' };
  if (item.color) attrs.style = `--choice-color:${item.color}`;
  return el(
    'button',
    { className: 'choice', attrs, on: { click: onClick } },
    item.icon !== undefined && el('span', { className: 'choice-icon', text: item.icon }),
    !compact && el('span', { className: 'choice-label', text: item.label }),
  );
}

function buildActionTile(action, compact) {
  return el(
    'button',
    { className: 'choice choice--action', attrs: { type: 'button', 'aria-label': action.label }, on: { click: action.onClick } },
    el('span', { className: 'choice-icon' }, icon('plus', 20)),
    !compact && el('span', { className: 'choice-label', text: action.label }),
  );
}

/**
 * Make a grid. It updates its own selection when a tile is tapped.
 * @param {{items: Array<{id: string, label: string, icon?: string, color?: string}>,
 *   selectedId?: string|null, onSelect: (id: string) => void, ariaLabel: string,
 *   columns?: number, compact?: boolean, action?: {label: string, onClick: () => void}}} config
 *   icon is an emoji ("" makes a plain color swatch). compact hides the labels.
 *   action adds a dashed "+" tile at the end (example: "New category").
 * @returns {HTMLElement}
 */
export function choiceGrid({ items, selectedId = null, onSelect, ariaLabel, columns = 4, compact = false, action = null }) {
  const tiles = new Map();
  const select = (id) => tiles.forEach((tile, tileId) => tile.setAttribute('aria-pressed', String(tileId === id)));
  for (const item of items) {
    tiles.set(item.id, buildTile(item, compact, () => { select(item.id); onSelect(item.id); }));
  }
  select(selectedId);
  const className = `choice-grid choice-grid--cols-${columns}${compact ? ' choice-grid--compact' : ''}`;
  return el('div', { className, attrs: { role: 'group', 'aria-label': ariaLabel } }, ...tiles.values(), action && buildActionTile(action, compact));
}
