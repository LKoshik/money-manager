/** Glue between the report model and the charts: turns model data into chart and table inputs. */

import { formatMoney } from '../../core/money.js';
import { describeBars, describePie } from '../../core/reportText.js';

function sliceName(slice) {
  return slice.note ? `${slice.name} (${slice.note})` : slice.name;
}

/**
 * Input for ui/pieChart.
 * @param {object} model  From buildReportModel.
 * @returns {object}
 */
export function pieProps(model) {
  const { pie, monthLabel } = model;
  return {
    slices: pie.slices.map((s) => ({ id: s.id, label: s.name, value: s.amount, color: s.color })),
    centerLabel: 'Spent',
    centerValue: formatMoney(pie.total),
    ariaLabel: describePie(pie, monthLabel),
  };
}

/**
 * Input for ui/dataTable: the pie as text.
 * @param {object} model
 * @returns {{caption: string, headers: string[], rows: string[][]}}
 */
export function pieTable(model) {
  const { pie, monthLabel } = model;
  const rows = pie.slices.map((s) => [sliceName(s), formatMoney(s.amount), s.percentLabel]);
  rows.push(['Total', formatMoney(pie.total), '100%']);
  return { caption: `Spending by category, ${monthLabel}`, headers: ['Category', 'Amount', 'Share'], rows };
}

/**
 * Input for ui/barChart.
 * @param {object} model
 * @returns {{rows: object[], ariaLabel: string}}
 */
export function barProps(model) {
  return { rows: model.bars.rows, ariaLabel: describeBars(model.bars.rows) };
}

/**
 * Input for ui/dataTable: the bars as text.
 * @param {object} model
 * @returns {{caption: string, headers: string[], rows: string[][]}}
 */
export function barsTable(model) {
  const rows = model.bars.rows.map((r) => [r.fullLabel, formatMoney(r.income), formatMoney(r.expense)]);
  return { caption: 'Income vs expense, last 6 months', headers: ['Month', 'Income', 'Expense'], rows };
}
