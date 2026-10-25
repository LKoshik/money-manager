/**
 * The recurring engine. Pure: no DOM, no storage.
 *
 * KEY IDEA: occurrence number n is computed from the START date plus n periods,
 * never from the previous date. So a monthly rule on the 31st gives
 * 31 Jan, 28 Feb, 31 Mar (a short month does not drag later months down).
 * Every date is a local calendar day at local 12:00, which is safe in DST changes.
 */

import { toDayKey } from './dates.js';

/** The most transactions one run may create for one rule. */
export const MAX_PER_RUN = 100;
const MAX_SKIP = 20000; // a safety stop for the skip loop

const daysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

/**
 * The date of occurrence number n (0 = the start date).
 * @param {{startDate: string, frequency: 'weekly'|'monthly'|'yearly'}} rule
 * @param {number} n
 * @returns {Date} Local 12:00 of that day.
 */
export function occurrenceDate(rule, n) {
  const start = new Date(rule.startDate);
  const [year, month, day] = [start.getFullYear(), start.getMonth(), start.getDate()];
  if (rule.frequency === 'weekly') return new Date(year, month, day + 7 * n, 12);
  const months = rule.frequency === 'monthly' ? month + n : month; // yearly keeps the month
  const targetYear = rule.frequency === 'monthly' ? year + Math.floor(months / 12) : year + n;
  const targetMonth = ((months % 12) + 12) % 12;
  return new Date(targetYear, targetMonth, Math.min(day, daysInMonth(targetYear, targetMonth)), 12);
}

/** Is this date after the rule's last day? (Compared by local day.) */
function isAfterEnd(rule, date) {
  return Boolean(rule.endDate) && toDayKey(date.toISOString()) > toDayKey(rule.endDate);
}

/**
 * The occurrences that should exist by now but were not created yet.
 * @param {{startDate: string, frequency: string, endDate: string|null, generatedCount: number}} rule
 * @param {Date} now
 * @param {number} [cap=MAX_PER_RUN]
 * @returns {string[]} ISO dates, oldest first, at most "cap".
 */
export function dueOccurrences(rule, now, cap = MAX_PER_RUN) {
  const due = [];
  for (let n = rule.generatedCount; due.length < cap; n += 1) {
    const date = occurrenceDate(rule, n);
    if (date > now || isAfterEnd(rule, date)) break;
    due.push(date.toISOString());
  }
  return due;
}

/**
 * Where to continue so that nothing in the past is added: the number of the
 * first occurrence after "now". Never goes backwards.
 * @param {{startDate: string, frequency: string, generatedCount: number}} rule
 * @param {Date} now
 * @returns {number} The new generatedCount.
 */
export function skipToNext(rule, now) {
  let n = rule.generatedCount;
  while (n < MAX_SKIP && occurrenceDate(rule, n) <= now) n += 1;
  return n;
}

/**
 * The next date a rule will create something.
 * @param {{startDate: string, frequency: string, endDate: string|null, generatedCount: number}} rule
 * @returns {string|null} ISO date, or null when the rule has ended.
 */
export function nextOccurrence(rule) {
  const date = occurrenceDate(rule, rule.generatedCount);
  return isAfterEnd(rule, date) ? null : date.toISOString();
}
