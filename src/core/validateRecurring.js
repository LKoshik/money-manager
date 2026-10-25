/** Validation for recurring rules (rent, salary, subscriptions...). */

import { TRANSACTION_TYPES, typeSpecificRules } from './validate.js';
import { isObject, isText, isPaise, isDateText, collect } from './validateParts.js';
import { toDayKey } from './dates.js';

export const FREQUENCIES = ['weekly', 'monthly', 'yearly'];

// An end date on the same day as the start is fine; before it makes no sense.
const endsAfterStart = (rule) =>
  rule.endDate === null || (isDateText(rule.endDate) && isDateText(rule.startDate) && toDayKey(rule.endDate) >= toDayKey(rule.startDate));

/**
 * @param {unknown} rule
 * @returns {string[]} Problems found (empty if valid).
 */
export function validateRecurring(rule) {
  if (!isObject(rule)) return ['recurring rule must be an object'];
  return collect([
    [isText(rule.id), 'id is missing'],
    [TRANSACTION_TYPES.includes(rule.type), `type must be one of: ${TRANSACTION_TYPES.join(', ')}`],
    [isPaise(rule.amount) && rule.amount > 0, 'amount must be a positive whole number of paise'],
    [isText(rule.accountId), 'accountId is missing'],
    [typeof rule.note === 'string', 'note must be text'],
    [FREQUENCIES.includes(rule.frequency), `frequency must be one of: ${FREQUENCIES.join(', ')}`],
    [isDateText(rule.startDate), 'startDate must be an ISO date'],
    [endsAfterStart(rule), 'endDate must be empty or on/after the start date'],
    [typeof rule.active === 'boolean', 'active must be true or false'],
    [Number.isInteger(rule.generatedCount) && rule.generatedCount >= 0, 'generatedCount must be a whole number, 0 or more'],
    [isDateText(rule.createdAt), 'createdAt must be an ISO date'],
    ...typeSpecificRules(rule),
  ]);
}
