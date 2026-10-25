/** The Lent & borrowed screen: tabs, total, people (outstanding high to low), "New loan", settled people behind a toggle. */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { segmented } from '../../ui/segmented.js';
import { emptyState } from '../../ui/emptyState.js';
import { peopleList } from './peopleList.js';
import { openLoanSheet } from './loanSheet.js';
import { buildLoanRows, buildPeople, loanTotals } from '../../core/loanList.js';
import { headerLabel } from '../../core/loanText.js';
import { formatMoney } from '../../core/money.js';

const OPTIONS = [
  { id: 'lent', label: 'Lent to others' },
  { id: 'borrowed', label: 'Borrowed' },
];

function totalBlock(direction, amount) {
  return el(
    'section',
    { className: 'card total-card lent-total' },
    el('strong', { className: `total-amount ${direction === 'lent' ? 'amount--income' : 'amount--expense'}`, text: formatMoney(amount) }),
    el('span', { className: 'muted', text: headerLabel(direction) }),
  );
}

function emptyBlock(direction, hasSettled) {
  const lent = direction === 'lent';
  return emptyState({
    icon: 'swap',
    title: hasSettled ? 'Nothing outstanding' : lent ? 'Nobody owes you' : 'You owe nobody',
    message: lent ? 'Money you give to someone and expect back is tracked here, apart from your income and expenses.' : 'Money someone gives you and you must pay back is tracked here, apart from your income and expenses.',
    action: { label: 'New loan', icon: 'plus', onClick: () => openLoanSheet({ direction }) },
  });
}

/**
 * Build the screen.
 * @param {{loans: object[], repayments: object[]}} state
 * @param {{direction?: 'lent'|'borrowed', showSettled?: boolean, onDirection?: (id: string) => void,
 *   onToggleSettled?: () => void, now?: Date}} [options]
 * @returns {HTMLElement}
 */
export function buildView(state, { direction = 'lent', showSettled = false, onDirection = () => {}, onToggleSettled = () => {}, now = new Date() } = {}) {
  const rows = buildLoanRows(state.loans, state.repayments);
  const people = buildPeople(rows, direction);
  const open = people.filter((person) => !person.settled);
  const settled = people.filter((person) => person.settled);
  const totals = loanTotals(rows);
  const toggle = settled.length > 0 && button({ label: showSettled ? 'Hide settled' : `Show settled (${settled.length})`, variant: 'secondary', block: true, onClick: onToggleSettled });
  return el(
    'div',
    { className: 'stack' },
    segmented({ options: OPTIONS, value: direction, ariaLabel: 'Lent or borrowed', onChange: onDirection }),
    open.length === 0 ? emptyBlock(direction, settled.length > 0) : [totalBlock(direction, direction === 'lent' ? totals.toYou : totals.youOwe), peopleList(open, direction, now)],
    open.length > 0 && button({ label: 'New loan', icon: 'plus', variant: 'secondary', block: true, onClick: () => openLoanSheet({ direction }) }),
    toggle,
    showSettled && settled.length > 0 && peopleList(settled, direction, now),
  );
}
