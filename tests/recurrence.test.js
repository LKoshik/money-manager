import { test } from 'node:test';
import assert from 'node:assert/strict';
import { occurrenceDate, dueOccurrences, skipToNext, nextOccurrence } from '../src/core/recurrence.js';
import { makeRule, localIso } from './helpers.js';

const parts = (date) => [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours()];
const dayOf = (iso) => parts(new Date(iso)).slice(0, 3).join('-');

test('monthly on the 31st: short months do not drag later months down', () => {
  const rule = makeRule({ startDate: localIso(2026, 0, 31) });
  const days = [0, 1, 2, 3, 4].map((n) => parts(occurrenceDate(rule, n)));
  assert.deepEqual(days, [[2026, 1, 31, 12], [2026, 2, 28, 12], [2026, 3, 31, 12], [2026, 4, 30, 12], [2026, 5, 31, 12]]);
});

test('monthly: leap February and the year change', () => {
  const rule = makeRule({ startDate: localIso(2027, 10, 30) });
  assert.deepEqual(parts(occurrenceDate(rule, 3)), [2028, 2, 29, 12]); // 30 Nov 2027 + 3 months
  assert.deepEqual(parts(occurrenceDate(rule, 2)), [2028, 1, 30, 12]);
});

test('yearly on 29 Feb gives 28 Feb in other years', () => {
  const rule = makeRule({ frequency: 'yearly', startDate: localIso(2028, 1, 29) });
  assert.deepEqual(parts(occurrenceDate(rule, 1)), [2029, 2, 28, 12]);
  assert.deepEqual(parts(occurrenceDate(rule, 4)), [2032, 2, 29, 12]);
});

test('weekly is +7 local days at local 12:00, also over DST changes', () => {
  const rule = makeRule({ frequency: 'weekly', startDate: localIso(2026, 1, 1) });
  const start = new Date(rule.startDate);
  for (let n = 0; n < 60; n += 1) {
    const date = occurrenceDate(rule, n);
    assert.equal(date.getHours(), 12, `week ${n} is not at 12:00`);
    assert.equal(date.getDay(), start.getDay());
    assert.equal(date.getDate(), new Date(2026, 1, 1 + 7 * n).getDate());
  }
});

test('dueOccurrences: everything up to now, oldest first', () => {
  const rule = makeRule({ startDate: localIso(2026, 7, 31) });
  const now = new Date(2026, 9, 31, 12);
  assert.deepEqual(dueOccurrences(rule, now).map(dayOf), ['2026-8-31', '2026-9-30', '2026-10-31']);
  assert.equal(dueOccurrences(rule, new Date(2026, 9, 31, 11, 59)).length, 2); // not yet 12:00 on the 31st
});

test('dueOccurrences continues after generatedCount and is empty when up to date', () => {
  const rule = makeRule({ startDate: localIso(2026, 7, 31), generatedCount: 2 });
  assert.deepEqual(dueOccurrences(rule, new Date(2026, 9, 31, 12)).map(dayOf), ['2026-10-31']);
  assert.deepEqual(dueOccurrences({ ...rule, generatedCount: 3 }, new Date(2026, 9, 31, 12)), []);
});

test('dueOccurrences: nothing before the start date', () => {
  assert.deepEqual(dueOccurrences(makeRule({ startDate: localIso(2027, 0, 1) }), new Date(2026, 9, 25)), []);
});

test('dueOccurrences stops at the end date (the end day itself is included)', () => {
  const now = new Date(2026, 11, 31);
  const rule = makeRule({ startDate: localIso(2026, 7, 31), endDate: localIso(2026, 8, 30) });
  assert.deepEqual(dueOccurrences(rule, now).map(dayOf), ['2026-8-31', '2026-9-30']);
  assert.deepEqual(dueOccurrences({ ...rule, endDate: localIso(2026, 8, 29) }, now).map(dayOf), ['2026-8-31']);
});

test('dueOccurrences: at most 100 per run (or the cap you give)', () => {
  const rule = makeRule({ frequency: 'weekly', startDate: localIso(2020, 0, 1) });
  const now = new Date(2026, 9, 25);
  assert.equal(dueOccurrences(rule, now).length, 100);
  assert.equal(dueOccurrences(rule, now, 5).length, 5);
  const next = dueOccurrences({ ...rule, generatedCount: 100 }, now);
  assert.equal(dayOf(next[0]), dayOf(occurrenceDate(rule, 100).toISOString())); // the next run continues, no gap
});

test('skipToNext: continues after now, never goes backwards', () => {
  const rule = makeRule({ startDate: localIso(2026, 7, 31) });
  const now = new Date(2026, 9, 15);
  const skipped = skipToNext(rule, now);
  assert.equal(skipped, 2);
  assert.deepEqual(dueOccurrences({ ...rule, generatedCount: skipped }, now), []);
  assert.equal(dayOf(nextOccurrence({ ...rule, generatedCount: skipped })), '2026-10-31');
  assert.equal(skipToNext({ ...rule, generatedCount: 7 }, now), 7);
});

test('nextOccurrence is null after the end date', () => {
  const rule = makeRule({ endDate: localIso(2026, 9, 20), generatedCount: 1 });
  assert.equal(nextOccurrence(rule), null);
  assert.equal(dayOf(nextOccurrence({ ...rule, generatedCount: 0 })), '2026-10-5');
});
