/** Actions for the planner. Re-exported by state/actions.js. The planner never touches accounts or transactions. */

import { action } from './loaders.js';
import { plansRepo } from '../data/plansRepo.js';

/** Save the plan (starts next month, or this month for the very first plan). @param {{income: number, buckets: object[]}} input @returns {Promise<object>} The saved version. */
export const savePlan = action(['plans'], (input) => plansRepo.save(input));

/** End the plan from next month. Past months keep their numbers. @returns {Promise<object>} */
export const stopPlan = action(['plans'], () => plansRepo.stop());

/** Cancel the changes that have not started yet. @returns {Promise<number>} */
export const cancelPlanChange = action(['plans'], () => plansRepo.cancelScheduled());
