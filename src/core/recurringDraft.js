/** The form data of the recurring sheet: turning a rule into a draft and a draft into a rule. Pure. */

import { createDraft, draftToInput } from './transactionDraft.js';
import { fromLocalInputValue } from './dateInput.js';
import { toDayKey } from './dates.js';
import { dueOccurrences, MAX_PER_RUN } from './recurrence.js';

/**
 * Make the starting draft.
 * @param {{rule?: object|null, accounts?: object[], lastAccountId?: string|null, now?: Date}} options
 *   Give a rule to edit it; give none for a new one (monthly, starting today).
 * @returns {object} A transaction draft plus frequency, startDay and endDay ("YYYY-MM-DD", "" = no end).
 */
export function createRuleDraft({ rule = null, accounts = [], lastAccountId = null, now = new Date() } = {}) {
  const asTransaction = rule && { ...rule, date: rule.startDate, tags: [] };
  const base = createDraft({ transaction: asTransaction, accounts, lastAccountId, now });
  return {
    ...base,
    dateOriginal: null, // the start day is always rebuilt at local 12:00
    frequency: rule?.frequency ?? 'monthly',
    startDay: toDayKey(rule ? rule.startDate : now.toISOString()),
    endDay: rule?.endDate ? toDayKey(rule.endDate) : '',
  };
}

/**
 * Check the draft and build the repository input.
 * @param {object} draft
 * @returns {{input: object, problems: string[]}} Save only when problems is empty.
 */
export function ruleDraftToInput(draft) {
  const { input, problems } = draftToInput({ ...draft, dateLocal: `${draft.startDay}T12:00` });
  const issues = problems.map((text) => (text === 'Check the date and time.' ? 'Check the start date.' : text));
  let endDate = null;
  if (draft.endDay) {
    endDate = fromLocalInputValue(`${draft.endDay}T12:00`);
    if (!endDate) issues.push('Check the end date.');
    else if (draft.endDay < draft.startDay) issues.push('The end date must be on or after the start date.');
  }
  const { date, tags, ...rest } = input; // a rule has no tags and calls its date "startDate"
  return { input: { ...rest, frequency: draft.frequency, startDate: date, endDate }, problems: issues };
}

/**
 * The sentence under the start date of a NEW rule.
 * @param {object} draft
 * @param {Date} [now=new Date()]
 * @returns {string} Example: "Adds 3 past transactions", or "" when none are missed.
 */
export function pastTransactionsText(draft, now = new Date()) {
  const { input } = ruleDraftToInput(draft);
  if (!input.startDate) return '';
  const count = dueOccurrences({ ...input, generatedCount: 0 }, now).length;
  if (count === 0) return '';
  const shown = count >= MAX_PER_RUN ? `${MAX_PER_RUN}+` : String(count);
  return `Adds ${shown} past transaction${count === 1 ? '' : 's'}`;
}
