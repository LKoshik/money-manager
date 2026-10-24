/**
 * Convert between a stored ISO date and the text of an
 * <input type="datetime-local"> box ("2026-10-24T14:30"). That box works in
 * LOCAL time, so these functions do too.
 */

const pad = (number) => String(number).padStart(2, '0');

/**
 * @param {string} iso  Example: "2026-10-24T09:00:00.000Z"
 * @returns {string} Local text for the input box, or "" if the date is not valid.
 */
export function toLocalInputValue(iso) {
  if (typeof iso !== 'string') return ''; // new Date(null) would silently become 1970
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * @param {string} text  Example: "2026-10-24T14:30"
 * @returns {string|null} ISO date, or null if the text is not a real local time
 *   (example: 31 February).
 */
export function fromLocalInputValue(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(text));
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  // JavaScript moves 31 Feb to 3 Mar; we want to refuse it instead.
  const same =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute;
  return same ? date.toISOString() : null;
}
