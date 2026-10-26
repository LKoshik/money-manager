/**
 * The rules for CHANGING the plan, decided before anything is saved. Pure.
 * A change never edits an old version: it adds (or replaces) the version of ONE future month,
 * so the current and past months can never change.
 */

import { currentMonthKey, nextMonthKey } from './planModel.js';

/**
 * Where does a saved plan start, and which version does it replace?
 * The very first plan starts THIS month (there is nothing to protect yet). Every later change starts NEXT month,
 * and replaces the version already waiting for next month (so editing twice leaves one change).
 * @param {Array<{id: string, appliesFrom: string}>} plans  All versions.
 * @param {Date} [now=new Date()]
 * @returns {{appliesFrom: string, replaceId: string|null}}
 */
export function saveTarget(plans, now = new Date()) {
  const appliesFrom = plans.length === 0 ? currentMonthKey(now) : nextMonthKey(now);
  return { appliesFrom, replaceId: plans.find((plan) => plan.appliesFrom === appliesFrom)?.id ?? null };
}

/**
 * The changes that have not started yet (so they may still be cancelled).
 * @param {Array<{id: string, appliesFrom: string}>} plans
 * @param {Date} [now=new Date()]
 * @returns {string[]} Version ids. The current and past versions are never in this list.
 */
export function scheduledIds(plans, now = new Date()) {
  const month = currentMonthKey(now);
  return plans.filter((plan) => plan.appliesFrom > month).map((plan) => plan.id);
}

/** The input that ends the plan: from next month there is no income and no buckets. */
export const STOP_INPUT = Object.freeze({ income: 0, buckets: Object.freeze([]) });
