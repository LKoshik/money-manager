/** Actions for goals and their contributions. Re-exported by state/actions.js. Goals never change accounts or transactions. */

import { action } from './loaders.js';
import { goalsRepo } from '../data/goalsRepo.js';
import { contributionsRepo } from '../data/contributionsRepo.js';

/** Add a goal. @param {object} input See goalsRepo.create. @returns {Promise<object>} The goal. */
export const addGoal = action(['goals'], (input) => goalsRepo.create(input));

/** Change a goal (or archive/restore it with {archived}). @param {string} id @param {object} changes @returns {Promise<{goal: object, reached: boolean}>} */
export const updateGoal = action(['goals'], (id, changes) => goalsRepo.update(id, changes));

/** Delete a goal and all its contributions. @param {string} id */
export const removeGoal = action(['goals', 'contributions'], (id) => goalsRepo.remove(id));

/** Add money to a goal or withdraw it. @param {object} input See contributionsRepo.add. @returns {Promise<{contribution: object, reached: boolean}>} */
export const addContribution = action(['goals', 'contributions'], (input) => contributionsRepo.add(input));

/** Delete one contribution. @param {string} id @returns {Promise<{reached: boolean}>} */
export const removeContribution = action(['goals', 'contributions'], (id) => contributionsRepo.remove(id));
