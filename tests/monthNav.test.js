import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shiftMonthKey, clampMonthKey, getOldestMonthKey } from '../src/core/monthNav.js';
import { localIso, makeTxn } from './helpers.js';

test('shiftMonthKey: crosses year boundaries both ways', () => {
  assert.equal(shiftMonthKey('2026-01', -1), '2025-12');
  assert.equal(shiftMonthKey('2025-12', 1), '2026-01');
  assert.equal(shiftMonthKey('2026-10', 0), '2026-10');
  assert.equal(shiftMonthKey('2026-10', -13), '2025-09');
});

test('clampMonthKey: keeps the month inside the range', () => {
  assert.equal(clampMonthKey('2026-12', '2026-03', '2026-10'), '2026-10');
  assert.equal(clampMonthKey('2025-01', '2026-03', '2026-10'), '2026-03');
  assert.equal(clampMonthKey('2026-05', '2026-03', '2026-10'), '2026-05');
});

test('getOldestMonthKey: finds the oldest month of any type, falls back when empty', () => {
  const txns = [
    makeTxn({ date: localIso(2026, 9, 5) }),
    makeTxn({ type: 'transfer', date: localIso(2026, 6, 20) }),
    makeTxn({ date: 'not a date' }),
  ];
  assert.equal(getOldestMonthKey(txns, '2026-10'), '2026-07');
  assert.equal(getOldestMonthKey([], '2026-10'), '2026-10');
});
