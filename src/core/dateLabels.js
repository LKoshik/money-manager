/**
 * Date labels: turn dates into short text people can read.
 * This lives in its own file so dates.js stays small and focused.
 */

import { toDayKey } from './dates.js';

const DAY_FORMAT = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/**
 * Make a short label for a month key.
 * @param {string} key  Example: "2026-10"
 * @param {boolean} [withYear=false]
 * @returns {string} Example: "Oct" or "Oct 2026"
 */
export function formatMonthLabel(key, withYear = false) {
  const [year, month] = key.split('-').map(Number);
  const format = new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    ...(withYear && { year: 'numeric' }),
  });
  return format.format(new Date(year, month - 1, 1));
}

/**
 * Make a friendly title for a day group in the transaction list.
 * @param {string} dayKey  Example: "2026-10-23"
 * @param {Date} [now=new Date()]  Passed in so tests can control time.
 * @returns {string} "Today", "Yesterday", or a date like "20 Oct 2026".
 */
export function formatDayLabel(dayKey, now = new Date()) {
  if (dayKey === toDayKey(now.toISOString())) return 'Today';
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (dayKey === toDayKey(yesterday.toISOString())) return 'Yesterday';
  const [year, month, day] = dayKey.split('-').map(Number);
  return DAY_FORMAT.format(new Date(year, month - 1, day));
}
