/**
 * Validation for every kind of data we store.
 * Each validate function returns a LIST of problems. An empty list means "valid".
 * The repositories use these before saving, and the backup import uses them
 * to check a file before it touches your real data. One set of rules, used everywhere.
 */

export const ACCOUNT_TYPES = ['cash', 'bank', 'upi', 'credit'];
export const TRANSACTION_TYPES = ['income', 'expense', 'transfer'];
export const CATEGORY_KINDS = ['income', 'expense'];
export const MAX_NAME_LENGTH = 40;

/** Settings we know about, and the value each has before the user changes it. */
export const SETTING_DEFAULTS = Object.freeze({
  theme: null, // null = not chosen yet (follow the phone)
  lastBackupAt: null,
  seeded: false, // true after the default categories were added
  lastAccountId: null, // the account of the last new transaction (the Add flow starts with it)
});

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isName = (value) => isText(value) && value.length <= MAX_NAME_LENGTH;
const isPaise = (value) => Number.isSafeInteger(value);
// The shape check stops loose values like "5", which Date.parse() would accept.
const isDateText = (value) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(Date.parse(value));

/** Keep only the messages of the rules that failed. */
function collect(rules) {
  return rules.filter(([ok]) => !ok).map(([, message]) => message);
}

/**
 * Clean text typed by a person: remove spaces at the start and end.
 * @param {unknown} value
 * @returns {unknown} A trimmed string, or the value itself if it is not a string.
 */
export function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : value;
}

/**
 * Stop with a clear error if there are problems.
 * @param {string} label  What we checked. Example: "accounts"
 * @param {string[]} errors  Result of a validate function.
 */
export function assertValid(label, errors) {
  if (errors.length > 0) throw new Error(`Invalid ${label}: ${errors.join('; ')}`);
}

/**
 * @param {unknown} account
 * @returns {string[]} Problems found (empty if valid).
 */
export function validateAccount(account) {
  if (!isObject(account)) return ['account must be an object'];
  return collect([
    [isText(account.id), 'id is missing'],
    [isName(account.name), `name is required (max ${MAX_NAME_LENGTH} letters)`],
    [ACCOUNT_TYPES.includes(account.type), `type must be one of: ${ACCOUNT_TYPES.join(', ')}`],
    [isPaise(account.openingBalance), 'openingBalance must be a whole number of paise'],
    [isText(account.currency), 'currency is missing'],
    [typeof account.archived === 'boolean', 'archived must be true or false'],
    [isDateText(account.createdAt), 'createdAt must be an ISO date'],
  ]);
}

/**
 * @param {unknown} category
 * @returns {string[]} Problems found (empty if valid).
 */
export function validateCategory(category) {
  if (!isObject(category)) return ['category must be an object'];
  return collect([
    [isText(category.id), 'id is missing'],
    [isName(category.name), `name is required (max ${MAX_NAME_LENGTH} letters)`],
    [isText(category.icon), 'icon is missing'],
    [isText(category.color), 'color is missing'],
    [CATEGORY_KINDS.includes(category.kind), 'kind must be income or expense'],
    [typeof category.archived === 'boolean', 'archived must be true or false'],
  ]);
}

/** Rules that only apply to a transfer. */
function transferRules(txn) {
  return [
    [isText(txn.toAccountId), 'a transfer needs toAccountId'],
    [txn.toAccountId !== txn.accountId, 'a transfer must go to a different account'],
    [txn.categoryId == null, 'a transfer cannot have a category'],
  ];
}

/** Rules that only apply to income and expense. */
function categoryRules(txn) {
  return [
    [isText(txn.categoryId), 'categoryId is required'],
    [txn.toAccountId == null, 'only a transfer can have toAccountId'],
  ];
}

/**
 * @param {unknown} txn
 * @returns {string[]} Problems found (empty if valid).
 */
export function validateTransaction(txn) {
  if (!isObject(txn)) return ['transaction must be an object'];
  const common = [
    [isText(txn.id), 'id is missing'],
    [TRANSACTION_TYPES.includes(txn.type), `type must be one of: ${TRANSACTION_TYPES.join(', ')}`],
    [isPaise(txn.amount) && txn.amount > 0, 'amount must be a positive whole number of paise'],
    [isDateText(txn.date), 'date must be an ISO date'],
    [isText(txn.accountId), 'accountId is missing'],
    [typeof txn.note === 'string', 'note must be text'],
    [Array.isArray(txn.tags) && txn.tags.every((tag) => typeof tag === 'string'), 'tags must be a list of text'],
    [isDateText(txn.createdAt), 'createdAt must be an ISO date'],
    [isDateText(txn.updatedAt), 'updatedAt must be an ISO date'],
  ];
  const typeRules = txn.type === 'transfer' ? transferRules(txn) : categoryRules(txn);
  return collect([...common, ...typeRules]);
}

/**
 * @param {unknown} budget
 * @returns {string[]} Problems found (empty if valid).
 */
export function validateBudget(budget) {
  if (!isObject(budget)) return ['budget must be an object'];
  return collect([
    [isText(budget.id), 'id is missing'],
    [isText(budget.categoryId), 'categoryId is missing'],
    [isPaise(budget.monthlyLimit) && budget.monthlyLimit > 0, 'monthlyLimit must be a positive whole number of paise'],
  ]);
}

/**
 * @param {string} key  One of the keys in SETTING_DEFAULTS.
 * @param {unknown} value
 * @returns {string[]} Problems found (empty if valid).
 */
export function validateSetting(key, value) {
  if (!Object.hasOwn(SETTING_DEFAULTS, key)) return [`unknown setting: ${key}`];
  const rules = {
    theme: [value === null || value === 'light' || value === 'dark', 'theme must be null, "light" or "dark"'],
    lastBackupAt: [value === null || isDateText(value), 'lastBackupAt must be null or an ISO date'],
    seeded: [typeof value === 'boolean', 'seeded must be true or false'],
    lastAccountId: [value === null || isText(value), 'lastAccountId must be null or an account id'],
  };
  return collect([rules[key]]);
}
