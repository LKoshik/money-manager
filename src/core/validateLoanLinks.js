/** Link checks of a backup for loans and repayments (kept apart: validateBackup.js stays short). */

/**
 * Check that every loan and repayment points to something that exists, and that
 * the repayments of one loan never add up to more than the loan.
 * @param {{loans: object[], repayments: object[]}} data  Already checked for shape.
 * @param {Set<string>} accountIds
 * @param {string[]} errors  Problems are added here.
 */
export function checkLoanLinks({ loans, repayments }, accountIds, errors) {
  const amounts = new Map(loans.map((loan) => [loan.id, loan.amount]));
  loans.forEach((loan, index) => {
    if (!accountIds.has(loan.accountId)) errors.push(`loans[${index}]: account not found`);
  });
  const repaid = new Map();
  repayments.forEach((item, index) => {
    if (!amounts.has(item.loanId)) errors.push(`repayments[${index}]: loan not found`);
    if (!accountIds.has(item.accountId)) errors.push(`repayments[${index}]: account not found`);
    repaid.set(item.loanId, (repaid.get(item.loanId) ?? 0) + item.amount);
  });
  for (const [loanId, sum] of repaid) {
    if (amounts.has(loanId) && sum > amounts.get(loanId)) errors.push(`loan ${loanId}: repayments are more than the loan`);
  }
}
