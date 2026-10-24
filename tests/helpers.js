/**
 * Small helpers shared by the tests, so we do not repeat ourselves.
 * This file is not a test itself (its name does not end with .test.js).
 */

/**
 * Make an ISO date from LOCAL parts. Tests must not depend on the
 * time zone of the computer that runs them, so we always build dates this way.
 * @param {number} year
 * @param {number} monthIndex  0 = January
 * @param {number} day
 * @param {number} [hour=12]
 * @returns {string} ISO string.
 */
export function localIso(year, monthIndex, day, hour = 12) {
  return new Date(year, monthIndex, day, hour).toISOString();
}

/**
 * Make a fake transaction. Default: an expense of Rs 100 in Food, on 15 Oct 2026.
 * @param {object} [overrides]  Fields to change.
 * @returns {object}
 */
export function makeTxn(overrides = {}) {
  const when = localIso(2026, 9, 15);
  return {
    id: crypto.randomUUID(),
    type: 'expense',
    amount: 10000,
    date: when,
    accountId: 'cash',
    toAccountId: null,
    categoryId: 'food',
    note: '',
    tags: [],
    createdAt: when,
    updatedAt: when,
    ...overrides,
  };
}

/**
 * Make a fake account. Default: an active Cash account with a zero opening balance.
 * @param {object} [overrides]  Fields to change.
 * @returns {object}
 */
export function makeAccount(overrides = {}) {
  return {
    id: 'cash',
    name: 'Cash',
    type: 'cash',
    openingBalance: 0,
    currency: 'INR',
    archived: false,
    createdAt: localIso(2026, 0, 1),
    ...overrides,
  };
}

/**
 * Make a fake category. Default: an active expense category called Food.
 * @param {object} [overrides]  Fields to change.
 * @returns {object}
 */
export function makeCategory(overrides = {}) {
  return {
    id: 'food',
    name: 'Food',
    icon: '🍔',
    color: '#ef4444',
    kind: 'expense',
    archived: false,
    ...overrides,
  };
}

/**
 * Make a fake budget. Default: Rs 5,000 for the "food" category.
 * @param {object} [overrides]  Fields to change.
 * @returns {object}
 */
export function makeBudget(overrides = {}) {
  return { id: 'b1', categoryId: 'food', monthlyLimit: 500000, ...overrides };
}
