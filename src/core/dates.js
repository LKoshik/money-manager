/**
 * Date helpers.
 *
 * Transactions store their date as a full ISO string
 * (example: "2026-10-23T06:30:00.000Z").
 * But a person thinks in LOCAL days: 1 AM in India on the 24th must show
 * under the 24th, even though that moment is still the 23rd in UTC.
 * So every "which day / which month" question is answered in local time here.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const pad = (number) => String(number).padStart(2, '0');

/** Local "YYYY-MM-DD" of a Date object. */
function dayKeyOf(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Get the local day of an ISO date.
 * @param {string} iso  Example: "2026-10-23T06:30:00.000Z"
 * @returns {string|null} Example: "2026-10-23", or null if the date is invalid.
 */
export function toDayKey(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : dayKeyOf(date);
}

/**
 * Get the local month of an ISO date.
 * @param {string} iso
 * @returns {string|null} Example: "2026-10", or null if the date is invalid.
 */
export function toMonthKey(iso) {
  const day = toDayKey(iso);
  return day ? day.slice(0, 7) : null;
}

/**
 * Get the time range of one local month.
 * The start is included, the end is NOT included (it is the 1st of next month).
 * @param {number} year
 * @param {number} monthIndex  0 = January, 11 = December
 * @returns {{start: string, end: string}} Two ISO strings.
 */
export function getMonthRange(year, monthIndex) {
  // Month 12 rolls over to January of next year by itself.
  return {
    start: new Date(year, monthIndex, 1).toISOString(),
    end: new Date(year, monthIndex + 1, 1).toISOString(),
  };
}

/**
 * Get the range of the month that contains "now".
 * @param {Date} [now=new Date()]  Passed in so tests can control time.
 * @returns {{start: string, end: string}}
 */
export function getCurrentMonthRange(now = new Date()) {
  return getMonthRange(now.getFullYear(), now.getMonth());
}

/**
 * Get the range for a month key like "2026-10".
 * @param {string} key
 * @returns {{start: string, end: string}|null} null if the key is not valid.
 */
export function monthKeyToRange(key) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key)) return null;
  const [year, month] = key.split('-').map(Number);
  return getMonthRange(year, month - 1);
}

/**
 * Check if a date is inside a range (start included, end not included).
 * @param {string} iso
 * @param {{start: string, end: string}} range
 * @returns {boolean} false if the date is invalid.
 */
export function isInRange(iso, range) {
  const time = Date.parse(iso);
  return time >= Date.parse(range.start) && time < Date.parse(range.end);
}

/**
 * List the last N month keys, oldest first. Used by the bar chart.
 * @param {number} count
 * @param {Date} [now=new Date()]
 * @returns {string[]} Example: ["2026-08", "2026-09", "2026-10"]
 */
export function getLastMonthKeys(count, now = new Date()) {
  const keys = [];
  for (let back = count - 1; back >= 0; back -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - back, 1);
    keys.push(dayKeyOf(date).slice(0, 7));
  }
  return keys;
}

/**
 * Group transactions by local day, newest day first, newest item first.
 * @param {Array<{date: string, createdAt?: string}>} transactions
 * @returns {Array<{day: string, items: object[]}>}
 */
export function groupByDay(transactions) {
  const sorted = [...transactions].sort(
    (a, b) =>
      Date.parse(b.date) - Date.parse(a.date) ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  const groups = new Map();
  for (const txn of sorted) {
    const day = toDayKey(txn.date);
    // Bad dates are rejected when importing data, so we skip them here.
    if (!day) continue;
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day).push(txn);
  }
  return [...groups].map(([day, items]) => ({ day, items }));
}

/**
 * Count the full days that passed since an ISO date.
 * Used for the "last backup" reminder.
 * @param {string|null|undefined} iso
 * @param {Date} [now=new Date()]
 * @returns {number|null} null if there is no valid date (example: never backed up).
 */
export function daysSince(iso, now = new Date()) {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  return Math.floor((now.getTime() - time) / MS_PER_DAY);
}
