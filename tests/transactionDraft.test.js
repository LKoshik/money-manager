import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createDraft, changeDraftType, draftToInput, pickDefaultAccount,
  selectableAccounts, selectableCategories, hasAmount,
} from '../src/core/transactionDraft.js';
import { makeAccount, makeCategory, makeTxn } from './helpers.js';

const cash = makeAccount({ id: 'cash' });
const bank = makeAccount({ id: 'bank', type: 'bank', name: 'Bank' });
const old = makeAccount({ id: 'old', archived: true });
const accounts = [cash, bank, old];
const now = new Date(2026, 9, 24, 14, 30, 45);

test('pickDefaultAccount: last used, else first active, never archived', () => {
  assert.equal(pickDefaultAccount(accounts, 'bank'), 'bank');
  assert.equal(pickDefaultAccount(accounts, 'old'), 'cash');
  assert.equal(pickDefaultAccount(accounts, 'gone'), 'cash');
  assert.equal(pickDefaultAccount([old], null), null);
  assert.equal(pickDefaultAccount(accounts, 'cash', 'cash'), 'bank');
});

test('selectable lists hide archived items unless they are in use', () => {
  assert.deepEqual(selectableAccounts(accounts).map((a) => a.id), ['cash', 'bank']);
  assert.deepEqual(selectableAccounts(accounts, ['old']).map((a) => a.id), ['cash', 'bank', 'old']);
  const cats = [makeCategory(), makeCategory({ id: 'x', archived: true }), makeCategory({ id: 'salary', kind: 'income' })];
  assert.deepEqual(selectableCategories(cats, 'expense').map((c) => c.id), ['food']);
  assert.deepEqual(selectableCategories(cats, 'expense', 'x').map((c) => c.id), ['food', 'x']);
});

test('createDraft for a new transaction', () => {
  const draft = createDraft({ accounts, lastAccountId: 'bank', now });
  assert.equal(draft.type, 'expense');
  assert.equal(draft.accountId, 'bank');
  assert.equal(draft.dateLocal, '2026-10-24T14:30');
  assert.equal(draft.amountText, '');
});

test('createDraft for an existing transaction', () => {
  const txn = makeTxn({ amount: 25050, note: 'Tea', tags: ['a'] });
  const draft = createDraft({ transaction: txn, accounts });
  assert.equal(draft.amountText, '250.5');
  assert.equal(draft.note, 'Tea');
  assert.notEqual(draft.tags, txn.tags);
});

test('changeDraftType clears the category and picks a second account for a transfer', () => {
  const draft = { ...createDraft({ accounts }), categoryId: 'food' };
  const transfer = changeDraftType(draft, 'transfer', accounts);
  assert.equal(transfer.categoryId, null);
  assert.equal(transfer.toAccountId, 'bank');
  assert.equal(changeDraftType(transfer, 'income', accounts).toAccountId, null);
  assert.equal(changeDraftType(draft, 'expense', accounts), draft);
});

test('hasAmount', () => {
  assert.equal(hasAmount('0'), false);
  assert.equal(hasAmount(''), false);
  assert.equal(hasAmount('0.01'), true);
});

test('draftToInput: a good expense', () => {
  const draft = { ...createDraft({ accounts, now }), amountText: '250.5', categoryId: 'food', note: '  Lunch ' };
  const { input, problems } = draftToInput(draft);
  assert.deepEqual(problems, []);
  assert.equal(input.amount, 25050);
  assert.equal(input.note, 'Lunch');
  assert.equal(input.date, new Date(2026, 9, 24, 14, 30).toISOString());
  assert.equal(input.toAccountId, null);
});

test('draftToInput: problems are in simple words', () => {
  const { problems } = draftToInput(createDraft({ accounts: [], now }));
  assert.deepEqual(problems, ['Enter an amount greater than zero.', 'Pick a category.', 'Pick an account.']);
});

test('draftToInput: transfer rules', () => {
  const base = { ...createDraft({ accounts, now }), type: 'transfer', amountText: '10', toAccountId: null };
  assert.deepEqual(draftToInput(base).problems, ['Pick the account the money goes to.']);
  assert.deepEqual(draftToInput({ ...base, toAccountId: 'cash' }).problems, ['Choose two different accounts.']);
  const good = draftToInput({ ...base, toAccountId: 'bank', categoryId: 'food' });
  assert.deepEqual(good.problems, []);
  assert.equal(good.input.categoryId, null);
});

test('draftToInput: an untouched date keeps its seconds, a changed one is used', () => {
  const when = new Date(2026, 9, 20, 9, 5, 33).toISOString();
  const txn = makeTxn({ date: when });
  const draft = createDraft({ transaction: txn, accounts });
  assert.equal(draftToInput(draft).input.date, when);
  const changed = draftToInput({ ...draft, dateLocal: '2026-10-21T10:00' });
  assert.equal(changed.input.date, new Date(2026, 9, 21, 10, 0).toISOString());
  assert.deepEqual(draftToInput({ ...draft, dateLocal: '' }).problems, ['Check the date and time.']);
});
