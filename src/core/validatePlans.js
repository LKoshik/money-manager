/**
 * Validation for planner data. A plan is stored as VERSIONS: each version says
 * "from this month on, the plan is this". Buckets are paper-only (never checked against transactions).
 */

import { MAX_NAME_LENGTH } from './validate.js';
import { isObject, isText, isPaise, isDateText, collect } from './validateParts.js';

export const MAX_BUCKETS = 30;
const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;

/** @param {unknown} bucket @returns {string[]} Problems found (empty if valid). */
function validateBucket(bucket) {
  if (!isObject(bucket)) return ['bucket must be an object'];
  return collect([
    [isText(bucket.id), 'bucket id is missing'],
    [isText(bucket.name) && bucket.name.length <= MAX_NAME_LENGTH, `bucket name must be 1-${MAX_NAME_LENGTH} characters`],
    [isPaise(bucket.amount) && bucket.amount > 0, 'bucket amount must be a positive whole number of paise'],
  ]);
}

/**
 * @param {unknown} plan  One plan version.
 * @returns {string[]} Problems found (empty if valid). Buckets may add up to more than the income: that is only a warning on screen.
 */
export function validatePlan(plan) {
  if (!isObject(plan)) return ['plan must be an object'];
  const buckets = Array.isArray(plan.buckets) ? plan.buckets : null;
  const problems = collect([
    [isText(plan.id), 'id is missing'],
    [typeof plan.appliesFrom === 'string' && MONTH_KEY.test(plan.appliesFrom), 'appliesFrom must be a month like 2026-10'],
    [isPaise(plan.income) && plan.income >= 0, 'income must be a whole number of paise, 0 or more'],
    [buckets !== null, 'buckets must be a list'],
    [buckets === null || buckets.length <= MAX_BUCKETS, `use at most ${MAX_BUCKETS} buckets`],
    [isDateText(plan.createdAt), 'createdAt must be an ISO date'],
  ]);
  if (buckets === null) return problems;
  const ids = new Set();
  for (const bucket of buckets) {
    problems.push(...validateBucket(bucket));
    if (ids.has(bucket?.id)) problems.push('a bucket id is used twice');
    ids.add(bucket?.id);
  }
  return problems;
}

/**
 * Backup check across the whole list: only one version may apply from a given month.
 * @param {object[]} plans  Already checked one by one.
 * @param {string[]} errors  Problems are added here.
 */
export function checkPlanVersions(plans, errors) {
  const months = new Set();
  plans.forEach((plan, index) => {
    if (months.has(plan.appliesFrom)) errors.push(`plans[${index}]: second version for ${plan.appliesFrom}`);
    months.add(plan.appliesFrom);
  });
}
