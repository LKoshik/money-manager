/**
 * "Assign to a goal": pick an open goal, then add money from the planner's available amount.
 * It reuses the goal's number pad step (which checks the available amount). Success closes the sheet.
 */

import { el } from '../../ui/dom.js';
import { openBottomSheet } from '../../ui/bottomSheet.js';
import { store } from '../../state/store.js';
import { goalCard } from './goalCard.js';
import { buildGoalAmountStep } from './goalAmountStep.js';
import { buildGoalRows, sortGoalRows } from '../../core/goalList.js';
import { availableAmount } from '../../core/stackModel.js';

/** @param {object} state @param {Date} [now] @returns {object[]} Goal rows that can still receive money (not archived, not reached). */
export const openGoalRows = (state, now = new Date()) =>
  sortGoalRows(buildGoalRows(state.goals, state.contributions, now)).filter((row) => !row.goal.archived && row.status !== 'reached');

function buildPick(session) {
  const rows = openGoalRows(store.getState());
  const pick = (row) => () => {
    session.goalId = row.goal.id;
    session.step = 'add';
    session.redraw();
  };
  const list = el('div', { className: 'list-card' }, ...rows.map((row) => goalCard(row, new Date(), pick(row))));
  return el('div', { className: 'stack' }, el('p', { className: 'muted goal-hint', text: 'Which goal gets the money?' }), list);
}

function buildAmount(session) {
  const state = store.getState();
  const mine = state.contributions.filter((item) => item.goalId === session.goalId);
  const [row] = buildGoalRows(state.goals.filter((goal) => goal.id === session.goalId), mine);
  return buildGoalAmountStep(session, row, mine, availableAmount(state));
}

/**
 * Open the assign sheet.
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openAssignSheet() {
  const root = el('div', { className: 'stack' });
  const session = {
    step: 'pick',
    backStep: 'pick',
    goalId: null,
    sheet: null,
    // The amount step sets step "main" after a successful save: that means "done".
    redraw() {
      if (session.step === 'main') return void session.sheet.close();
      root.replaceChildren(session.step === 'pick' ? buildPick(session) : buildAmount(session));
    },
  };
  session.redraw();
  session.sheet = openBottomSheet({ title: 'Assign to a goal', content: root });
  return session.sheet;
}
