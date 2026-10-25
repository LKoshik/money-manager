import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRuleDraft, ruleDraftToInput, pastTransactionsText } from '../src/core/recurringDraft.js';
import { makeRule, makeAccount, localIso } from './helpers.js';

const now = new Date(2026, 9, 25, 15, 30);
const filled = (patch = {}) => ({ ...createRuleDraft({ accounts: [makeAccount()], now }), amountText: '1500', categoryId: 'food', ...patch });

test('a new draft is monthly, starts today, has no end', () => {
  const draft = createRuleDraft({ accounts: [makeAccount()], lastAccountId: 'cash', now });
  assert.equal(draft.frequency, 'monthly');
  assert.equal(draft.startDay, '2026-10-25');
  assert.equal(draft.endDay, '');
  assert.equal(draft.accountId, 'cash');
});

test('editing: the draft shows the rule, and back to input gives the same rule fields', () => {
  const rule = makeRule({ endDate: localIso(2027, 4, 5) });
  const draft = createRuleDraft({ rule, accounts: [makeAccount()], now });
  assert.equal(draft.startDay, '2026-10-05');
  assert.equal(draft.endDay, '2027-05-05');
  assert.equal(draft.amountText, '1000');
  const { input, problems } = ruleDraftToInput(draft);
  assert.deepEqual(problems, []);
  assert.equal(input.amount, 100000);
  assert.equal(input.startDate, rule.startDate); // local 12:00 again
  assert.equal(input.endDate, rule.endDate);
  assert.equal(input.frequency, 'monthly');
  assert.equal('tags' in input, false);
});

test('problems: no amount, no category, bad start, end before start, bad end', () => {
  assert.ok(ruleDraftToInput(filled({ amountText: '' })).problems.length > 0);
  assert.ok(ruleDraftToInput(filled({ categoryId: null })).problems.includes('Pick a category.'));
  assert.ok(ruleDraftToInput(filled({ startDay: '' })).problems.includes('Check the start date.'));
  assert.ok(ruleDraftToInput(filled({ endDay: '2026-10-01' })).problems.some((text) => text.includes('end date')));
  assert.ok(ruleDraftToInput(filled({ endDay: '2026-02-31' })).problems.includes('Check the end date.'));
  assert.deepEqual(ruleDraftToInput(filled({ endDay: '2026-10-25' })).problems, []);
});

test('a transfer draft turns into a transfer rule without a category', () => {
  const draft = filled({ type: 'transfer', toAccountId: 'bank', categoryId: null });
  const { input, problems } = ruleDraftToInput(draft);
  assert.deepEqual(problems, []);
  assert.equal(input.categoryId, null);
  assert.equal(input.toAccountId, 'bank');
});

test('pastTransactionsText: counts missed ones for a start date in the past', () => {
  assert.equal(pastTransactionsText(filled({ startDay: '2026-08-31' }), now), 'Adds 2 past transactions');
  assert.equal(pastTransactionsText(filled({ startDay: '2026-09-25' }), now), 'Adds 2 past transactions');
  assert.equal(pastTransactionsText(filled({ startDay: '2026-10-20' }), now), 'Adds 1 past transaction');
  assert.equal(pastTransactionsText(filled({ startDay: '2026-10-26' }), now), '');
  assert.equal(pastTransactionsText(filled({ startDay: 'x' }), now), '');
  assert.equal(pastTransactionsText(filled({ startDay: '2010-01-01', frequency: 'weekly' }), now), 'Adds 100+ past transactions');
});
