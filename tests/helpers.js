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

/**
 * Make a fake recurring rule. Default: Rs 1,000 rent, monthly from 5 Oct 2026, nothing created yet.
 * @param {object} [overrides]  Fields to change.
 * @returns {object}
 */
export function makeRule(overrides = {}) {
  return {
    id: 'r1',
    type: 'expense',
    amount: 100000,
    accountId: 'cash',
    toAccountId: null,
    categoryId: 'food',
    note: 'Rent',
    frequency: 'monthly',
    startDate: localIso(2026, 9, 5),
    endDate: null,
    active: true,
    generatedCount: 0,
    createdAt: localIso(2026, 9, 1),
    ...overrides,
  };
}

/**
 * Make a fake goal. Default: a Rs 10,000 "Trip" goal with no deadline, nothing reached.
 * @param {object} [overrides]  Fields to change.
 * @returns {object}
 */
export function makeGoal(overrides = {}) {
  return {
    id: 'g1',
    name: 'Trip',
    icon: '✈️',
    color: '#3b82f6',
    targetAmount: 1000000,
    deadline: null,
    createdAt: localIso(2026, 9, 1),
    completedAt: null,
    archived: false,
    ...overrides,
  };
}

/**
 * Make a fake contribution. Default: Rs 100 added to goal "g1" on 10 Oct 2026.
 * @param {object} [overrides]  Fields to change.
 * @returns {object}
 */
export function makeContribution(overrides = {}) {
  return { id: 'c1', goalId: 'g1', type: 'add', amount: 10000, date: localIso(2026, 9, 10), note: '', ...overrides };
}

/**
 * Make a fake loan. Default: Rs 1,000 LENT to "Ravi" from "cash" on 10 Oct 2026, no due date.
 * @param {object} [overrides]  Fields to change.
 * @returns {object}
 */
export function makeLoan(overrides = {}) {
  return {
    id: 'l1',
    direction: 'lent',
    person: 'Ravi',
    amount: 100000,
    date: localIso(2026, 9, 10),
    accountId: 'cash',
    dueDate: null,
    note: '',
    createdAt: localIso(2026, 9, 10),
    ...overrides,
  };
}

/**
 * Make a fake repayment. Default: Rs 300 on loan "l1" into "cash" on 12 Oct 2026.
 * @param {object} [overrides]  Fields to change.
 * @returns {object}
 */
export function makeRepayment(overrides = {}) {
  return { id: 'p1', loanId: 'l1', amount: 30000, date: localIso(2026, 9, 12), accountId: 'cash', note: '', ...overrides };
}

/**
 * Make a fake plan version. Default: Rs 50,000 income, buckets of Rs 30,000 + Rs 10,000, applies from Oct 2026.
 * @param {object} [overrides]  Fields to change.
 * @returns {object}
 */
export function makePlan(overrides = {}) {
  return {
    id: 'pl1',
    appliesFrom: '2026-10',
    income: 5000000,
    buckets: [
      { id: 'b1', name: 'Rent / needs', amount: 3000000 },
      { id: 'b2', name: 'Savings', amount: 1000000 },
    ],
    createdAt: localIso(2026, 9, 1),
    ...overrides,
  };
}

/**
 * Make a fake extra income entry. Default: a gift of Rs 8,000 on 12 Oct 2026, Rs 5,000 to wishes and Rs 3,000 to "Savings",
 * tied to the income transaction "t-gift" (see makeGiftTxn).
 * @param {object} [overrides]  Fields to change.
 * @returns {object}
 */
export function makeExtraIncome(overrides = {}) {
  return {
    id: 'e1',
    name: 'Gift',
    amount: 800000,
    date: localIso(2026, 9, 12),
    wishes: 500000,
    buckets: [{ id: 'b2', name: 'Savings', amount: 300000 }],
    transactionId: 't-gift',
    createdAt: localIso(2026, 9, 12),
    ...overrides,
  };
}

/** @param {object} [overrides] @returns {object} The income transaction that goes with makeExtraIncome. */
export const makeGiftTxn = (overrides = {}) => makeTxn({ id: 't-gift', type: 'income', amount: 800000, date: localIso(2026, 9, 12), ...overrides });
