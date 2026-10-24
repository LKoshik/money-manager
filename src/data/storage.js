/** Is the browser promising to keep our data? (Not IndexedDB itself, so it lives apart from db.js.) */

/**
 * Check the browser's storage protection.
 * @returns {Promise<'protected'|'unprotected'|'unsupported'>} "unsupported" when the browser cannot tell.
 */
export async function getStorageProtection() {
  try {
    if (!navigator.storage?.persisted) return 'unsupported';
    return (await navigator.storage.persisted()) ? 'protected' : 'unprotected';
  } catch {
    return 'unsupported'; // a status line is not worth a crash
  }
}
