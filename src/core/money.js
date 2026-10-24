/**
 * Money helpers.
 *
 * All money in this app is an INTEGER number of paise (Rs 250.50 = 25050).
 * We never keep money as a float, because floats make tiny errors
 * (0.1 + 0.2 = 0.30000000000000004). We only format when we display.
 */

// Created once and reused, because making an Intl formatter is slow.
const CURRENCY_FORMAT = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

/**
 * Stop early if a value is not a whole number of paise.
 * A wrong value here means a bug somewhere else, so we want to know now.
 * @param {unknown} paise
 */
function assertPaise(paise) {
  if (!Number.isInteger(paise)) {
    throw new TypeError(`Money must be an integer in paise, got: ${paise}`);
  }
}

/**
 * Turn what the user typed (or a number) in rupees into integer paise.
 * Strings are parsed digit by digit, so no float error can happen.
 * @param {string|number} value  Example: "250.50", "1,00,000", 250.5
 * @returns {number|null} Paise, or null if the input is not valid money.
 */
export function rupeesToPaise(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.round(value * 100) + 0 : null;
  }
  if (typeof value !== 'string') return null;

  const text = value.trim().replace(/,/g, '');
  if (!/^-?(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(text)) return null;

  const negative = text.startsWith('-');
  const [whole, fraction = ''] = text.replace('-', '').split('.');
  const paise = Number(whole || 0) * 100 + Number(fraction.padEnd(2, '0'));
  // "+ 0" turns -0 into 0, so "-0" never becomes a strange negative zero.
  return (negative ? -paise : paise) + 0;
}

/**
 * Turn paise into a plain text amount with 2 decimals, no symbol, no commas.
 * Used for edit boxes and CSV export, where we need a clean number.
 * @param {number} paise  Integer paise. Example: 25050
 * @returns {string} Example: "250.50"
 */
export function formatPlain(paise) {
  assertPaise(paise);
  const sign = paise < 0 ? '-' : '';
  const absolute = Math.abs(paise);
  const rupees = Math.floor(absolute / 100);
  const rest = String(absolute % 100).padStart(2, '0');
  return `${sign}${rupees}.${rest}`;
}

/**
 * Format paise for display in Indian style with the rupee symbol.
 * @param {number} paise  Integer paise. Example: 10000000
 * @returns {string} Example: "₹1,00,000.00"
 */
export function formatMoney(paise) {
  assertPaise(paise);
  return CURRENCY_FORMAT.format(paise / 100);
}
