/** A grouped bar chart (income green, expense red) drawn with SVG. It only gets plain data. */

import { el } from './dom.js';
import { svgEl } from './svg.js';
import { buildBars } from '../core/chartGeometry.js';

function gridLines(chart) {
  return chart.ticks.flatMap((tick) => [
    svgEl('line', { class: tick.value === 0 ? 'chart-axis' : 'chart-grid', x1: chart.left, x2: chart.width - chart.right, y1: tick.y, y2: tick.y }),
    svgEl('text', { class: 'chart-label', x: chart.left - 6, y: tick.y + 4, 'text-anchor': 'end' }, tick.label),
  ]);
}

function barRect(kind, bar, animate) {
  // "grow" animates the bar from the baseline up; it is skipped on redraws so bars do not jump around.
  const grow = animate ? ' bar--grow' : '';
  return svgEl('rect', { class: `bar bar--${kind}${grow}`, 'data-kind': kind, x: bar.x, y: bar.y, width: bar.width, height: bar.height, rx: 2 });
}

function groupNode(group, chart, animate) {
  return svgEl(
    'g',
    { class: 'bar-group', 'data-month': group.key },
    barRect('income', group.income, animate),
    barRect('expense', group.expense, animate),
    svgEl('text', { class: 'chart-label', x: group.center, y: chart.baseline + 17, 'text-anchor': 'middle' }, group.label),
  );
}

function colorKey() {
  const item = (kind, text) => el('span', { className: 'chart-key-item' }, el('span', { className: `chart-key-dot chart-key-dot--${kind}` }), text);
  return el('div', { className: 'chart-key' }, item('income', 'Income'), item('expense', 'Expense'));
}

/**
 * Make the bar chart with a small color key under it.
 * @param {{rows: Array<{key: string, label: string, income: number, expense: number}>,
 *   ariaLabel: string, animate?: boolean}} config  Amounts are paise. ariaLabel describes the data in words.
 * @returns {HTMLElement}
 */
export function barChart({ rows, ariaLabel, animate = false }) {
  const chart = buildBars(rows);
  const svg = svgEl(
    'svg',
    { class: 'bar-chart', viewBox: `0 0 ${chart.width} ${chart.height}`, role: 'img', 'aria-label': ariaLabel },
    ...gridLines(chart),
    ...chart.groups.map((group) => groupNode(group, chart, animate)),
  );
  return el('div', { className: 'bar-chart-wrap' }, svg, colorKey());
}
