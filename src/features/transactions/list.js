import { el } from '../../ui/dom.js';
import { emptyState } from '../../ui/emptyState.js';
import { transactionRow } from '../../ui/transactionRow.js';
import { openTransactionSheet } from '../../ui/transactionSheet.js';
import { formatDayLabel } from '../../core/dateLabels.js';
import { buildListModel } from './logic.js';

function buildGroup({ day, items }, model) {
  const rows = items.map((txn) =>
    transactionRow({
      txn,
      category: model.categoriesById.get(txn.categoryId),
      account: model.accountsById.get(txn.accountId),
      toAccount: model.accountsById.get(txn.toAccountId),
      onClick: () => openTransactionSheet({ transaction: txn }),
    }),
  );
  return el('section', {}, el('h3', { className: 'day-header', text: formatDayLabel(day) }), el('div', { className: 'list-card' }, ...rows));
}

/**
 * Build the list of transactions, grouped by day.
 * @param {object} state  The store state.
 * @param {() => void} onClear  Called by the "Clear filters" button of the no-match message.
 * @returns {HTMLElement}
 */
export function buildList(state, onClear) {
  const model = buildListModel(state);
  if (model.total === 0) {
    return emptyState({
      icon: 'list',
      title: 'No transactions yet',
      message: 'Tap the big + button to add your first one.',
    });
  }
  if (model.groups.length === 0) {
    return emptyState({
      icon: 'search',
      title: 'No matches',
      message: 'Nothing fits your search or filters.',
      action: { label: 'Clear filters', variant: 'secondary', onClick: onClear },
    });
  }
  return el('div', {}, ...model.groups.map((group) => buildGroup(group, model)));
}
