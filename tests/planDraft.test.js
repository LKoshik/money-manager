import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlanDraft, planDraftToInput, draftTotals, PRESET_BUCKETS } from '../src/core/planDraft.js';
import { makePlan } from './helpers.js';

let counter = 0;
const makeId = () => `id${(counter += 1)}`;
const draftWith = (incomeText, rows) => ({ incomeText, rows: rows.map(([name, amountText], index) => ({ id: `r${index}`, name, amountText })) });

test('a new draft starts with the preset buckets, all empty', () => {
  const draft = createPlanDraft(null, makeId);
  assert.equal(draft.incomeText, '');
  assert.deepEqual(draft.rows.map((row) => row.name), PRESET_BUCKETS);
  assert.ok(draft.rows.every((row) => row.amountText === ''));
  assert.equal(new Set(draft.rows.map((row) => row.id)).size, draft.rows.length);
});

test('editing a plan gives its income and buckets back as text', () => {
  const draft = createPlanDraft(makePlan({ income: 5050050 }));
  assert.equal(draft.incomeText, '50500.5');
  assert.deepEqual(draft.rows, [
    { id: 'b1', name: 'Rent / needs', amountText: '30000' },
    { id: 'b2', name: 'Savings', amountText: '10000' },
  ]);
});

test('a draft becomes paise input; unused rows (no amount) are dropped', () => {
  const { input, problems } = planDraftToInput(draftWith('50,000'.replace(',', ''), [['Rent / needs', '30000'], ['Sent home', ''], ['Savings', '0'], ['Fun', '1250.50']]));
  assert.deepEqual(problems, []);
  assert.equal(input.income, 5000000);
  assert.deepEqual(input.buckets, [
    { id: 'r0', name: 'Rent / needs', amount: 3000000 },
    { id: 'r3', name: 'Fun', amount: 125050 },
  ]);
});

test('problems: no income, an amount without a name, a name that is too long, too many buckets', () => {
  assert.deepEqual(planDraftToInput(draftWith('', [])).problems, ['Enter your monthly income.']);
  assert.deepEqual(planDraftToInput(draftWith('0', [])).problems, ['Enter your monthly income.']);
  assert.deepEqual(planDraftToInput(draftWith('100', [['  ', '10']])).problems, ['Give every bucket a name.']);
  assert.deepEqual(planDraftToInput(draftWith('100', [['x'.repeat(41), '10']])).problems, ['Use at most 40 letters for a bucket name.']);
  const many = Array.from({ length: 31 }, (_, index) => [`b${index}`, '1']);
  assert.deepEqual(planDraftToInput(draftWith('100', many)).problems, ['Use at most 30 buckets.']);
});

test('the same problem is said once, and names are trimmed', () => {
  assert.equal(planDraftToInput(draftWith('100', [['', '10'], ['', '20']])).problems.length, 1);
  assert.equal(planDraftToInput(draftWith('100', [['  Rent  ', '10']])).input.buckets[0].name, 'Rent');
});

test('buckets above the income are allowed (only a warning), the input stays valid', () => {
  const { input, problems } = planDraftToInput(draftWith('100', [['Rent', '150']]));
  assert.deepEqual(problems, []);
  assert.equal(input.income, 10000);
});

test('draftTotals: live numbers while typing, half-typed values count as 0', () => {
  assert.deepEqual(draftTotals(draftWith('', [])), { income: 0, bucketsTotal: 0, allowance: 0, overBy: 0 });
  assert.deepEqual(draftTotals(draftWith('1000.', [['a', '300'], ['b', '.'], ['c', '']])), { income: 100000, bucketsTotal: 30000, allowance: 70000, overBy: 0 });
  assert.equal(draftTotals(draftWith('100', [['a', '150']])).overBy, 5000);
});
