/** Validation for loans (lent / borrowed money) and their repayments. */

import { isObject, isText, isPaise, isDateText, collect } from './validateParts.js';

export const LOAN_DIRECTIONS = ['lent', 'borrowed'];
export const MAX_PERSON_LENGTH = 40;

/**
 * @param {unknown} loan
 * @returns {string[]} Problems found (empty if valid).
 */
export function validateLoan(loan) {
  if (!isObject(loan)) return ['loan must be an object'];
  return collect([
    [isText(loan.id), 'id is missing'],
    [LOAN_DIRECTIONS.includes(loan.direction), `direction must be one of: ${LOAN_DIRECTIONS.join(', ')}`],
    [isText(loan.person) && loan.person.trim().length <= MAX_PERSON_LENGTH, `person must be 1-${MAX_PERSON_LENGTH} characters`],
    [isPaise(loan.amount) && loan.amount > 0, 'amount must be a positive whole number of paise'],
    [isDateText(loan.date), 'date must be an ISO date'],
    [isText(loan.accountId), 'accountId is missing'],
    [loan.dueDate === null || isDateText(loan.dueDate), 'dueDate must be empty or an ISO date'],
    [typeof loan.note === 'string', 'note must be text'],
    [isDateText(loan.createdAt), 'createdAt must be an ISO date'],
  ]);
}

/**
 * @param {unknown} item
 * @returns {string[]} Problems found (empty if valid).
 */
export function validateRepayment(item) {
  if (!isObject(item)) return ['repayment must be an object'];
  return collect([
    [isText(item.id), 'id is missing'],
    [isText(item.loanId), 'loanId is missing'],
    [isPaise(item.amount) && item.amount > 0, 'amount must be a positive whole number of paise'],
    [isDateText(item.date), 'date must be an ISO date'],
    [isText(item.accountId), 'accountId is missing'],
    [typeof item.note === 'string', 'note must be text'],
  ]);
}
