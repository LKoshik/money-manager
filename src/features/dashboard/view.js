/** The Home screen: total, this month, accounts, recent transactions. */

import { el } from '../../ui/dom.js';
import { emptyState } from '../../ui/emptyState.js';
import { totalCard } from '../../ui/totalCard.js';
import { openAccountSheet } from '../../ui/accountSheet.js';
import { formatMonthLabel } from '../../core/dateLabels.js';
import { toMonthKey } from '../../core/dates.js';
import { buildHomeModel } from './logic.js';
import { monthCard, accountStrip } from './summaryCards.js';
import { recentList } from './recentList.js';
import { owedLine } from './owedLine.js';

/** The month name, so it is clear which month the cards below talk about. */
function homeHeader(now) {
  return el('div', { className: 'home-header' }, el('span', { className: 'muted', text: formatMonthLabel(toMonthKey(now.toISOString()), true) }));
}

function buildNoAccounts(hasArchived) {
  return emptyState({
    icon: 'wallet',
    title: 'Add your first account',
    message: hasArchived
      ? 'All your accounts are archived. Add a new one to continue.'
      : 'Add Cash, a bank account, a UPI wallet or a credit card to get started.',
    action: { label: 'Create account', icon: 'plus', onClick: () => openAccountSheet() },
  });
}

/**
 * Build the Home screen.
 * @param {{accounts: object[], categories: object[], transactions: object[], settings: object}} state
 * @param {Date} [now=new Date()]
 * @returns {HTMLElement}
 */
export function buildView(state, now = new Date()) {
  const model = buildHomeModel(state, now);
  const header = homeHeader(now);
  if (model.accounts.length === 0) {
    return el('div', { className: 'stack' }, header, buildNoAccounts(state.accounts.length > 0));
  }
  return el(
    'div',
    { className: 'stack' },
    header,
    totalCard({ total: model.total }),
    owedLine(model.owed),
    monthCard(model.month),
    accountStrip(model.accounts),
    recentList(model),
  );
}
