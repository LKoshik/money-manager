/** Account types and the grouping of the Accounts screen. */

/** Label and emoji of each account type. The keys match ACCOUNT_TYPES in validate.js. */
export const ACCOUNT_TYPE_INFO = Object.freeze({
  cash: { label: 'Cash', emoji: '💵' },
  bank: { label: 'Bank', emoji: '🏦' },
  upi: { label: 'UPI wallet', emoji: '📱' },
  credit: { label: 'Credit card', emoji: '💳' },
});

const byCreated = (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.name.localeCompare(b.name);

/**
 * Split accounts into active and archived, each oldest first.
 * @param {object[]} accounts
 * @returns {{active: object[], archived: object[]}}
 */
export function splitAccounts(accounts) {
  const sorted = [...accounts].sort(byCreated);
  return {
    active: sorted.filter((account) => !account.archived),
    archived: sorted.filter((account) => account.archived),
  };
}
