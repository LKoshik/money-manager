import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDateRange, customRangeProblem } from '../src/core/datePresets.js';
import { isInRange } from '../src/core/dates.js';
import { localIso } from './helpers.js';

const now = new Date(2026, 0, 15, 12); // 15 Jan 2026, local

test('all time has no range', () => {
  assert.equal(resolveDateRange({ datePreset: 'all' }, now), null);
});

test('this month and last month (last month crosses the year)', () => {
  const thisMonth = resolveDateRange({ datePreset: 'thisMonth' }, now);
  assert.ok(isInRange(localIso(2026, 0, 1, 0), thisMonth));
  assert.ok(!isInRange(localIso(2026, 1, 1, 0), thisMonth));
  const last = resolveDateRange({ datePreset: 'lastMonth' }, now);
  assert.ok(isInRange(localIso(2025, 11, 31, 23), last));
  assert.ok(!isInRange(localIso(2026, 0, 1, 0), last));
});

test('custom range includes both the first and the last day', () => {
  const range = resolveDateRange({ datePreset: 'custom', from: '2026-03-10', to: '2026-03-12' }, now);
  assert.ok(isInRange(localIso(2026, 2, 10, 0), range));
  assert.ok(isInRange(localIso(2026, 2, 12, 23), range));
  assert.ok(!isInRange(localIso(2026, 2, 13, 0), range));
  assert.ok(!isInRange(localIso(2026, 2, 9, 23), range));
});

test('custom range may have only one end', () => {
  const fromOnly = resolveDateRange({ datePreset: 'custom', from: '2026-03-10', to: '' }, now);
  assert.ok(isInRange(localIso(2030, 0, 1), fromOnly));
  assert.ok(!isInRange(localIso(2026, 2, 9), fromOnly));
  const toOnly = resolveDateRange({ datePreset: 'custom', from: '', to: '2026-03-10' }, now);
  assert.ok(isInRange(localIso(2001, 0, 1), toOnly));
});

test('a wrong custom range gives no range and a message', () => {
  assert.equal(resolveDateRange({ datePreset: 'custom', from: '2026-03-12', to: '2026-03-10' }, now), null);
  assert.match(customRangeProblem('2026-03-12', '2026-03-10'), /before/);
  assert.match(customRangeProblem('', ''), /at least one/);
  assert.match(customRangeProblem('2026-02-31', ''), /Check/);
  assert.equal(customRangeProblem('2026-03-10', ''), null);
});
