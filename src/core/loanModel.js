/** The numbers of ONE loan: how much is repaid, what is left, and when it is due. Pure. */

import { toDayKey } from './dates.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** @param {Array<{amount: number}>} repayments @returns {number} Paise. */
export const repaidAmount = (repayments) => repayments.reduce((sum, item) => sum + item.amount, 0);

/**
 * Outstanding is calculated, never stored.
 * @param {{amount: number}} loan
 * @param {Array<{amount: number}>} repayments  Only this loan's repayments.
 * @returns {number} Paise still to be paid. 0 means settled.
 */
export const outstandingOf = (loan, repayments) => loan.amount - repaidAmount(repayments);

/**
 * Whole days from "now" to the due day, counted on LOCAL days (so 11 PM and 1 AM are the same day).
 * @param {{dueDate: string|null}} loan
 * @param {number} outstanding  A settled loan has no due date to worry about.
 * @param {Date} [now=new Date()]
 * @returns {number|null} Negative = overdue, 0 = today, null = no due date or settled.
 */
export function daysToDue(loan, outstanding, now = new Date()) {
  if (!loan.dueDate || outstanding <= 0) return null;
  const toUtcDay = (key) => Date.UTC(...key.split('-').map((part, index) => (index === 1 ? Number(part) - 1 : Number(part))));
  // UTC math on plain day numbers: a daylight-saving shift can never add or remove a day.
  return Math.round((toUtcDay(toDayKey(loan.dueDate)) - toUtcDay(toDayKey(now.toISOString()))) / MS_PER_DAY);
}
