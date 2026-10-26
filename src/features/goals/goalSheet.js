/**
 * The sheet of ONE goal. Steps: "main" (numbers, history, buttons), "add" and "withdraw" (number pad).
 * It redraws when the goal or its contributions change, but never while the number pad is open.
 */

import { el } from '../../ui/dom.js';
import { openBottomSheet } from '../../ui/bottomSheet.js';
import { store } from '../../state/store.js';
import { buildGoalRows } from '../../core/goalList.js';
import { availableAmount } from '../../core/stackModel.js';
import { buildGoalMain } from './goalMain.js';
import { buildGoalAmountStep } from './goalAmountStep.js';

function buildStep(session) {
  const { goals, contributions } = store.getState();
  const goal = goals.find((item) => item.id === session.goalId);
  if (!goal) return el('div'); // deleted: the delete command is closing the sheet
  const mine = contributions.filter((item) => item.goalId === goal.id);
  const [row] = buildGoalRows([goal], mine);
  return session.step === 'main' ? buildGoalMain(session, row, mine) : buildGoalAmountStep(session, row, mine, availableAmount(store.getState()));
}

function watch(session) {
  let seen = store.getState();
  return store.subscribe((state) => {
    if (state.goals === seen.goals && state.contributions === seen.contributions) return;
    seen = state;
    if (session.step === 'main') session.redraw();
  });
}

/**
 * Open the sheet of a goal.
 * @param {string} goalId
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openGoalSheet(goalId) {
  const root = el('div', { className: 'stack' });
  const session = { goalId, step: 'main', sheet: null, redraw: () => root.replaceChildren(buildStep(session)) };
  session.redraw();
  const stop = watch(session);
  session.sheet = openBottomSheet({ title: 'Goal', content: root, onClose: stop });
  return session.sheet;
}
