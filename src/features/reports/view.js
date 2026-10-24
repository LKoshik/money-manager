/** The Reports screen: month picker, spending pie, income-vs-expense bars. */

import { el } from '../../ui/dom.js';
import { emptyState } from '../../ui/emptyState.js';
import { pieChart } from '../../ui/pieChart.js';
import { barChart } from '../../ui/barChart.js';
import { dataTable } from '../../ui/dataTable.js';
import { monthPicker } from './monthPicker.js';
import { chartSection } from './chartSection.js';
import { legend } from './legend.js';
import { barProps, barsTable, pieProps, pieTable } from './logic.js';

function pieSection(model, ui) {
  const title = 'Spending by category';
  if (!model.pie.hasData) {
    const message = `Nothing spent in ${model.monthLabel}.`;
    return chartSection({ title }, emptyState({ icon: 'chart', title: 'No spending', message }));
  }
  const showTable = ui.tables.pie;
  const body = showTable ? dataTable(pieTable(model)) : [pieChart(pieProps(model)), legend(model.pie.slices)];
  return chartSection({ title, toggle: { key: 'pie', on: showTable, onClick: () => ui.onToggle('pie') } }, body);
}

function barSection(model, ui) {
  const title = 'Income vs expense';
  if (!model.bars.hasData) {
    const message = 'No income or expense in the last 6 months.';
    return chartSection({ title }, emptyState({ icon: 'chart', title: 'Nothing to compare', message }));
  }
  const showTable = ui.tables.bars;
  const body = showTable ? dataTable(barsTable(model)) : barChart({ ...barProps(model), animate: ui.animate });
  return chartSection({ title, toggle: { key: 'bars', on: showTable, onClick: () => ui.onToggle('bars') } }, body);
}

/**
 * Build the Reports screen.
 * @param {object} model  From buildReportModel.
 * @param {{tables: {pie: boolean, bars: boolean}, animate: boolean,
 *   onMonth: (key: string) => void, onToggle: (name: 'pie'|'bars') => void}} ui  Screen-local state and handlers.
 * @returns {HTMLElement}
 */
export function buildView(model, ui) {
  if (!model.hasAnyData) {
    const message = 'Add a transaction and your charts will appear here.';
    return emptyState({ icon: 'chart', title: 'No reports yet', message });
  }
  return el('div', { className: 'stack' }, monthPicker(model, ui.onMonth), pieSection(model, ui), barSection(model, ui));
}
