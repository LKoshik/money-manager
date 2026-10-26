/** The math of extra income. Pure, integer paise only. The wishes part of every entry adds to the stack. */

/** @param {Array<{wishes: number}>} extraIncomes @returns {number} Paise of all wishes parts (this feeds the stack). */
export const totalExtraWishes = (extraIncomes) => extraIncomes.reduce((sum, entry) => sum + entry.wishes, 0);

/**
 * Income transactions that can still be linked: not already used by an entry. Newest first.
 * @param {object[]} transactions
 * @param {Array<{transactionId: string}>} extraIncomes
 * @returns {object[]}
 */
export function linkableTransactions(transactions, extraIncomes) {
  const used = new Set(extraIncomes.map((entry) => entry.transactionId));
  return transactions.filter((txn) => txn.type === 'income' && !used.has(txn.id)).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

/**
 * Split a full amount: the bucket parts are typed, the wishes part is what is left. So the split always
 * adds up to the amount, unless the buckets are more than the amount.
 * @param {number} amount  Paise.
 * @param {number[]} bucketAmounts  Paise per bucket (0 = not used).
 * @returns {{wishes: number, overBy: number}} overBy > 0 means the buckets take more than the amount.
 */
export function splitRemainder(amount, bucketAmounts) {
  const left = amount - bucketAmounts.reduce((sum, value) => sum + value, 0);
  return { wishes: Math.max(0, left), overBy: Math.max(0, -left) };
}
