/** What the backup buttons do: export, export CSV, import. */

import { exportBackupFile, exportCsvFile, importData, recordBackup, BackupError } from '../../state/actions.js';
import { confirmDialog } from '../../ui/modal.js';
import { showToast } from '../../ui/toast.js';
import { summarizeImport, summarizeProblems } from '../../core/importSummary.js';
import { downloadFile, pickTextFile } from './files.js';
import { showResult } from './resultDialog.js';

const SAVE_ERROR = 'Could not make the file. Please try again.';

/** Save the JSON backup and remember the date. */
export async function runExportBackup() {
  try {
    downloadFile(await exportBackupFile());
    // The browser cannot tell us when the file is really saved, so the date is recorded when the download starts.
    await recordBackup();
    showToast('Backup saved to your downloads. Keep a copy somewhere safe.', { duration: 5000 });
  } catch (error) {
    console.error(error);
    showToast(SAVE_ERROR, { kind: 'error' });
  }
}

/** Save all transactions as a CSV file (it is not a backup, so the backup date stays). */
export async function runExportCsv() {
  try {
    downloadFile(await exportCsvFile());
    showToast('CSV saved to your downloads.');
  } catch (error) {
    console.error(error);
    showToast(SAVE_ERROR, { kind: 'error' });
  }
}

async function importText(text) {
  const message = 'Importing replaces ALL data in this app with the file. This cannot be undone. Export a backup first if you are not sure.';
  const ok = await confirmDialog({ title: 'Replace all data?', message, confirmLabel: 'Replace my data', danger: true });
  if (!ok) return;
  try {
    const counts = await importData(text);
    showResult({ title: 'Backup imported', lines: [summarizeImport(counts)] });
  } catch (error) {
    if (!(error instanceof BackupError)) throw error;
    showResult({ title: 'This file cannot be imported', lines: [...summarizeProblems(error.errors), 'Nothing was changed.'] });
  }
}

/** Pick a backup file, confirm, and replace the data. */
export async function runImport() {
  try {
    const text = await pickTextFile();
    if (text !== null) await importText(text);
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Could not read that file.', { kind: 'error' });
  }
}
