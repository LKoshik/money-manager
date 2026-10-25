/** Rows, people and totals of the Lent & borrowed screen and the Home line. Pure. */

import { outstandingOf, repaidAmount } from './loanModel.js';

const time = (iso) => Date.parse(iso);

/**
 * One row per loan with its repayments and numbers.
 * @param {object[]} loans
 * @param {object[]} repayments
 * @returns {Array<{loan: object, repayments: object[], repaid: number, outstanding: number, settled: boolean}>}
 *   repayments are newest first.
 */
export function buildLoanRows(loans, repayments) {
  const byLoan = new Map();
  for (const item of repayments) byLoan.set(item.loanId, [...(byLoan.get(item.loanId) ?? []), item]);
  return loans.map((loan) => {
    const mine = (byLoan.get(loan.id) ?? []).sort((a, b) => time(b.date) - time(a.date));
    const outstanding = outstandingOf(loan, mine);
    return { loan, repayments: mine, repaid: repaidAmount(mine), outstanding, settled: outstanding <= 0 };
  });
}

/** @param {string} name @returns {string} "Ravi " and "ravi" are the same person. */
export const personKey = (name) => name.trim().toLowerCase();

/** Open loans first, then newest first. */
const openFirst = (a, b) => Number(a.settled) - Number(b.settled) || time(b.loan.date) - time(a.loan.date);

/**
 * Group the loans of one direction by person, outstanding high to low.
 * @param {ReturnType<typeof buildLoanRows>} rows
 * @param {'lent'|'borrowed'} direction
 * @returns {Array<{key: string, name: string, rows: object[], outstanding: number, openCount: number, settled: boolean}>}
 *   name is the spelling of the newest loan.
 */
export function buildPeople(rows, direction) {
  const groups = new Map();
  for (const row of rows.filter((item) => item.loan.direction === direction)) {
    const key = personKey(row.loan.person);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const people = [...groups].map(([key, list]) => {
    const sorted = [...list].sort(openFirst);
    const newest = [...list].sort((a, b) => time(b.loan.date) - time(a.loan.date))[0];
    const open = list.filter((row) => !row.settled);
    const outstanding = open.reduce((sum, row) => sum + row.outstanding, 0);
    return { key, name: newest.loan.person, rows: sorted, outstanding, openCount: open.length, settled: open.length === 0 };
  });
  return people.sort((a, b) => b.outstanding - a.outstanding || a.name.localeCompare(b.name));
}

/**
 * What is still open, both ways.
 * @param {ReturnType<typeof buildLoanRows>} rows
 * @returns {{toYou: number, youOwe: number}} Paise. toYou = lent and not yet back; youOwe = borrowed and not yet paid.
 */
export function loanTotals(rows) {
  const sum = (direction) =>
    rows.filter((row) => row.loan.direction === direction).reduce((total, row) => total + Math.max(row.outstanding, 0), 0);
  return { toYou: sum('lent'), youOwe: sum('borrowed') };
}

/**
 * Names for the quick-pick chips of the new loan sheet.
 * @param {object[]} loans
 * @param {number} [count=6]
 * @returns {string[]} Different people, the most recent first.
 */
export function recentPeople(loans, count = 6) {
  const seen = new Map();
  for (const loan of [...loans].sort((a, b) => time(b.createdAt) - time(a.createdAt))) {
    if (!seen.has(personKey(loan.person))) seen.set(personKey(loan.person), loan.person);
  }
  return [...seen.values()].slice(0, count);
}
