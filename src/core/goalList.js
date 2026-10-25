/** Many goals at once: one row per goal with all its numbers, sorting, and totals. Pure. */

import { saved, remaining, percent, barPercent, status, monthsLeft, neededPerMonth } from './goalModel.js';

/**
 * @param {object[]} contributions  All contributions.
 * @returns {Map<string, number>} Saved paise per goal id.
 */
export function savedByGoal(contributions) {
  const groups = new Map();
  for (const item of contributions) groups.set(item.goalId, [...(groups.get(item.goalId) ?? []), item]);
  return new Map([...groups].map(([goalId, list]) => [goalId, saved(list)]));
}

/**
 * Everything a screen needs to draw each goal.
 * @param {object[]} goals
 * @param {object[]} contributions
 * @param {Date} [now=new Date()]
 * @returns {Array<{goal: object, saved: number, remaining: number, percent: number, barPercent: number,
 *   status: string, monthsLeft: number, neededPerMonth: number|null}>}
 */
export function buildGoalRows(goals, contributions, now = new Date()) {
  const totals = savedByGoal(contributions);
  return goals.map((goal) => {
    const amount = totals.get(goal.id) ?? 0;
    return {
      goal,
      saved: amount,
      remaining: remaining(goal, amount),
      percent: percent(goal, amount),
      barPercent: barPercent(goal, amount),
      status: status(goal, amount, now),
      monthsLeft: monthsLeft(goal, now),
      neededPerMonth: neededPerMonth(goal, amount, now),
    };
  });
}

const rank = (row) => (row.goal.archived ? 2 : row.status === 'reached' ? 1 : 0);
const dueTime = (row) => (row.goal.deadline ? Date.parse(row.goal.deadline) : Infinity);

function compareRows(a, b) {
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  if (dueTime(a) !== dueTime(b)) return dueTime(a) < dueTime(b) ? -1 : 1; // no deadline goes last
  if (a.percent !== b.percent) return b.percent - a.percent; // closer to done first
  return Date.parse(a.goal.createdAt) - Date.parse(b.goal.createdAt);
}

/**
 * Order: open goals by nearest deadline, then higher percent; reached goals next; archived last.
 * @param {Array<object>} rows  From buildGoalRows.
 * @returns {Array<object>} A new sorted list.
 */
export function sortGoalRows(rows) {
  return [...rows].sort(compareRows);
}

/**
 * Totals over the goals given (pass the non-archived rows).
 * @param {Array<{goal: {targetAmount: number}, saved: number, status: string}>} rows
 * @returns {{count: number, reachedCount: number, target: number, saved: number, percent: number,
 *   barPercent: number, status: 'active'|'reached'}}
 */
export function goalTotals(rows) {
  const target = rows.reduce((sum, row) => sum + row.goal.targetAmount, 0);
  const amount = rows.reduce((sum, row) => sum + row.saved, 0);
  const whole = target > 0 ? percent({ targetAmount: target }, amount) : 0;
  return {
    count: rows.length,
    reachedCount: rows.filter((row) => row.status === 'reached').length,
    target,
    saved: amount,
    percent: whole,
    barPercent: Math.min(100, whole),
    status: rows.length > 0 && rows.every((row) => row.status === 'reached') ? 'reached' : 'active',
  };
}
