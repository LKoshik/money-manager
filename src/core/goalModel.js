/**
 * The math of ONE goal. Pure, integer paise only.
 * Saved money is always CALCULATED from the contributions, never stored.
 */

import { toDayKey } from './dates.js';

// Integer division that rounds up / down without float surprises.
const floorDiv = (a, b) => (a - (a % b)) / b;
const ceilDiv = (a, b) => floorDiv(a + b - 1, b);

/**
 * @param {Array<{type: string, amount: number}>} contributions  Of one goal.
 * @returns {number} Paise set aside: all "add" minus all "withdraw".
 */
export function saved(contributions) {
  return contributions.reduce((sum, item) => sum + (item.type === 'add' ? item.amount : -item.amount), 0);
}

/** @param {{targetAmount: number}} goal @param {number} savedAmount @returns {number} Paise still missing (never negative). */
export function remaining(goal, savedAmount) {
  return Math.max(0, goal.targetAmount - savedAmount);
}

/** @param {{targetAmount: number}} goal @param {number} savedAmount @returns {number} Whole percent, rounded DOWN (can pass 100). */
export function percent(goal, savedAmount) {
  return floorDiv(Math.max(0, savedAmount) * 100, goal.targetAmount);
}

/** @param {{targetAmount: number}} goal @param {number} savedAmount @returns {number} Percent for a progress bar, 0 to 100. */
export function barPercent(goal, savedAmount) {
  return Math.min(100, percent(goal, savedAmount));
}

/**
 * @param {{targetAmount: number, deadline: string|null}} goal
 * @param {number} savedAmount
 * @param {Date} [now=new Date()]
 * @returns {'active'|'reached'|'overdue'} A deadline day that is over (local time) means overdue.
 */
export function status(goal, savedAmount, now = new Date()) {
  if (savedAmount >= goal.targetAmount) return 'reached';
  if (goal.deadline && toDayKey(goal.deadline) < toDayKey(now.toISOString())) return 'overdue';
  return 'active';
}

/**
 * Calendar months (LOCAL) from this month to the deadline's month.
 * @param {{deadline: string|null}} goal
 * @param {Date} [now=new Date()]
 * @returns {number} 0 when there is no deadline, or it is this month or in the past.
 */
export function monthsLeft(goal, now = new Date()) {
  if (!goal.deadline) return 0;
  const deadline = new Date(goal.deadline);
  const months = (deadline.getFullYear() - now.getFullYear()) * 12 + deadline.getMonth() - now.getMonth();
  return Math.max(0, months);
}

/**
 * How much to set aside each month to reach the goal by its deadline.
 * @param {{targetAmount: number, deadline: string|null}} goal
 * @param {number} savedAmount
 * @param {Date} [now=new Date()]
 * @returns {number|null} Paise (rounded up), or null with no deadline, when reached or overdue.
 */
export function neededPerMonth(goal, savedAmount, now = new Date()) {
  if (status(goal, savedAmount, now) !== 'active' || !goal.deadline) return null;
  return ceilDiv(remaining(goal, savedAmount), Math.max(monthsLeft(goal, now), 1));
}

/**
 * The completedAt value a goal should have for this saved amount.
 * @param {{targetAmount: number, completedAt: string|null}} goal
 * @param {number} savedAmount
 * @param {Date} [now=new Date()]
 * @returns {string|null} The old stamp if already reached, a new one when just reached, null below the target.
 */
export function completionFor(goal, savedAmount, now = new Date()) {
  if (savedAmount < goal.targetAmount) return null;
  return goal.completedAt ?? now.toISOString();
}
