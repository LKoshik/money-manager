/**
 * Everything the Home screen needs, calculated from the store data.
 * Kept in core/ (no DOM) so it can be unit-tested.
 */

import { calculateBalancesWithLoans, calculateTotalBalance } from './balance.js';
import { buildLoanRows, loanTotals } from './loanList.js';
import { splitAccounts } from './accountList.js';
import { getCurrentMonthRange } from './dates.js';
import { getPeriodTotals } from './reports.js';

/** How many recent transactions Home shows. */
export const RECENT_COUNT = 6;

const time = (iso) => Date.parse(iso);

/** Newest first. Same time: the one created last comes first, so the order is stable. */
const newestFirst = (a, b) => time(b.date) - time(a.date) || time(b.createdAt) - time(a.createdAt);

/**
 * The latest transactions of any type (transfers too).
 * @param {object[]} transactions
 * @param {number} [count=RECENT_COUNT]
 * @returns {object[]}
 */
export function pickRecent(transactions, count = RECENT_COUNT) {
  return [...transactions].sort(newestFirst).slice(0, count);
}

/**
 * How much of this month's income was spent, as a whole percent.
 * Can be above 100 (spent more than earned). Null when there is no income:
 * a percent of nothing means nothing.
 * @param {{income: number, expense: number}} totals Paise.
 * @returns {number|null}
 */
export function spentPercent({ income, expense }) {
  return income > 0 ? Math.round((expense * 100) / income) : null;
}

/**
 * Build the Home model.
 * @param {{accounts: object[], transactions: object[], loans?: object[], repayments?: object[]}} state
 * @param {Date} [now=new Date()] Passed in so tests can control time.
 * @returns {{total: number, month: {income: number, expense: number, net: number, spentPercent: number|null},
 *   accounts: Array<{account: object, balance: number}>, recent: object[], owed: {toYou: number, youOwe: number}}}
 *   total and accounts count active accounts only and include loans; the month card never does.
 */
export function buildDashboardModel({ accounts, transactions, loans = [], repayments = [] }, now = new Date()) {
  const balances = calculateBalancesWithLoans(accounts, transactions, loans, repayments);
  const totals = getPeriodTotals(transactions, getCurrentMonthRange(now));
  return {
    total: calculateTotalBalance(accounts, balances),
    month: { ...totals, spentPercent: spentPercent(totals) },
    accounts: splitAccounts(accounts).active.map((account) => ({ account, balance: balances[account.id] })),
    recent: pickRecent(transactions),
    owed: loanTotals(buildLoanRows(loans, repayments)),
  };
}
