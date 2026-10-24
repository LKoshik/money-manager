import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  toDayKey,
  toMonthKey,
  getMonthRange,
  getCurrentMonthRange,
  monthKeyToRange,
  isInRange,
  getLastMonthKeys,
  groupByDay,
  daysSince,
} from '../src/core/dates.js';
import { localIso } from './helpers.js';

test('toDayKey and toMonthKey use the LOCAL day', () => {
  // 00:30 local time on the 24th, whatever time zone this computer uses.
  const iso = localIso(2026, 9, 24, 0);
  assert.equal(toDayKey(iso), '2026-10-24');
  assert.equal(toMonthKey(iso), '2026-10');
});

test('toDayKey and toMonthKey return null for bad dates', () => {
  assert.equal(toDayKey('not a date'), null);
  assert.equal(toMonthKey(undefined), null);
});

test('getMonthRange: start is the 1st, end is the 1st of next month', () => {
  const range = getMonthRange(2026, 9);
  assert.equal(range.start, localIso(2026, 9, 1, 0));
  assert.equal(range.end, localIso(2026, 10, 1, 0));
});

test('getMonthRange: December ends in January of next year', () => {
  assert.equal(getMonthRange(2026, 11).end, localIso(2027, 0, 1, 0));
});

test('getCurrentMonthRange uses the month of "now"', () => {
  const range = getCurrentMonthRange(new Date(2026, 1, 14, 9));
  assert.equal(range.start, localIso(2026, 1, 1, 0));
  assert.equal(range.end, localIso(2026, 2, 1, 0));
});

test('monthKeyToRange: valid and invalid keys', () => {
  assert.deepEqual(monthKeyToRange('2026-10'), getMonthRange(2026, 9));
  assert.equal(monthKeyToRange('2026-13'), null);
  assert.equal(monthKeyToRange('hello'), null);
});

test('isInRange: start is included, end is not', () => {
  const range = getMonthRange(2026, 9);
  assert.equal(isInRange(range.start, range), true);
  assert.equal(isInRange(localIso(2026, 9, 31, 23), range), true);
  assert.equal(isInRange(range.end, range), false);
  assert.equal(isInRange(localIso(2026, 8, 30), range), false);
  assert.equal(isInRange('bad date', range), false);
});

test('getLastMonthKeys: oldest first, crosses the year border', () => {
  const now = new Date(2026, 1, 10);
  assert.deepEqual(getLastMonthKeys(4, now), ['2025-11', '2025-12', '2026-01', '2026-02']);
  assert.deepEqual(getLastMonthKeys(1, now), ['2026-02']);
});

test('groupByDay: newest day first, newest item first inside a day', () => {
  const a = { id: 'a', date: localIso(2026, 9, 14, 9) };
  const b = { id: 'b', date: localIso(2026, 9, 15, 8) };
  const c = { id: 'c', date: localIso(2026, 9, 15, 20) };
  const groups = groupByDay([a, b, c]);
  assert.deepEqual(groups.map((g) => g.day), ['2026-10-15', '2026-10-14']);
  assert.deepEqual(groups[0].items.map((t) => t.id), ['c', 'b']);
  assert.deepEqual(groups[1].items.map((t) => t.id), ['a']);
});

test('groupByDay: empty list and bad dates', () => {
  assert.deepEqual(groupByDay([]), []);
  assert.deepEqual(groupByDay([{ id: 'x', date: 'oops' }]), []);
});

test('groupByDay does not change the list it receives', () => {
  const list = [
    { id: 'a', date: localIso(2026, 9, 14) },
    { id: 'b', date: localIso(2026, 9, 15) },
  ];
  groupByDay(list);
  assert.deepEqual(list.map((t) => t.id), ['a', 'b']);
});

test('daysSince: counts full days, and null when there is no date', () => {
  const now = new Date(2026, 9, 23, 12);
  assert.equal(daysSince(localIso(2026, 9, 20, 12), now), 3);
  assert.equal(daysSince(localIso(2026, 9, 23, 6), now), 0);
  assert.equal(daysSince(null, now), null);
  assert.equal(daysSince('nope', now), null);
});
