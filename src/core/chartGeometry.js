/**
 * Pure drawing maths for the charts: where slices and bars go.
 * No DOM here, so it can be unit-tested.
 */

import { niceAxis, formatAxisLabel } from './chartScale.js';

const MIN_DEGREES = 2; // a thinner slice would be invisible on a phone
const MIN_BAR_HEIGHT = 2;

function round(number) {
  return Math.round(number * 100) / 100;
}

/**
 * A point on a circle. 0 degrees = top, going clockwise.
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 * @param {number} degrees
 * @returns {{x: number, y: number}}
 */
export function polarPoint(cx, cy, radius, degrees) {
  const radians = (degrees * Math.PI) / 180;
  return { x: round(cx + radius * Math.sin(radians)), y: round(cy - radius * Math.cos(radians)) };
}

/**
 * Start and end angle of each positive value. Equal values keep their input order.
 * Slices thinner than MIN_DEGREES are widened and the others shrink to make room.
 * @param {number[]} values
 * @returns {Array<{index: number, start: number, end: number}>} Zero values are skipped.
 */
export function sliceAngles(values) {
  const items = values.map((value, index) => ({ value, index })).filter((item) => item.value > 0);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let degrees = items.map((item) => (item.value / total) * 360);
  const tiny = degrees.map((d) => d < MIN_DEGREES);
  const tinyCount = tiny.filter(Boolean).length;
  if (tinyCount > 0 && tinyCount < items.length) {
    const bigSum = degrees.reduce((sum, d, i) => sum + (tiny[i] ? 0 : d), 0);
    const scale = (360 - tinyCount * MIN_DEGREES) / bigSum;
    degrees = degrees.map((d, i) => (tiny[i] ? MIN_DEGREES : d * scale));
  }
  let start = 0;
  return items.map((item, i) => {
    const slice = { index: item.index, start, end: start + degrees[i] };
    start = slice.end;
    return slice;
  });
}

/**
 * Shapes for a donut. Each slice is a stroked arc along the middle of the ring.
 * One slice = 100%: an arc cannot close on itself, so that case is a circle.
 * @param {number[]} values
 * @param {{cx: number, cy: number, radius: number}} ring
 * @returns {Array<{index: number, kind: 'circle'|'arc', d?: string, cx?: number, cy?: number, r?: number}>}
 */
export function buildDonut(values, { cx, cy, radius }) {
  return sliceAngles(values).map(({ index, start, end }) => {
    const sweep = end - start;
    if (sweep >= 359.99) return { index, kind: 'circle', cx, cy, r: radius };
    const from = polarPoint(cx, cy, radius, start);
    const to = polarPoint(cx, cy, radius, end);
    const large = sweep > 180 ? 1 : 0;
    return { index, kind: 'arc', d: `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${large} 1 ${to.x} ${to.y}` };
  });
}

const DEFAULT_BOX = { width: 320, height: 210, left: 44, right: 6, top: 10, bottom: 26, barGap: 3 };

/**
 * Positions for a grouped bar chart (two bars per row).
 * @param {Array<{key: string, label: string, income: number, expense: number}>} rows
 * @param {Partial<typeof DEFAULT_BOX>} [box]  Chart size and margins, in SVG units.
 * @returns {{width: number, height: number, left: number, right: number, baseline: number, max: number,
 *   ticks: Array<{value: number, y: number, label: string}>,
 *   groups: Array<{key: string, label: string, center: number,
 *     income: {value: number, x: number, y: number, width: number, height: number},
 *     expense: {value: number, x: number, y: number, width: number, height: number}}>}}
 */
export function buildBars(rows, box = {}) {
  const { width, height, left, right, top, bottom, barGap } = { ...DEFAULT_BOX, ...box };
  const biggest = rows.reduce((max, row) => Math.max(max, row.income, row.expense), 0);
  const axis = niceAxis(biggest);
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const baseline = top + plotHeight;
  const slot = plotWidth / Math.max(rows.length, 1);
  const barWidth = Math.min(16, (slot - 10 - barGap) / 2); // air between month groups
  const heightOf = (v) => (v <= 0 ? 0 : Math.max(MIN_BAR_HEIGHT, round((v / axis.max) * plotHeight)));
  const bar = (value, x) => ({ value, x: round(x), width: round(barWidth), height: heightOf(value), y: round(baseline - heightOf(value)) });
  const groups = rows.map((row, i) => {
    const center = left + slot * i + slot / 2;
    return {
      key: row.key,
      label: row.label,
      center: round(center),
      income: bar(row.income, center - barGap / 2 - barWidth),
      expense: bar(row.expense, center + barGap / 2),
    };
  });
  const ticks = axis.ticks.map((value) => ({ value, y: round(baseline - (value / axis.max) * plotHeight), label: formatAxisLabel(value) }));
  return { width, height, left, right, baseline, max: axis.max, ticks, groups };
}
