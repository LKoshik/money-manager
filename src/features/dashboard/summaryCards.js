/** The month card (income, expense, how much was spent) and the strip of account cards. */

import { el } from '../../ui/dom.js';
import { openAccountSheet } from '../../ui/accountSheet.js';
import { navigate } from '../../ui/router.js';
import { sectionHeader } from './sectionHeader.js';
import { ACCOUNT_TYPE_INFO } from '../../core/accountList.js';
import { formatMoney } from '../../core/money.js';

function figure(label, amount, className) {
  return el(
    'div',
    { className: 'month-figure' },
    el('span', { className: 'muted', text: label }),
    el('strong', { className: `month-amount ${className}`, text: formatMoney(amount) }),
  );
}

function spentBar(percent) {
  if (percent === null) return null; // no income: a bar would say nothing
  const caption = percent > 100 ? 'Spent more than you earned' : `Spent ${percent}% of income`;
  const fill = el('div', { className: 'month-bar-fill', attrs: { style: `width:${Math.min(percent, 100)}%` } });
  const bar = el(
    'div',
    {
      className: 'month-bar',
      attrs: { role: 'progressbar', 'aria-label': caption, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.min(percent, 100)) },
    },
    fill,
  );
  return el('div', { className: 'stack month-bar-block' }, bar, el('span', { className: 'muted', text: caption }));
}

/**
 * This month's income and expense.
 * @param {{income: number, expense: number, spentPercent: number|null}} month
 * @returns {HTMLElement}
 */
export function monthCard(month) {
  return el(
    'section',
    { className: 'card stack' },
    el('h2', { className: 'section-title', text: 'This month' }),
    el('div', { className: 'month-figures' }, figure('Income', month.income, 'amount--income'), figure('Expense', month.expense, 'amount--expense')),
    spentBar(month.spentPercent),
  );
}

function accountChip({ account, balance }) {
  const info = ACCOUNT_TYPE_INFO[account.type];
  return el(
    'button',
    { className: 'account-chip', attrs: { type: 'button' }, on: { click: () => openAccountSheet({ account }) } },
    el('span', { className: 'account-chip-name', text: `${info.emoji} ${account.name}` }),
    el('strong', { className: `account-chip-balance${balance < 0 ? ' amount--expense' : ''}`, text: formatMoney(balance) }),
  );
}

/**
 * The accounts as small cards in a row. The row scrolls sideways when it is too long.
 * @param {Array<{account: object, balance: number}>} items Active accounts.
 * @returns {HTMLElement}
 */
export function accountStrip(items) {
  return el(
    'section',
    { className: 'stack' },
    sectionHeader({ title: 'Accounts', linkLabel: 'Manage', onLink: () => navigate('/accounts') }),
    el('div', { className: 'account-strip' }, ...items.map(accountChip)),
  );
}
