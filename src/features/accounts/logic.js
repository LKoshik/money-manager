/** Turns the store data into what the Accounts screen shows. */

import { calculateBalancesWithLoans, calculateTotalBalance } from '../../core/balance.js';
import { splitAccounts } from '../../core/accountList.js';

/**
 * @param {{accounts: object[], transactions: object[], loans?: object[], repayments?: object[]}} state
 * @returns {{active: Array<{account: object, balance: number}>,
 *   archived: Array<{account: object, balance: number}>, total: number}}
 *   total counts active accounts only (a credit card lowers it).
 */
export function buildAccountsModel({ accounts, transactions, loans = [], repayments = [] }) {
  const balances = calculateBalancesWithLoans(accounts, transactions, loans, repayments);
  const { active, archived } = splitAccounts(accounts);
  const withBalance = (account) => ({ account, balance: balances[account.id] });
  return {
    active: active.map(withBalance),
    archived: archived.map(withBalance),
    total: calculateTotalBalance(accounts, balances),
  };
}
