/** Words for goal screens: progress, pace, deadline, history lines. Pure. */

import { formatMoney } from './money.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * @param {string} iso  The deadline.
 * @param {Date} [now=new Date()]
 * @returns {string} Example: "31 Dec" (the year is added when it is not this year).
 */
export function formatDeadline(iso, now = new Date()) {
  const date = new Date(iso);
  const text = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear() ? text : `${text} ${date.getFullYear()}`;
}

/** @param {{saved: number, percent: number, goal: {targetAmount: number}}} row @returns {string} "₹X of ₹Y · 40%" */
export function progressText(row) {
  return `${formatMoney(row.saved)} of ${formatMoney(row.goal.targetAmount)} · ${row.percent}%`;
}

/** @param {{saved: number, target: number, percent: number}} totals @returns {string} Same as progressText, for the totals card. */
export function totalsText(totals) {
  return `${formatMoney(totals.saved)} of ${formatMoney(totals.target)} · ${totals.percent}%`;
}

/**
 * The line under the progress bar.
 * @param {{status: string, neededPerMonth: number|null, goal: {deadline: string|null}}} row
 * @param {Date} [now=new Date()]
 * @returns {string}
 */
export function paceText(row, now = new Date()) {
  if (row.status === 'reached') return 'Goal reached';
  if (row.status === 'overdue') return 'Deadline passed';
  if (!row.goal.deadline) return 'No deadline';
  return `Needs ${formatMoney(row.neededPerMonth)} / month to reach by ${formatDeadline(row.goal.deadline, now)}`;
}

/** @param {{type: string, amount: number}} item @returns {string} "Added ₹500.00" or "Withdrew ₹200.00" */
export function contributionTitle(item) {
  return `${item.type === 'add' ? 'Added' : 'Withdrew'} ${formatMoney(item.amount)}`;
}
