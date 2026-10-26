/**
 * The "available to assign" money of the planner. Pure, integer paise only.
 * Everything here is CALCULATED on the fly: nothing is stored and nothing needs a month-end job.
 *
 *   stack     = allowances of all PAST months + wishes part of extra income - assigned to goals
 *   available = stack + this month's allowance
 *
 * "Assigned to goals" = goal contributions made since the planner was first set up.
 * Money added to goals BEFORE that is not counted (it was never part of the planner), and a withdrawal
 * can only give back what was assigned (each goal counts for 0 at least), so old goals cannot inflate the stack.
 */

import { currentMonthKey, monthAllowance } from './planModel.js';
import { shiftMonthKey } from './monthNav.js';
import { totalExtraWishes } from './extraIncome.js';
import { formatMoney } from './money.js';

/** @param {Array<{createdAt: string}>} plans @returns {string|null} When the planner was first set up (the oldest version), or null. */
export function plannerStart(plans) {
  return plans.reduce((first, plan) => (first === null || Date.parse(plan.createdAt) < Date.parse(first) ? plan.createdAt : first), null);
}

/**
 * @param {Array<{goalId: string, type: string, amount: number, date: string}>} contributions  All goals.
 * @param {string} startIso  Only contributions made at or after this moment count.
 * @returns {number} Paise assigned to goals (per goal: adds minus withdrawals, never below 0).
 */
export function assignedToGoals(contributions, startIso) {
  const start = Date.parse(startIso);
  const perGoal = new Map();
  for (const item of contributions) {
    if (Date.parse(item.date) < start) continue;
    perGoal.set(item.goalId, (perGoal.get(item.goalId) ?? 0) + (item.type === 'add' ? item.amount : -item.amount));
  }
  return [...perGoal.values()].reduce((sum, net) => sum + Math.max(0, net), 0);
}

/**
 * @param {object[]} plans  All versions.
 * @param {Date} [now=new Date()]
 * @returns {number} Paise: the allowances of every month from the first plan up to (not including) this month.
 */
export function pastAllowances(plans, now = new Date()) {
  if (plans.length === 0) return 0;
  const month = currentMonthKey(now);
  let key = plans.reduce((first, plan) => (plan.appliesFrom < first ? plan.appliesFrom : first), plans[0].appliesFrom);
  let total = 0;
  for (; key < month; key = shiftMonthKey(key, 1)) total += monthAllowance(plans, key);
  return total;
}

/**
 * @param {{plans: object[], contributions: object[], extraIncomes?: object[]}} state
 * @param {Date} [now=new Date()]
 * @returns {null|{allowance: number, pastAllowances: number, extraWishes: number, assigned: number, stack: number,
 *   available: number, carriedOver: number, thisMonthLeft: number, overBy: number}}
 *   null when there is no plan (the planner is not in use). carriedOver + thisMonthLeft = available;
 *   assigning uses the carried-over stack first. overBy > 0 only if more was assigned than there was (e.g. a withdrawal entry was deleted).
 */
export function availableToAssign({ plans, contributions, extraIncomes = [] }, now = new Date()) {
  const start = plannerStart(plans);
  if (start === null) return null;
  const allowance = monthAllowance(plans, currentMonthKey(now));
  const past = pastAllowances(plans, now);
  const extraWishes = totalExtraWishes(extraIncomes);
  const assigned = assignedToGoals(contributions, start);
  const stack = past + extraWishes - assigned;
  const available = stack + allowance;
  const carriedOver = Math.max(0, stack);
  return { allowance, pastAllowances: past, extraWishes, assigned, stack, available, carriedOver, thisMonthLeft: Math.max(0, available - carriedOver), overBy: Math.max(0, -available) };
}

/** @param {{plans: object[], contributions: object[], extraIncomes?: object[]}} state @param {Date} [now] @returns {number|null} Paise available, or null when no plan exists. */
export const availableAmount = (state, now = new Date()) => availableToAssign(state, now)?.available ?? null;

/**
 * @param {number|null} available  From availableAmount (null = no planner, so no limit).
 * @param {number} amount  Paise about to be added to a goal.
 * @returns {string[]} Problems in plain words (empty = fine).
 */
export function checkAssign(available, amount) {
  if (available === null || amount <= available) return [];
  return [`Only ${formatMoney(Math.max(0, available))} is available to assign.`];
}
