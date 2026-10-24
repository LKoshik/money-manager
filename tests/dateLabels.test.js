import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMonthLabel, formatDayLabel } from '../src/core/dateLabels.js';

test('formatMonthLabel: short month, with or without year', () => {
  assert.equal(formatMonthLabel('2026-10'), 'Oct');
  assert.equal(formatMonthLabel('2026-10', true), 'Oct 2026');
});

test('formatDayLabel: Today, Yesterday, and older days', () => {
  const now = new Date(2026, 9, 23, 15);
  assert.equal(formatDayLabel('2026-10-23', now), 'Today');
  assert.equal(formatDayLabel('2026-10-22', now), 'Yesterday');
  assert.equal(formatDayLabel('2026-10-20', now), '20 Oct 2026');
});

test('formatDayLabel: "Yesterday" works on the 1st of a month', () => {
  const now = new Date(2026, 10, 1, 10);
  assert.equal(formatDayLabel('2026-10-31', now), 'Yesterday');
});
