import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeBackup, REMINDER_DAYS } from '../src/core/backupReminder.js';
import { localIso } from './helpers.js';

const now = new Date(2026, 9, 24, 12); // 24 Oct 2026, local time

test('never backed up: reminder only when there is data', () => {
  const withData = describeBackup(null, true, now);
  assert.equal(withData.text, 'No backup yet');
  assert.equal(withData.due, true);
  assert.ok(withData.advice);
  const empty = describeBackup(null, false, now);
  assert.equal(empty.due, false);
  assert.equal(empty.advice, null);
});

test('backed up today and yesterday: friendly words, no reminder', () => {
  assert.equal(describeBackup(localIso(2026, 9, 24, 8), true, now).text, 'Last backup: today');
  assert.equal(describeBackup(localIso(2026, 9, 23, 8), true, now).text, 'Last backup: yesterday');
  assert.equal(describeBackup(localIso(2026, 9, 23, 8), true, now).due, false);
});

test('the reminder starts at exactly 14 days', () => {
  assert.equal(REMINDER_DAYS, 14);
  const thirteen = describeBackup(localIso(2026, 9, 11, 12), true, now);
  assert.equal(thirteen.days, 13);
  assert.equal(thirteen.due, false);
  const fourteen = describeBackup(localIso(2026, 9, 10, 12), true, now);
  assert.equal(fourteen.days, 14);
  assert.equal(fourteen.due, true);
  assert.match(fourteen.text, /14 days ago/);
  assert.match(fourteen.advice, /14 days/);
});

test('a bad or future date does not crash', () => {
  assert.equal(describeBackup('nonsense', true, now).text, 'No backup yet');
  assert.equal(describeBackup(localIso(2026, 9, 30, 12), true, now).due, false);
});
