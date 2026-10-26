/** The Planner screen: this month's plan, the change waiting for next month, and the buttons to edit or stop. */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { emptyState } from '../../ui/emptyState.js';
import { planCard } from './planCard.js';
import { openPlanSheet } from './planSheet.js';
import { extraIncomeSection } from './extraIncomeList.js';
import { stopThePlan, cancelTheChange } from './planCommands.js';
import { planView, isStopped } from '../../core/planModel.js';
import { formatMonthLabel } from '../../core/dateLabels.js';

const NOTE = 'The plan is on paper only. Only extra income you add here also records an income transaction.';
const label = (key) => formatMonthLabel(key, true);

function stoppedCard(upcoming) {
  return el(
    'section',
    { className: 'card stack plan-card' },
    el('h2', { className: 'plan-card-title', text: `From ${label(upcoming.plan.appliesFrom)}` }),
    el('p', { className: 'muted', text: 'The plan stops. Months before that keep their numbers.' }),
  );
}

/**
 * Build the Planner screen.
 * @param {{plans: object[], extraIncomes?: object[]}} state
 * @param {Date} [now=new Date()]
 * @returns {HTMLElement}
 */
export function buildView(state, now = new Date()) {
  const view = planView(state.plans, now);
  const { current, upcoming } = view;
  const upcomingStops = upcoming !== null && isStopped(upcoming.plan);
  // Edit what is waiting for next month, else the plan of this month; a stopped plan starts again from the presets.
  const base = upcoming && !upcomingStops ? upcoming : current;
  const edit = () => openPlanSheet({ plans: state.plans, plan: base?.plan ?? null, now });
  if (!view.hasAny) {
    return emptyState({
      icon: 'calendar',
      title: 'No plan yet',
      message: 'Write down your monthly income and where it goes. What is left over is your wishes allowance.',
      action: { label: 'Create plan', icon: 'plus', onClick: edit },
    });
  }
  return el(
    'div',
    { className: 'stack' },
    el('p', { className: 'muted plan-note', text: NOTE }),
    current && planCard({ title: label(view.month), subtitle: 'This month', plan: current.plan, summary: current.summary }),
    !current && !upcoming && el('p', { className: 'muted plan-note', text: 'There is no plan right now. Create one to start again from next month.' }),
    upcoming && !upcomingStops && planCard({ title: `From ${label(upcoming.plan.appliesFrom)}`, subtitle: 'Next change', plan: upcoming.plan, summary: upcoming.summary }),
    upcomingStops && stoppedCard(upcoming),
    button({ label: current ? 'Edit plan' : 'Create a new plan', icon: 'calendar', block: true, onClick: edit }),
    upcoming && button({ label: 'Cancel the change', variant: 'secondary', block: true, onClick: cancelTheChange }),
    extraIncomeSection(state.extraIncomes ?? [], current?.plan.buckets ?? [], now),
    current && !upcomingStops && button({ label: 'Stop plan', variant: 'danger', block: true, onClick: () => stopThePlan(view.nextMonth) }),
  );
}
