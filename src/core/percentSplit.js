/**
 * Percent rounding for charts. Rounding every share on its own can give 99% or 101%,
 * so we use the largest-remainder method: round everything down, then hand the
 * missing points to the biggest leftovers.
 */

/**
 * Turn amounts into whole percents that always add up to exactly 100.
 * @param {number[]} values  Non-negative integers (paise).
 * @returns {number[]} Same length and order. All zeros when the total is 0.
 */
export function roundPercents(values) {
  const amounts = values.map((value) => Math.max(0, value));
  const total = amounts.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return amounts.map(() => 0);
  // Integer maths on purpose: no floating-point surprises at exact halves.
  const parts = amounts.map((value, index) => {
    const scaled = value * 100;
    return { index, whole: Math.floor(scaled / total), rest: scaled % total };
  });
  const missing = 100 - parts.reduce((sum, part) => sum + part.whole, 0);
  // Ties go to the earlier item, so the result never shuffles between redraws.
  const winners = [...parts].sort((a, b) => b.rest - a.rest || a.index - b.index).slice(0, missing);
  for (const part of winners) part.whole += 1;
  return parts.map((part) => part.whole);
}
