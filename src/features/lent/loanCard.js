/** One loan inside the person sheet: numbers, due text, repayments, and its buttons. */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { icon } from '../../ui/icons.js';
import { formatMoney } from '../../core/money.js';
import { toDayKey } from '../../core/dates.js';
import { formatDayLabel } from '../../core/dateLabels.js';
import { daysToDue } from '../../core/loanModel.js';
import { dueText, loanTitle } from '../../core/loanText.js';

function repaymentRow(item, accountName, onDelete) {
  const del = el('button', { className: 'repay-delete', attrs: { type: 'button', 'aria-label': `Delete repayment of ${formatMoney(item.amount)}` }, on: { click: onDelete } }, icon('close', 18));
  return el(
    'div',
    { className: 'repay-row' },
    el('span', { className: 'repay-main' }, el('span', { className: 'repay-title', text: `Repaid ${formatMoney(item.amount)}` }), el('span', { className: 'muted repay-sub', text: `${formatDayLabel(toDayKey(item.date))} · ${accountName(item.accountId)}` })),
    del,
  );
}

/**
 * @param {{loan: object, repayments: object[], outstanding: number, settled: boolean}} row
 * @param {{accountName: (id: string) => string, now: Date, onRepay: () => void, onDeleteLoan: () => void,
 *   onDeleteRepayment: (item: object) => void}} actions
 * @returns {HTMLElement}
 */
export function loanCard(row, { accountName, now, onRepay, onDeleteLoan, onDeleteRepayment }) {
  const { loan } = row;
  const days = daysToDue(loan, row.outstanding, now);
  const status = row.settled ? 'Settled' : `${formatMoney(row.outstanding)} left`;
  return el(
    'section',
    { className: 'card stack loan-card' },
    el('div', { className: 'loan-top' }, el('strong', { className: 'loan-title', text: loanTitle(loan) }), el('span', { className: `loan-status${row.settled ? ' loan-status--settled' : ''}`, text: status })),
    el('span', { className: 'muted loan-sub', text: `${formatDayLabel(toDayKey(loan.date), now)} · ${accountName(loan.accountId)}` }),
    days !== null && el('span', { className: `loan-due${days < 0 ? ' loan-due--overdue' : ''}`, text: dueText(days) }),
    loan.note && el('span', { className: 'muted loan-sub', text: loan.note }),
    !row.settled && button({ label: 'Add repayment', block: true, onClick: onRepay }),
    row.repayments.length > 0 && el('div', { className: 'list-card' }, ...row.repayments.map((item) => repaymentRow(item, accountName, () => onDeleteRepayment(item)))),
    button({ label: 'Delete loan', variant: 'danger', block: true, onClick: onDeleteLoan }),
  );
}
