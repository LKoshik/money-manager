/**
 * How loans and repayments move account balances. Like everything about balances this is
 * CALCULATED, never stored. A loan is real money moving, but it is not income or expense.
 *   lent:     loan = -amount (I gave money), repayment = +amount (it came back)
 *   borrowed: loan = +amount (I received money), repayment = -amount (I paid it back)
 */

const direction = (loan) => (loan.direction === 'lent' ? -1 : 1);

/**
 * @param {{direction: string, amount: number, accountId: string}} loan
 * @returns {Array<[string, number]>} Pairs of [accountId, change in paise].
 */
export function getLoanEffects(loan) {
  return [[loan.accountId, direction(loan) * loan.amount]];
}

/**
 * A repayment always does the opposite of its loan.
 * @param {{amount: number, accountId: string}} repayment
 * @param {{direction: string}} loan  The loan the repayment belongs to.
 * @returns {Array<[string, number]>}
 */
export function getRepaymentEffects(repayment, loan) {
  return [[repayment.accountId, -direction(loan) * repayment.amount]];
}

/**
 * Every balance change of all loans and repayments.
 * @param {object[]} loans
 * @param {object[]} repayments  A repayment whose loan is missing is ignored (it cannot be signed).
 * @returns {Array<[string, number]>}
 */
export function getLoanBalanceEffects(loans, repayments) {
  const byId = new Map(loans.map((loan) => [loan.id, loan]));
  const effects = loans.flatMap(getLoanEffects);
  for (const repayment of repayments) {
    const loan = byId.get(repayment.loanId);
    if (loan) effects.push(...getRepaymentEffects(repayment, loan));
  }
  return effects;
}
