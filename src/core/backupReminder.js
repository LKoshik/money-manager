/** The "last backup" line and the reminder on the Settings screen. */

import { daysSince, toDayKey } from './dates.js';
import { formatDayLabel } from './dateLabels.js';

/** After this many days without a backup we start reminding. */
export const REMINDER_DAYS = 14;

/**
 * Describe the backup state in words.
 * @param {string|null} lastBackupAt  ISO date from settings, or null (never).
 * @param {boolean} hasData  False on a brand-new app: nothing to lose, so no reminder.
 * @param {Date} [now=new Date()]  Passed in so tests can control time.
 * @returns {{text: string, due: boolean, advice: string|null, days: number|null}}
 *   due = show the reminder. advice is the reminder sentence (null when not due).
 */
export function describeBackup(lastBackupAt, hasData, now = new Date()) {
  const days = daysSince(lastBackupAt, now);
  if (days === null) {
    const advice = 'Save a backup file so your data survives a lost phone or cleared browser data.';
    return { text: 'No backup yet', due: hasData, advice: hasData ? advice : null, days: null };
  }
  const due = days >= REMINDER_DAYS;
  const when = formatDayLabel(toDayKey(lastBackupAt), now);
  const text = days <= 1 ? `Last backup: ${when.toLowerCase()}` : `Last backup: ${when} (${days} days ago)`;
  return { text, due, advice: due ? `It has been ${days} days. Save a new backup.` : null, days };
}
