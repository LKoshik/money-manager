/** Actions for loans (lent / borrowed) and repayments. Re-exported by state/actions.js. Balances are calculated, so these only save the records. */

import { action } from './loaders.js';
import { loansRepo } from '../data/loansRepo.js';
import { repaymentsRepo } from '../data/repaymentsRepo.js';

/** Add a loan. @param {object} input See loansRepo.create. @returns {Promise<object>} The loan. */
export const addLoan = action(['loans'], (input) => loansRepo.create(input));

/** Change a loan (not its direction). @param {string} id @param {object} changes @returns {Promise<object>} */
export const updateLoan = action(['loans'], (id, changes) => loansRepo.update(id, changes));

/** Delete a loan and all its repayments; balances recalculate by themselves. @param {string} id */
export const removeLoan = action(['loans', 'repayments'], (id) => loansRepo.remove(id));

/** Add a repayment. @param {object} input See repaymentsRepo.add. @returns {Promise<{repayment: object, settled: boolean}>} */
export const addRepayment = action(['repayments'], (input) => repaymentsRepo.add(input));

/** Delete one repayment. @param {string} id */
export const removeRepayment = action(['repayments'], (id) => repaymentsRepo.remove(id));
