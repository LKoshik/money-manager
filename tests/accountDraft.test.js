import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAccountDraft, accountDraftToInput, balanceLabel } from '../src/core/accountDraft.js';
import { splitAccounts, ACCOUNT_TYPE_INFO } from '../src/core/accountList.js';
import { ACCOUNT_TYPES } from '../src/core/validate.js';
import { makeAccount, localIso } from './helpers.js';

test('balanceLabel: a credit card asks for the amount owed', () => {
  assert.equal(balanceLabel('credit'), 'Amount you owe');
  assert.equal(balanceLabel('bank'), 'Opening balance');
});

test('accountDraftToInput: normal account', () => {
  const { input, problems } = accountDraftToInput({ name: ' Cash ', type: 'cash', balanceText: '1500.5' });
  assert.deepEqual(problems, []);
  assert.deepEqual(input, { name: 'Cash', type: 'cash', openingBalance: 150050 });
});

test('accountDraftToInput: empty balance is zero (never -0), credit card owes', () => {
  assert.equal(Object.is(accountDraftToInput({ name: 'A', type: 'credit', balanceText: '' }).input.openingBalance, 0), true);
  assert.equal(accountDraftToInput({ name: 'Card', type: 'credit', balanceText: '500' }).input.openingBalance, -50000);
});

test('accountDraftToInput: problems', () => {
  assert.deepEqual(accountDraftToInput({ name: ' ', type: 'cash', balanceText: '' }).problems, ['Give the account a name.']);
  assert.match(accountDraftToInput({ name: 'x'.repeat(41), type: 'cash', balanceText: '' }).problems[0], /at most 40/);
  assert.match(accountDraftToInput({ name: 'A', type: 'cash', balanceText: '-5' }).problems[0], /valid amount/);
  assert.deepEqual(accountDraftToInput({ name: 'A', type: 'gold', balanceText: '' }).problems, ['Choose a type.']);
});

test('createAccountDraft: new, editing, and credit card sign', () => {
  assert.deepEqual(createAccountDraft(), { name: '', type: 'cash', balanceText: '' });
  assert.equal(createAccountDraft(makeAccount({ openingBalance: 12345 })).balanceText, '123.45');
  assert.equal(createAccountDraft(makeAccount({ type: 'credit', openingBalance: -50000 })).balanceText, '500');
  assert.equal(createAccountDraft(makeAccount({ openingBalance: 0 })).balanceText, '');
});

test('splitAccounts: active and archived, oldest first', () => {
  const a = makeAccount({ id: 'a', name: 'A', createdAt: localIso(2026, 1, 1) });
  const b = makeAccount({ id: 'b', name: 'B', createdAt: localIso(2026, 0, 1) });
  const c = makeAccount({ id: 'c', name: 'C', archived: true });
  const { active, archived } = splitAccounts([a, b, c]);
  assert.deepEqual(active.map((x) => x.id), ['b', 'a']);
  assert.deepEqual(archived.map((x) => x.id), ['c']);
});

test('every account type has a label and an emoji', () => {
  for (const type of ACCOUNT_TYPES) assert.ok(ACCOUNT_TYPE_INFO[type].label && ACCOUNT_TYPE_INFO[type].emoji, type);
});
