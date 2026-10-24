/**
 * Axis maths for the bar chart: a "nice" top value and short money labels.
 * All values are integer paise.
 */

const MULTIPLIERS = [1, 2, 2.5, 5];
const MIN_UNIT = 100; // never a step smaller than Rs 1
const EMPTY_STEP = 25000; // Rs 250: a calm default axis when there is no data

/**
 * Pick a round axis top that is at least as big as the largest value.
 * @param {number} maxValue  Largest bar, in paise.
 * @param {number} [intervals=4]  How many gaps between grid lines.
 * @returns {{max: number, step: number, ticks: number[]}} ticks start at 0 and end at max.
 */
export function niceAxis(maxValue, intervals = 4) {
  const top = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 0;
  let step = top === 0 ? EMPTY_STEP : 0;
  for (let unit = MIN_UNIT; step === 0; unit *= 10) {
    step = MULTIPLIERS.map((m) => Math.round(m * unit)).find((s) => s * intervals >= top) ?? 0;
  }
  const ticks = Array.from({ length: intervals + 1 }, (_, i) => i * step);
  return { max: step * intervals, step, ticks };
}

function trim(number) {
  return String(Number(number.toFixed(1)));
}

/**
 * A short label for an axis line, in the units people use in India.
 * @param {number} paise
 * @returns {string} Examples: "₹0", "₹2.5k", "₹1 L", "₹3 Cr".
 */
export function formatAxisLabel(paise) {
  const rupees = paise / 100;
  if (rupees >= 1e7) return `₹${trim(rupees / 1e7)} Cr`;
  if (rupees >= 1e5) return `₹${trim(rupees / 1e5)} L`;
  if (rupees >= 1e3) return `₹${trim(rupees / 1e3)}k`;
  return `₹${trim(rupees)}`;
}
