/** Sorts categories into the groups shown in Settings. */

/**
 * Group categories: active expense, active income, archived. Each group is A to Z.
 * @param {object[]} categories  All categories, archived too.
 * @param {object[]} transactions
 * @returns {{expense: Array<{category: object, uses: number}>, income: Array<{category: object, uses: number}>,
 *   archived: Array<{category: object, uses: number}>}}
 */
export function groupCategories(categories, transactions) {
  const uses = new Map();
  for (const txn of transactions) {
    if (txn.categoryId) uses.set(txn.categoryId, (uses.get(txn.categoryId) ?? 0) + 1);
  }
  const rows = [...categories]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((category) => ({ category, uses: uses.get(category.id) ?? 0 }));
  const active = (kind) => rows.filter((row) => !row.category.archived && row.category.kind === kind);
  return { expense: active('expense'), income: active('income'), archived: rows.filter((row) => row.category.archived) };
}

/**
 * Short text for how much a category is used.
 * @param {number} uses
 * @returns {string}
 */
export function describeUses(uses) {
  if (uses === 0) return 'No transactions';
  return uses === 1 ? '1 transaction' : `${uses} transactions`;
}
