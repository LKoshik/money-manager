/** Backup card: last backup date, the 14-day reminder, export, import and CSV. */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { describeBackup } from '../../core/backupReminder.js';
import { runExportBackup, runExportCsv, runImport } from './backupActions.js';

/**
 * Build the backup card.
 * @param {{lastBackupAt: string|null}} settings
 * @param {boolean} hasData  Is there anything worth backing up?
 * @param {Date} [now=new Date()]
 * @returns {HTMLElement}
 */
export function backupSection(settings, hasData, now = new Date()) {
  const info = describeBackup(settings.lastBackupAt, hasData, now);
  return el(
    'section',
    { className: 'card stack' },
    el('h2', { className: 'settings-title', text: 'Backup' }),
    el('p', { className: 'muted settings-backup-date', text: info.text }),
    info.due && el('p', { className: 'settings-reminder', text: info.advice, attrs: { role: 'status' } }),
    button({ label: 'Export backup', block: true, onClick: runExportBackup }),
    button({ label: 'Import backup', variant: 'secondary', block: true, onClick: runImport }),
    button({ label: 'Export CSV', variant: 'secondary', block: true, onClick: runExportCsv }),
    el('p', { className: 'muted', text: 'The backup file holds all accounts, categories, transactions and budgets. The CSV is for spreadsheets only.' }),
  );
}
