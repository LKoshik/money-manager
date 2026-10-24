/** The latest transactions on Home. Tap one to edit it. */

import { el } from '../../ui/dom.js';
import { transactionRow } from '../../ui/transactionRow.js';
import { openTransactionSheet } from '../../ui/transactionSheet.js';
import { navigate } from '../../ui/router.js';
import { sectionHeader } from './sectionHeader.js';

/**
 * @param {{recent: object[], accountsById: Map<string, object>, categoriesById: Map<string, object>}} model
 * @returns {HTMLElement}
 */
export function recentList({ recent, accountsById, categoriesById }) {
  const header = sectionHeader({
    title: 'Recent',
    linkLabel: recent.length > 0 ? 'See all' : undefined,
    onLink: () => navigate('/transactions'),
  });
  if (recent.length === 0) {
    return el('section', { className: 'stack' }, header, el('p', { className: 'muted', text: 'No transactions yet. Tap + to add one.' }));
  }
  const rows = recent.map((txn) =>
    transactionRow({
      txn,
      category: categoriesById.get(txn.categoryId),
      account: accountsById.get(txn.accountId),
      toAccount: accountsById.get(txn.toAccountId),
      onClick: () => openTransactionSheet({ transaction: txn }),
    }),
  );
  return el('section', { className: 'stack' }, header, el('div', { className: 'list-card' }, ...rows));
}
