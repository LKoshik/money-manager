/** The on/off switch for recurring transactions (OFF by default). */

import { el } from '../../ui/dom.js';
import { toggleSwitch } from '../../ui/switch.js';
import { showToast } from '../../ui/toast.js';
import { setRecurringEnabled } from '../../state/actions.js';

async function change(enabled) {
  try {
    await setRecurringEnabled(enabled);
    showToast(enabled ? 'Recurring transactions are on' : 'Recurring transactions are off');
  } catch (error) {
    showToast('Could not change this setting. Please try again.', { kind: 'error' });
    throw error; // the switch flips back
  }
}

/**
 * Build the card.
 * @param {{recurringEnabled: boolean}} settings
 * @returns {HTMLElement}
 */
export function recurringSection(settings) {
  return el(
    'section',
    { className: 'card stack' },
    el('h2', { className: 'settings-title', text: 'Recurring transactions' }),
    el(
      'div',
      { className: 'switch-row' },
      el('p', { className: 'muted switch-row-text', text: 'Adds rent, salary or subscriptions by themselves when you open the app. Rules are kept while this is off.' }),
      toggleSwitch({ checked: settings.recurringEnabled, ariaLabel: 'Recurring transactions', onChange: change }),
    ),
  );
}
