/** Validation for savings goals and their contributions (money set aside on paper). */

import { MAX_NAME_LENGTH } from './validate.js';
import { isObject, isText, isPaise, isDateText, collect } from './validateParts.js';

export const CONTRIBUTION_TYPES = ['add', 'withdraw'];

/**
 * @param {unknown} goal
 * @returns {string[]} Problems found (empty if valid).
 */
export function validateGoal(goal) {
  if (!isObject(goal)) return ['goal must be an object'];
  return collect([
    [isText(goal.id), 'id is missing'],
    [isText(goal.name) && goal.name.length <= MAX_NAME_LENGTH, `name must be 1-${MAX_NAME_LENGTH} characters`],
    [isText(goal.icon), 'icon is missing'],
    [isText(goal.color), 'color is missing'],
    [isPaise(goal.targetAmount) && goal.targetAmount > 0, 'targetAmount must be a positive whole number of paise'],
    [goal.deadline === null || isDateText(goal.deadline), 'deadline must be empty or an ISO date'],
    [isDateText(goal.createdAt), 'createdAt must be an ISO date'],
    [goal.completedAt === null || isDateText(goal.completedAt), 'completedAt must be empty or an ISO date'],
    [typeof goal.archived === 'boolean', 'archived must be true or false'],
  ]);
}

/**
 * @param {unknown} item
 * @returns {string[]} Problems found (empty if valid).
 */
export function validateContribution(item) {
  if (!isObject(item)) return ['contribution must be an object'];
  return collect([
    [isText(item.id), 'id is missing'],
    [isText(item.goalId), 'goalId is missing'],
    [CONTRIBUTION_TYPES.includes(item.type), `type must be one of: ${CONTRIBUTION_TYPES.join(', ')}`],
    [isPaise(item.amount) && item.amount > 0, 'amount must be a positive whole number of paise'],
    [isDateText(item.date), 'date must be an ISO date'],
    [typeof item.note === 'string', 'note must be text'],
  ]);
}
