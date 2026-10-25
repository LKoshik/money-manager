/** One recurring rule in the list: the rule on the left (tap = edit), its pause/resume switch on the right. */

import { el } from '../../ui/dom.js';
import { transactionRow } from '../../ui/transactionRow.js';
import { toggleSwitch } from '../../ui/switch.js';
import { blockedReason, scheduleLabel } from '../../core/recurrenceStatus.js';

/**
 * @param {{rule: object, accountsById: Map<string, object>, categoriesById: Map<string, object>,
 *   now: Date, onEdit: () => void, onToggle: (active: boolean) => Promise<void>}} config
 * @returns {HTMLElement}
 */
export function ruleRow({ rule, accountsById, categoriesById, now, onEdit, onToggle }) {
  const blocked = rule.active ? blockedReason(rule, accountsById, categoriesById) : null;
  const schedule = scheduleLabel(rule, now);
  const row = transactionRow({
    txn: rule,
    category: categoriesById.get(rule.categoryId),
    account: accountsById.get(rule.accountId),
    toAccount: accountsById.get(rule.toAccountId),
    subtitle: blocked ? `${blocked} · ${schedule}` : schedule,
    onClick: onEdit,
  });
  const pause = toggleSwitch({ checked: rule.active, ariaLabel: `${rule.active ? 'Pause' : 'Resume'} this rule`, onChange: onToggle });
  const className = ['rule-row', blocked && 'rule-row--blocked', !rule.active && 'rule-row--paused'].filter(Boolean).join(' ');
  return el('div', { className }, row, pause);
}
