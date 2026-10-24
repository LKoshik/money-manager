import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describePie, describeBars } from '../src/core/reportText.js';
import { safeColor } from '../src/core/chartColor.js';

test('describePie: names, amounts and shares in words', () => {
  const pie = { total: 40000, hasData: true, slices: [{ name: 'Food', amount: 30000, percentLabel: '75%' }, { name: 'Fuel', amount: 10000, percentLabel: '25%' }] };
  const text = describePie(pie, 'Oct 2026');
  assert.match(text, /Oct 2026/);
  assert.match(text, /Food ₹300\.00, 75%/);
  assert.match(text, /Total ₹400\.00/);
});

test('describePie: empty month', () => {
  assert.equal(describePie({ hasData: false, slices: [], total: 0 }, 'Oct 2026'), 'No spending in Oct 2026.');
});

test('describeBars: one phrase per month', () => {
  const text = describeBars([{ fullLabel: 'Sep 2026', income: 100000, expense: 5000 }, { fullLabel: 'Oct 2026', income: 0, expense: 0 }]);
  assert.match(text, /last 2 months/);
  assert.match(text, /Sep 2026: income ₹1,000\.00, expense ₹50\.00/);
});

test('safeColor: only plain hex colors pass', () => {
  assert.equal(safeColor('#ef4444'), '#ef4444');
  assert.equal(safeColor('#fff'), '#fff');
  for (const bad of ['red', 'red; background:url(x)', '', null, undefined, 12]) assert.equal(safeColor(bad), null);
});
