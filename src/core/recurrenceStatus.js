/** Words and checks about a recurring rule for the screen: why it is stuck, when it runs next. */

import { nextOccurrence } from './recurrence.js';

export const FREQUENCY_LABELS = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

/**
 * Why can this rule not create transactions right now?
 * @param {{type: string, accountId: string, toAccountId?: string|null, categoryId?: string|null}} rule
 * @param {Map<string, object>} accountsById
 * @param {Map<string, object>} categoriesById
 * @returns {string|null} A short message, or null when the rule can run.
 */
export function blockedReason(rule, accountsById, categoriesById) {
  const isTransfer = rule.type === 'transfer';
  for (const id of isTransfer ? [rule.accountId, rule.toAccountId] : [rule.accountId]) {
    const account = accountsById.get(id);
    if (!account) return 'Account missing';
    if (account.archived) return 'Account archived';
  }
  if (isTransfer) return null;
  const category = categoriesById.get(rule.categoryId);
  if (!category) return 'Category missing';
  return category.archived ? 'Category archived' : null;
}

function formatDay(iso, now) {
  const date = new Date(iso);
  const options = { day: 'numeric', month: 'short' };
  if (date.getFullYear() !== now.getFullYear()) options.year = 'numeric'; // far dates need the year
  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

/**
 * The grey line under a rule. Example: "Monthly · next 5 Nov".
 * @param {object} rule  A recurring rule.
 * @param {Date} [now=new Date()]
 * @returns {string}
 */
export function scheduleLabel(rule, now = new Date()) {
  const word = FREQUENCY_LABELS[rule.frequency];
  if (!rule.active) return `${word} · paused`;
  const next = nextOccurrence(rule);
  return next ? `${word} · next ${formatDay(next, now)}` : `${word} · ended`;
}
