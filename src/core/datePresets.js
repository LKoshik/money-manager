/**
 * The date choices of the transaction filter: all time, this month,
 * last month, or a custom range of days.
 */

import { getCurrentMonthRange, getMonthRange } from './dates.js';

export const DATE_PRESETS = ['all', 'thisMonth', 'lastMonth', 'custom'];

/** Read "2026-10-24" as a local day. Returns null if it is not a real day. */
function parseDay(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text));
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  const real = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return real ? date : null;
}

/**
 * Say what is wrong with a custom range, in simple words.
 * @param {string} from  "YYYY-MM-DD" or "".
 * @param {string} to  "YYYY-MM-DD" or "".
 * @returns {string|null} A message, or null if the range is fine.
 */
export function customRangeProblem(from, to) {
  if (!from && !to) return 'Pick at least one date.';
  const start = from ? parseDay(from) : null;
  const end = to ? parseDay(to) : null;
  if ((from && !start) || (to && !end)) return 'Check the dates.';
  if (start && end && start > end) return 'The start date must be before the end date.';
  return null;
}

/**
 * Turn the date part of a filter into a range.
 * @param {{datePreset: string, from?: string, to?: string}} filters
 * @param {Date} [now=new Date()]
 * @returns {{start: string, end: string}|null} null means "no date limit".
 *   Like everywhere else, start is included and end is NOT. A custom "to" day is included.
 */
export function resolveDateRange(filters, now = new Date()) {
  switch (filters.datePreset) {
    case 'thisMonth':
      return getCurrentMonthRange(now);
    case 'lastMonth':
      return getMonthRange(now.getFullYear(), now.getMonth() - 1); // month -1 means December of last year
    case 'custom':
      return resolveCustom(filters);
    default:
      return null;
  }
}

function resolveCustom({ from, to }) {
  if (customRangeProblem(from ?? '', to ?? '')) return null;
  const start = from ? parseDay(from) : new Date(1970, 0, 1);
  const lastDay = to ? parseDay(to) : new Date(9998, 11, 31);
  const end = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}
