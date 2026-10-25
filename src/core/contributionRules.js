/** The rules for adding and deleting contributions, checked BEFORE anything is saved. Pure. */

import { saved } from './goalModel.js';
import { formatMoney } from './money.js';
import { CONTRIBUTION_TYPES } from './validateGoals.js';
import { isPaise } from './validateParts.js';

/**
 * @param {object[]} existing  The contributions already in this goal.
 * @param {{type: string, amount: number}} input
 * @returns {string[]} Problems in plain words (empty = fine). A withdraw can never be more than saved.
 */
export function checkNewContribution(existing, input) {
  if (!CONTRIBUTION_TYPES.includes(input.type)) return ['Choose add or withdraw.'];
  if (!isPaise(input.amount) || input.amount <= 0) return ['Enter an amount above zero.'];
  const have = saved(existing);
  if (input.type === 'withdraw' && input.amount > have) {
    return [`You only have ${formatMoney(have)} set aside in this goal.`];
  }
  return [];
}

/**
 * Deleting an "add" could leave the withdrawals bigger than the money added.
 * @param {object[]} existing  The contributions of the goal.
 * @param {string} id  The contribution to delete.
 * @returns {string[]} Problems in plain words (empty = fine).
 */
export function checkRemoval(existing, id) {
  if (!existing.some((item) => item.id === id)) return ['This entry no longer exists.'];
  if (saved(existing.filter((item) => item.id !== id)) < 0) {
    return ["You can't delete this: you already withdrew some of it. Delete the withdrawal first."];
  }
  return [];
}
