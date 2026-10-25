/**
 * Balance calculation.
 *
 * We NEVER store a current balance. A stored balance can go wrong
 * (for example after an edit or a delete). So we always calculate it:
 *   opening balance + income - expense + transfers in - transfers out
 * Loans and repayments move balances too: calculateBalancesWithLoans() adds them on top.
 */

import { getLoanBalanceEffects } from './loanEffects.js';

/**
 * Say how one transaction changes account balances.
 * The amount in a transaction is always positive; the type gives the sign.
 * @param {{type: string, amount: number, accountId: string, toAccountId?: string|null}} txn
 * @returns {Array<[string, number]>} Pairs of [accountId, change in paise].
 */
export function getTransactionEffects(txn) {
  switch (txn.type) {
    case 'income':
      return [[txn.accountId, txn.amount]];
    case 'expense':
      return [[txn.accountId, -txn.amount]];
    case 'transfer':
      return [
        [txn.accountId, -txn.amount],
        [txn.toAccountId, txn.amount],
      ];
    default:
      return [];
  }
}

/**
 * Calculate the balance of every account in one pass.
 * @param {Array<{id: string, openingBalance: number}>} accounts
 * @param {Array<object>} transactions
 * @returns {Object<string, number>} Paise by account id.
 */
export function calculateBalances(accounts, transactions) {
  const balances = {};
  for (const account of accounts) {
    balances[account.id] = account.openingBalance;
  }
  for (const txn of transactions) {
    for (const [accountId, change] of getTransactionEffects(txn)) {
      // Skip accounts we were not asked about.
      if (Object.hasOwn(balances, accountId)) balances[accountId] += change;
    }
  }
  return balances;
}

/**
 * Like calculateBalances(), plus the effect of lent / borrowed money. Loans are NOT transactions,
 * so they are a separate input: reports, budgets and CSV never see them.
 * @param {Array<{id: string, openingBalance: number}>} accounts
 * @param {Array<object>} transactions
 * @param {Array<object>} [loans=[]]
 * @param {Array<object>} [repayments=[]]
 * @returns {Object<string, number>} Paise by account id.
 */
export function calculateBalancesWithLoans(accounts, transactions, loans = [], repayments = []) {
  const balances = calculateBalances(accounts, transactions);
  for (const [accountId, change] of getLoanBalanceEffects(loans, repayments)) {
    if (Object.hasOwn(balances, accountId)) balances[accountId] += change;
  }
  return balances;
}

/**
 * Calculate the balance of one account.
 * @param {{id: string, openingBalance: number}} account
 * @param {Array<object>} transactions  All transactions (other accounts are ignored).
 * @returns {number} Paise.
 */
export function calculateBalance(account, transactions) {
  return calculateBalances([account], transactions)[account.id];
}

/**
 * Add up the balances of all active (not archived) accounts.
 * A credit card usually has a negative balance, so it lowers the total.
 * That is correct: it is money you owe.
 * @param {Array<{id: string, archived?: boolean}>} accounts
 * @param {Object<string, number>} balances  Result of calculateBalances().
 * @returns {number} Paise.
 */
export function calculateTotalBalance(accounts, balances) {
  return accounts
    .filter((account) => !account.archived)
    .reduce((sum, account) => sum + (balances[account.id] ?? 0), 0);
}
