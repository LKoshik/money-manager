/** Colors that are allowed inside an inline style. */

const HEX_COLOR = /^#[0-9a-f]{3,8}$/i;

/**
 * Only plain #hex colors may reach a style attribute, so odd saved text can never inject CSS.
 * @param {unknown} value
 * @returns {string|null} The color, or null when it is not a safe hex color.
 */
export function safeColor(value) {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value : null;
}
