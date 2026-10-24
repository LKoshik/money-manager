/**
 * Everything the Reports screen shows, worked out from the store data and a month.
 * Pure: the screen only draws what this returns.
 */

import { getLastMonthKeys, monthKeyToRange, toMonthKey } from './dates.js';
import { formatMonthLabel } from './dateLabels.js';
import { getIncomeVsExpenseByMonth, getSpendingByCategory } from './reports.js';
import { roundPercents } from './percentSplit.js';
import { clampMonthKey, getOldestMonthKey, shiftMonthKey } from './monthNav.js';
import { safeColor } from './chartColor.js';

/** Most legend rows: more categories than this are grouped into "Other". */
export const MAX_SLICES = 6;
/** How many months the bar chart shows. */
export const BAR_MONTHS = 6;

const UNKNOWN = { name: 'Uncategorized', icon: '🏷️', color: null };

function describeCategory(categoryId, byId) {
  const category = byId.get(categoryId);
  if (!category) return UNKNOWN;
  return { name: category.name, icon: category.icon, color: safeColor(category.color) };
}

// Keeps the biggest categories and folds the rest into one slice, so the legend stays short.
function groupSmallest(rows) {
  if (rows.length <= MAX_SLICES) return rows;
  const rest = rows.slice(MAX_SLICES - 1);
  const other = {
    id: '__other__',
    name: 'Other',
    icon: '📦',
    color: null,
    amount: rest.reduce((sum, row) => sum + row.amount, 0),
    note: `${rest.length} categories`,
  };
  return [...rows.slice(0, MAX_SLICES - 1), other];
}

function buildPie(state, monthKey) {
  const byId = new Map(state.categories.map((category) => [category.id, category]));
  const rows = getSpendingByCategory(state.transactions, monthKeyToRange(monthKey))
    .filter((row) => row.total > 0)
    .map((row) => ({ id: row.categoryId, ...describeCategory(row.categoryId, byId), amount: row.total }));
  const grouped = groupSmallest(rows);
  const percents = roundPercents(grouped.map((slice) => slice.amount));
  const slices = grouped.map((slice, i) => ({
    ...slice,
    percent: percents[i],
    // A real but tiny share must not read as "0%".
    percentLabel: percents[i] === 0 ? '<1%' : `${percents[i]}%`,
  }));
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  return { total, slices, hasData: total > 0 };
}

function buildBarRows(transactions, now) {
  const rows = getIncomeVsExpenseByMonth(transactions, getLastMonthKeys(BAR_MONTHS, now));
  return rows.map((row) => ({ ...row, label: formatMonthLabel(row.key), fullLabel: formatMonthLabel(row.key, true) }));
}

/**
 * Build the Reports screen data.
 * @param {{categories: object[], transactions: object[]}} state
 * @param {string|null} selectedKey  The month the person picked, or null for this month.
 * @param {Date} [now=new Date()]  Passed in so tests can control time.
 * @returns {{hasAnyData: boolean, monthKey: string, monthLabel: string, prevKey: string|null, nextKey: string|null,
 *   pie: {total: number, hasData: boolean, slices: object[]},
 *   bars: {hasData: boolean, rows: Array<{key: string, label: string, fullLabel: string, income: number, expense: number}>}}}
 */
export function buildReportModel(state, selectedKey, now = new Date()) {
  const currentKey = toMonthKey(now.toISOString());
  const found = getOldestMonthKey(state.transactions, currentKey);
  const oldestKey = found > currentKey ? currentKey : found;
  const monthKey = clampMonthKey(selectedKey ?? currentKey, oldestKey, currentKey);
  const rows = buildBarRows(state.transactions, now);
  return {
    hasAnyData: state.transactions.length > 0,
    monthKey,
    monthLabel: formatMonthLabel(monthKey, true),
    prevKey: monthKey > oldestKey ? shiftMonthKey(monthKey, -1) : null,
    nextKey: monthKey < currentKey ? shiftMonthKey(monthKey, 1) : null,
    pie: buildPie(state, monthKey),
    bars: { rows, hasData: rows.some((row) => row.income > 0 || row.expense > 0) },
  };
}
