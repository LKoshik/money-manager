/** Words for the Lent & borrowed screens. Pure. */

import { formatMoney } from './money.js';

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

/**
 * @param {number|null} days  From daysToDue(): negative = overdue.
 * @returns {string} "Overdue 3 days", "Due today", "Due in 5 days", or "" when there is no due date.
 */
export function dueText(days) {
  if (days === null) return '';
  if (days < 0) return `Overdue ${plural(-days, 'day')}`;
  return days === 0 ? 'Due today' : `Due in ${plural(days, 'day')}`;
}

/** @param {'lent'|'borrowed'} direction @returns {string} The words after the amount in the header. */
export const headerLabel = (direction) => (direction === 'lent' ? 'still to get back' : 'still to pay');

/**
 * @param {'lent'|'borrowed'} direction
 * @param {number} amount  Paise.
 * @returns {string} "₹X still to get back" or "₹X still to pay".
 */
export function headerText(direction, amount) {
  return `${formatMoney(amount)} ${headerLabel(direction)}`;
}

/**
 * The small line on Home.
 * @param {{toYou: number, youOwe: number}} totals
 * @returns {string|null} Null when nothing is open (the line is hidden then).
 */
export function owedLine({ toYou, youOwe }) {
  if (toYou <= 0 && youOwe <= 0) return null;
  return `Owed to you ${formatMoney(toYou)} · You owe ${formatMoney(youOwe)}`;
}

/**
 * The second line of a person row.
 * @param {{settled: boolean, openCount: number}} person
 * @param {number|null} days  Days to the most urgent due date.
 * @returns {string}
 */
export function personSubtitle(person, days) {
  if (person.settled) return 'Settled';
  const base = plural(person.openCount, 'loan');
  return days === null ? base : `${base} · ${dueText(days)}`;
}

/** @param {{direction: string, amount: number}} loan @returns {string} "Lent ₹1,000.00" or "Borrowed ₹500.00" */
export function loanTitle(loan) {
  return `${loan.direction === 'lent' ? 'Lent' : 'Borrowed'} ${formatMoney(loan.amount)}`;
}
