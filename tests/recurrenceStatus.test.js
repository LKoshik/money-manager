import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blockedReason, scheduleLabel } from '../src/core/recurrenceStatus.js';
import { makeRule, makeAccount, makeCategory, localIso } from './helpers.js';

const maps = (accounts, categories) => [new Map(accounts.map((a) => [a.id, a])), new Map(categories.map((c) => [c.id, c]))];

test('blockedReason: archived or missing account and category', () => {
  const rule = makeRule();
  assert.equal(blockedReason(rule, ...maps([makeAccount()], [makeCategory()])), null);
  assert.equal(blockedReason(rule, ...maps([makeAccount({ archived: true })], [makeCategory()])), 'Account archived');
  assert.equal(blockedReason(rule, ...maps([], [makeCategory()])), 'Account missing');
  assert.equal(blockedReason(rule, ...maps([makeAccount()], [makeCategory({ archived: true })])), 'Category archived');
  assert.equal(blockedReason(rule, ...maps([makeAccount()], [])), 'Category missing');
});

test('blockedReason: a transfer checks both accounts and has no category', () => {
  const rule = makeRule({ type: 'transfer', toAccountId: 'bank', categoryId: null });
  const cash = makeAccount();
  assert.equal(blockedReason(rule, ...maps([cash, makeAccount({ id: 'bank', archived: true })], [])), 'Account archived');
  assert.equal(blockedReason(rule, ...maps([cash, makeAccount({ id: 'bank' })], [])), null);
});

test('scheduleLabel: next date, year only when it differs, paused, ended', () => {
  const now = new Date(2026, 9, 25);
  assert.equal(scheduleLabel(makeRule({ generatedCount: 1 }), now), 'Monthly · next 5 Nov');
  assert.equal(scheduleLabel(makeRule({ generatedCount: 3 }), now), 'Monthly · next 5 Jan 2027');
  assert.equal(scheduleLabel(makeRule({ frequency: 'weekly', active: false }), now), 'Weekly · paused');
  assert.equal(scheduleLabel(makeRule({ endDate: localIso(2026, 9, 20), generatedCount: 1 }), now), 'Monthly · ended');
});
