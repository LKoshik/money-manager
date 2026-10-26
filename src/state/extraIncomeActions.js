/** Actions for extra income. Re-exported by state/actions.js. Entries create or use income transactions, so both lists reload. */

import { action } from './loaders.js';
import { extraIncomesRepo } from '../data/extraIncomesRepo.js';

/** Record new extra income AND its income transaction. @param {object} input See extraIncomesRepo.createWithTransaction. @returns {Promise<object>} The entry. */
export const addExtraIncome = action(['extraIncomes', 'transactions'], (input) => extraIncomesRepo.createWithTransaction(input));

/** Use an income transaction that is already recorded. @param {object} input See extraIncomesRepo.linkTransaction. @returns {Promise<object>} The entry. */
export const linkExtraIncome = action(['extraIncomes'], (input) => extraIncomesRepo.linkTransaction(input));

/** Delete an entry (its income transaction stays). @param {string} id */
export const removeExtraIncome = action(['extraIncomes'], (id) => extraIncomesRepo.remove(id));
