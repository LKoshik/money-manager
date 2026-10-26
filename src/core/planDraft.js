/** The form data of the plan sheet: a plan into a draft, and a draft into a plan. Pure. */

import { MAX_NAME_LENGTH } from './validate.js';
import { MAX_BUCKETS } from './validatePlans.js';
import { paiseToText, textToPaise } from './amountInput.js';
import { summarizePlan } from './planModel.js';

/** The buckets a new plan starts with. They stay unused until an amount is typed. */
export const PRESET_BUCKETS = ['Rent / needs', 'Sent home', 'Savings', 'Emergency fund'];

const newId = () => crypto.randomUUID();

/**
 * @param {{income: number, buckets: Array<{id: string, name: string, amount: number}>}|null} [plan]  Give a plan to edit it.
 * @param {() => string} [makeId]  Makes ids for new rows (tests pass their own).
 * @returns {{incomeText: string, rows: Array<{id: string, name: string, amountText: string}>}}
 */
export function createPlanDraft(plan = null, makeId = newId) {
  if (!plan) return { incomeText: '', rows: PRESET_BUCKETS.map((name) => ({ id: makeId(), name, amountText: '' })) };
  return {
    incomeText: plan.income > 0 ? paiseToText(plan.income) : '',
    rows: plan.buckets.map((bucket) => ({ id: bucket.id, name: bucket.name, amountText: paiseToText(bucket.amount) })),
  };
}

/**
 * Check the draft and build the repository input.
 * A row without an amount (or 0) is simply not used, so the preset rows can stay empty. An amount without a name is a problem.
 * @param {{incomeText: string, rows: Array<{id: string, name: string, amountText: string}>}} draft
 * @returns {{input: {income: number, buckets: object[]}, problems: string[]}} Save only when problems is empty.
 */
export function planDraftToInput(draft) {
  const problems = [];
  const income = textToPaise(draft.incomeText);
  if (!income || income <= 0) problems.push('Enter your monthly income.');
  const buckets = [];
  for (const row of draft.rows) {
    const name = row.name.trim();
    const amount = textToPaise(row.amountText);
    if (!amount || amount <= 0) continue;
    if (!name) problems.push('Give every bucket a name.');
    else if (name.length > MAX_NAME_LENGTH) problems.push(`Use at most ${MAX_NAME_LENGTH} letters for a bucket name.`);
    buckets.push({ id: row.id, name, amount });
  }
  if (buckets.length > MAX_BUCKETS) problems.push(`Use at most ${MAX_BUCKETS} buckets.`);
  return { input: { income: income ?? 0, buckets }, problems: [...new Set(problems)] };
}

/**
 * The numbers to show WHILE typing (half-typed values count as 0).
 * @param {{incomeText: string, rows: Array<{amountText: string}>}} draft
 * @returns {{income: number, bucketsTotal: number, allowance: number, overBy: number}}
 */
export function draftTotals(draft) {
  const amountOf = (text) => Math.max(0, textToPaise(text) ?? 0);
  return summarizePlan({ income: amountOf(draft.incomeText), buckets: draft.rows.map((row) => ({ amount: amountOf(row.amountText) })) });
}
