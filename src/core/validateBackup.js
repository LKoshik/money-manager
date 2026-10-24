/**
 * Check a backup file BEFORE we use it. If anything is wrong we refuse the
 * whole file, so a damaged file can never ruin the data already in the app.
 */

import {
  validateAccount,
  validateCategory,
  validateTransaction,
  validateBudget,
} from './validate.js';

/** The id written into every backup file made by this app. */
export const BACKUP_APP_ID = 'money-manager';
const MAX_ERRORS = 20;

const ENTITY_VALIDATORS = [
  ['accounts', validateAccount],
  ['categories', validateCategory],
  ['transactions', validateTransaction],
  ['budgets', validateBudget],
];

/** Check each item, and check that ids are not used twice. */
function checkEntities(data, errors) {
  for (const [name, validate] of ENTITY_VALIDATORS) {
    const list = data[name];
    if (!Array.isArray(list)) {
      errors.push(`data.${name} must be a list`);
      continue;
    }
    const seen = new Set();
    list.forEach((item, index) => {
      for (const problem of validate(item)) errors.push(`${name}[${index}]: ${problem}`);
      if (seen.has(item?.id)) errors.push(`${name}[${index}]: id is used twice`);
      seen.add(item?.id);
    });
  }
}

/** Check that every link points to something that exists. */
function checkLinks(data, errors) {
  const accountIds = new Set(data.accounts.map((a) => a.id));
  const categoryIds = new Set(data.categories.map((c) => c.id));
  data.transactions.forEach((txn, index) => {
    if (!accountIds.has(txn.accountId)) errors.push(`transactions[${index}]: account not found`);
    if (txn.type === 'transfer' && !accountIds.has(txn.toAccountId)) {
      errors.push(`transactions[${index}]: destination account not found`);
    }
    if (txn.type !== 'transfer' && !categoryIds.has(txn.categoryId)) {
      errors.push(`transactions[${index}]: category not found`);
    }
  });
  const budgeted = new Set();
  data.budgets.forEach((budget, index) => {
    if (!categoryIds.has(budget.categoryId)) errors.push(`budgets[${index}]: category not found`);
    if (budgeted.has(budget.categoryId)) errors.push(`budgets[${index}]: second budget for one category`);
    budgeted.add(budget.categoryId);
  });
}

/** Check the outer part of the file (who made it, which version). */
function checkHeader(backup, maxVersion, errors) {
  if (backup.app !== BACKUP_APP_ID) errors.push('this is not a Money Manager backup file');
  if (!Number.isInteger(backup.schemaVersion) || backup.schemaVersion < 1) {
    errors.push('schemaVersion is missing or wrong');
  } else if (backup.schemaVersion > maxVersion) {
    errors.push('this backup was made by a newer version of the app');
  }
  if (typeof backup.data !== 'object' || backup.data === null) errors.push('data is missing');
}

/**
 * Check a whole backup file (already parsed from JSON).
 * @param {unknown} backup
 * @param {number} maxVersion  Newest schema version this app understands.
 * @returns {string[]} Problems found, at most 20 (empty if the file is fine).
 */
export function validateBackup(backup, maxVersion) {
  if (typeof backup !== 'object' || backup === null) return ['the file is empty or not an object'];
  const errors = [];
  checkHeader(backup, maxVersion, errors);
  if (errors.length === 0) checkEntities(backup.data, errors);
  // Link checks only make sense when every item has the right shape.
  if (errors.length === 0) checkLinks(backup.data, errors);
  if (errors.length <= MAX_ERRORS) return errors;
  return [...errors.slice(0, MAX_ERRORS), `...and ${errors.length - MAX_ERRORS} more problems`];
}
