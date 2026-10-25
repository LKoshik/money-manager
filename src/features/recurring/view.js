/** The Recurring screen: your rules, a "New recurring" button, and the empty states. */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { emptyState } from '../../ui/emptyState.js';
import { navigate } from '../../ui/router.js';
import { showToast } from '../../ui/toast.js';
import { updateRecurring } from '../../state/actions.js';
import { ruleRow } from './ruleRow.js';
import { openRuleSheet } from './ruleSheet.js';

const byId = (items) => new Map(items.map((item) => [item.id, item]));

async function setActive(rule, active) {
  try {
    const { added } = await updateRecurring(rule.id, { active });
    if (added > 0) showToast(`Added ${added} recurring transaction${added === 1 ? '' : 's'}`);
  } catch (error) {
    showToast('Could not change the rule. Please try again.', { kind: 'error' });
    throw error; // the switch flips back
  }
}

/**
 * Build the Recurring screen.
 * @param {{settings: object, recurring: object[], accounts: object[], categories: object[]}} state
 * @param {Date} [now=new Date()]
 * @returns {HTMLElement}
 */
export function buildView(state, now = new Date()) {
  if (!state.settings.recurringEnabled) {
    return emptyState({
      icon: 'repeat',
      title: 'Recurring transactions are off',
      message: 'Turn them on in Settings to add rent, salary or subscriptions by themselves. Your rules are kept.',
      action: { label: 'Open Settings', icon: 'sliders', onClick: () => navigate('/settings') },
    });
  }
  const create = () => openRuleSheet();
  if (state.recurring.length === 0) {
    return emptyState({
      icon: 'repeat',
      title: 'No recurring transactions yet',
      message: 'Add things that repeat, like rent or a subscription. They are added when you open the app.',
      action: { label: 'New recurring', icon: 'plus', onClick: create },
    });
  }
  const [accountsById, categoriesById] = [byId(state.accounts), byId(state.categories)];
  const rows = state.recurring.map((rule) =>
    ruleRow({ rule, accountsById, categoriesById, now, onEdit: () => openRuleSheet({ rule }), onToggle: (active) => setActive(rule, active) }),
  );
  return el(
    'div',
    { className: 'stack' },
    el('div', { className: 'list-card' }, ...rows),
    button({ label: 'New recurring', icon: 'plus', variant: 'secondary', block: true, onClick: create }),
  );
}
