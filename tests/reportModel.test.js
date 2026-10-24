import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReportModel, MAX_SLICES } from '../src/core/reportModel.js';
import { formatMonthLabel } from '../src/core/dateLabels.js';
import { localIso, makeCategory, makeTxn } from './helpers.js';

const now = new Date(2026, 9, 24, 12); // 24 Oct 2026, local time
const cats = [
  makeCategory({ id: 'food', name: 'Food', color: '#ef4444' }),
  makeCategory({ id: 'fuel', name: 'Fuel', color: '#84cc16' }),
  makeCategory({ id: 'old', name: 'Old', color: 'red; x:y', archived: true }),
  makeCategory({ id: 'pay', name: 'Pay', kind: 'income', color: '#16a34a' }),
];
const exp = (categoryId, amount, month = 9, day = 10) =>
  makeTxn({ categoryId, amount, date: localIso(2026, month, day) });

function state(transactions, categories = cats) {
  return { categories, transactions, accounts: [], budgets: [], settings: {} };
}

test('pie: expense only; income and transfers never appear', () => {
  const model = buildReportModel(state([
    exp('food', 30000),
    exp('fuel', 10000),
    makeTxn({ type: 'income', categoryId: 'pay', amount: 999999, date: localIso(2026, 9, 3) }),
    makeTxn({ type: 'transfer', categoryId: null, toAccountId: 'b', amount: 777777, date: localIso(2026, 9, 4) }),
  ]), null, now);
  assert.deepEqual(model.pie.slices.map((s) => s.name), ['Food', 'Fuel']);
  assert.equal(model.pie.total, 40000);
  assert.deepEqual(model.pie.slices.map((s) => s.percent), [75, 25]);
});

test('pie: an archived category with spending still appears; a bad color is dropped', () => {
  const model = buildReportModel(state([exp('old', 5000)]), null, now);
  assert.equal(model.pie.slices[0].name, 'Old');
  assert.equal(model.pie.slices[0].color, null);
});

test('pie: unknown category shows as Uncategorized', () => {
  const model = buildReportModel(state([exp('gone', 100), exp(null, 100)]), null, now);
  assert.ok(model.pie.slices.every((s) => s.name === 'Uncategorized'));
});

test('pie: more than 6 categories fold the smallest into "Other"; percents sum to 100', () => {
  const many = Array.from({ length: 9 }, (_, i) => makeCategory({ id: `c${i}`, name: `C${i}` }));
  const txns = many.map((c, i) => exp(c.id, (9 - i) * 1111));
  const model = buildReportModel(state(txns, many), null, now);
  const { slices } = model.pie;
  assert.equal(slices.length, MAX_SLICES);
  assert.equal(slices.at(-1).name, 'Other');
  assert.equal(slices.at(-1).note, '4 categories'); // 9 categories: 5 kept, 4 folded
  assert.equal(slices.reduce((s, x) => s + x.amount, 0), model.pie.total);
  assert.equal(slices.reduce((s, x) => s + x.percent, 0), 100);
});

test('pie: exactly 6 categories are not grouped', () => {
  const six = Array.from({ length: 6 }, (_, i) => makeCategory({ id: `c${i}`, name: `C${i}` }));
  const model = buildReportModel(state(six.map((c) => exp(c.id, 100)), six), null, now);
  assert.equal(model.pie.slices.length, 6);
  assert.ok(model.pie.slices.every((s) => s.name !== 'Other'));
});

test('pie: a tiny share is labelled "<1%"', () => {
  const model = buildReportModel(state([exp('food', 1), exp('fuel', 1000000)]), null, now);
  assert.equal(model.pie.slices.find((s) => s.id === 'food').percentLabel, '<1%');
});

test('month picker: current month has no next; prev goes back one month', () => {
  const txns = [exp('food', 100, 6, 5), exp('food', 100, 9, 5)]; // July and October
  const current = buildReportModel(state(txns), null, now);
  assert.equal(current.monthKey, '2026-10');
  assert.equal(current.nextKey, null);
  assert.equal(current.prevKey, '2026-09');
  const august = buildReportModel(state(txns), '2026-08', now);
  assert.deepEqual([august.prevKey, august.nextKey], ['2026-07', '2026-09']);
  assert.equal(august.pie.hasData, false); // a month between has no data
});

test('month picker: prev stops at the oldest month; too-old and future months are clamped', () => {
  const txns = [exp('food', 100, 6, 5)]; // July
  assert.equal(buildReportModel(state(txns), '2026-07', now).prevKey, null);
  assert.equal(buildReportModel(state(txns), '2026-07', now).pie.hasData, true);
  assert.equal(buildReportModel(state(txns), '2025-01', now).monthKey, '2026-07');
  assert.equal(buildReportModel(state(txns), '2027-03', now).monthKey, '2026-10');
});

test('month with no expenses: pie has no data, bars still do', () => {
  const model = buildReportModel(state([exp('food', 500, 8, 5)]), null, now);
  assert.equal(model.pie.hasData, false);
  assert.equal(model.pie.total, 0);
  assert.deepEqual(model.pie.slices, []);
  assert.equal(model.bars.hasData, true);
});

test('bars: 6 months ending now, income and expense apart, transfers ignored', () => {
  const model = buildReportModel(state([
    exp('food', 200),
    makeTxn({ type: 'income', categoryId: 'pay', amount: 900, date: localIso(2026, 7, 2) }),
    makeTxn({ type: 'transfer', categoryId: null, toAccountId: 'b', amount: 5000, date: localIso(2026, 9, 2) }),
  ]), null, now);
  assert.deepEqual(model.bars.rows.map((r) => r.key), ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
  // Month names come from Intl, which differs between systems ("Sep" vs "Sept"), so compare with the same helper.
  assert.deepEqual(model.bars.rows.map((r) => r.label), model.bars.rows.map((r) => formatMonthLabel(r.key)));
  assert.equal(model.bars.rows[0].fullLabel, formatMonthLabel('2026-05', true));
  assert.equal(model.bars.rows[5].expense, 200);
  assert.equal(model.bars.rows[3].income, 900);
  assert.equal(model.bars.rows[5].income, 0);
});

test('bars: all-zero last 6 months', () => {
  const model = buildReportModel(state([exp('food', 500, 0, 5)]), null, now);
  assert.equal(model.bars.hasData, false);
  assert.equal(model.hasAnyData, true);
});

test('no transactions at all', () => {
  const model = buildReportModel(state([]), null, now);
  assert.equal(model.hasAnyData, false);
  assert.equal(model.monthKey, '2026-10');
  assert.equal(model.prevKey, null);
  assert.equal(model.nextKey, null);
  assert.ok(!JSON.stringify(model).includes('NaN'));
});
