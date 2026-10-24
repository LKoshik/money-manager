/** Words that describe the charts, for screen readers (aria-label). */

import { formatMoney } from './money.js';

/**
 * Describe the spending pie in one sentence group.
 * @param {{total: number, hasData: boolean, slices: Array<{name: string, amount: number, percentLabel: string}>}} pie
 * @param {string} monthLabel  Example: "Oct 2026"
 * @returns {string}
 */
export function describePie(pie, monthLabel) {
  if (!pie.hasData) return `No spending in ${monthLabel}.`;
  const parts = pie.slices.map((s) => `${s.name} ${formatMoney(s.amount)}, ${s.percentLabel}`);
  return `Spending by category in ${monthLabel}. Total ${formatMoney(pie.total)}. ${parts.join('; ')}.`;
}

/**
 * Describe the income vs expense bars, month by month.
 * @param {Array<{fullLabel: string, income: number, expense: number}>} rows
 * @returns {string}
 */
export function describeBars(rows) {
  const parts = rows.map((r) => `${r.fullLabel}: income ${formatMoney(r.income)}, expense ${formatMoney(r.expense)}`);
  return `Income versus expense for the last ${rows.length} months. ${parts.join('; ')}.`;
}
