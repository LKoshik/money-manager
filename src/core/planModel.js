/**
 * The math of the planner. Pure, integer paise only.
 * Months are calendar months, written as keys like "2026-10" (local time).
 * The wishes allowance is always CALCULATED (income - buckets), never typed or stored.
 */

import { toMonthKey } from './dates.js';
import { shiftMonthKey } from './monthNav.js';

/** @param {Date} [now=new Date()] @returns {string} The calendar month of "now", like "2026-10". */
export const currentMonthKey = (now = new Date()) => toMonthKey(now.toISOString());

/** @param {Date} [now=new Date()] @returns {string} The month after the current one. */
export const nextMonthKey = (now = new Date()) => shiftMonthKey(currentMonthKey(now), 1);

/**
 * The plan that rules a month: the newest version that applies from this month or earlier.
 * @param {Array<{appliesFrom: string}>} plans  All versions.
 * @param {string} monthKey
 * @returns {object|null} null when the plan did not exist yet in that month.
 */
export function planForMonth(plans, monthKey) {
  let found = null;
  for (const plan of plans) {
    if (plan.appliesFrom <= monthKey && (found === null || plan.appliesFrom > found.appliesFrom)) found = plan;
  }
  return found;
}

/** @param {{buckets: Array<{amount: number}>}} plan @returns {number} Paise planned in all buckets. */
export const bucketsTotal = (plan) => plan.buckets.reduce((sum, bucket) => sum + bucket.amount, 0);

/**
 * @param {{income: number, buckets: Array<{amount: number}>}} plan
 * @returns {{income: number, bucketsTotal: number, allowance: number, overBy: number}}
 *   allowance = income - buckets (negative when the buckets are too big); overBy = how much too big (0 if fine).
 */
export function summarizePlan(plan) {
  const total = bucketsTotal(plan);
  const allowance = plan.income - total;
  return { income: plan.income, bucketsTotal: total, allowance, overBy: Math.max(0, -allowance) };
}

/**
 * The wishes allowance of one month, as it counts for the stack.
 * @param {object[]} plans  All versions.
 * @param {string} monthKey
 * @returns {number} Paise. 0 when there was no plan, and never negative (a plan that is too big gives nothing, not a debt).
 */
export function monthAllowance(plans, monthKey) {
  const plan = planForMonth(plans, monthKey);
  return plan ? Math.max(0, summarizePlan(plan).allowance) : 0;
}

/** @param {{income: number, buckets: object[]}} plan @returns {boolean} A version that ended the plan (no income, no buckets). */
export const isStopped = (plan) => plan.income === 0 && plan.buckets.length === 0;

/**
 * Everything the Planner screen shows.
 * @param {object[]} plans  All versions.
 * @param {Date} [now=new Date()]
 * @returns {{month: string, nextMonth: string, hasAny: boolean,
 *   current: {plan: object, summary: object}|null, upcoming: {plan: object, summary: object}|null}}
 *   current = the plan of this month (null if none or stopped). upcoming = the change that starts later (the earliest one).
 */
export function planView(plans, now = new Date()) {
  const month = currentMonthKey(now);
  const wrap = (plan) => (plan ? { plan, summary: summarizePlan(plan) } : null);
  const running = planForMonth(plans, month);
  const later = plans.filter((plan) => plan.appliesFrom > month).sort((a, b) => a.appliesFrom.localeCompare(b.appliesFrom));
  return {
    month,
    nextMonth: shiftMonthKey(month, 1),
    hasAny: plans.length > 0,
    current: running && !isStopped(running) ? wrap(running) : null,
    upcoming: wrap(later[0] ?? null),
  };
}
