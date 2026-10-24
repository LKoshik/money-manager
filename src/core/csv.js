/**
 * Build the CSV text for "export transactions".
 * Pure function: it gets data in and gives text out. The download itself
 * (a DOM job) happens in the settings screen later.
 */

import { formatPlain } from './money.js';
import { toDayKey } from './dates.js';

const HEADER = ['Date', 'Type', 'Amount', 'Account', 'To account', 'Category', 'Note', 'Tags'];

/**
 * Make one value safe to put in a CSV cell.
 * - A cell that starts with = + - @ can run as a formula in Excel, which is a
 *   known attack. We put a ' in front so it stays plain text.
 * - A cell with a comma, quote or new line is wrapped in quotes.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Turn transactions into CSV text, oldest first.
 * Amounts are always positive; the Type column says income, expense or transfer.
 * @param {Array<object>} transactions
 * @param {Array<{id: string, name: string}>} accounts
 * @param {Array<{id: string, name: string}>} categories
 * @returns {string} Starts with a BOM so Excel reads rupee signs and emoji correctly.
 */
export function buildCsv(transactions, accounts, categories) {
  const accountNames = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
  const sorted = [...transactions].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  const rows = sorted.map((txn) => [
    toDayKey(txn.date) ?? '',
    txn.type,
    formatPlain(txn.amount),
    accountNames.get(txn.accountId) ?? '',
    accountNames.get(txn.toAccountId) ?? '',
    categoryNames.get(txn.categoryId) ?? '',
    txn.note,
    txn.tags.join('; '),
  ]);
  const lines = [HEADER, ...rows].map((row) => row.map(escapeCell).join(','));
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
