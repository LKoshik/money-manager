/** The big "Total balance" card. Home and Accounts both show it, so it lives in ui/. */

import { el } from './dom.js';
import { formatMoney } from '../core/money.js';

/**
 * Make the card.
 * @param {{total: number, note?: string}} config  total in paise (red when below zero, for example
 *   when credit card debt is bigger than your cash). note is an optional small line under the amount.
 * @returns {HTMLElement}
 */
export function totalCard({ total, note }) {
  return el(
    'section',
    { className: 'card total-card' },
    el('span', { className: 'muted', text: 'Total balance' }),
    el('strong', { className: `total-amount${total < 0 ? ' amount--expense' : ''}`, text: formatMoney(total) }),
    note && el('span', { className: 'muted', text: note }),
  );
}
