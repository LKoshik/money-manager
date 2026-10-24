/** Words for the "is my data protected?" line in Settings. */

const TEXTS = {
  checking: { title: 'Checking...', message: '', canProtect: false },
  protected: {
    title: 'Protected',
    message: 'The browser will not clear this app\'s data when the phone runs low on space.',
    canProtect: false,
  },
  unprotected: {
    title: 'Not protected yet',
    message: 'The browser may clear the data if the phone runs low on space. Installing the app on your home screen helps. A backup file is the safest protection.',
    canProtect: true,
  },
  unsupported: {
    title: 'Unknown',
    message: 'This browser cannot tell. Save backup files regularly.',
    canProtect: false,
  },
};

/**
 * Describe a storage status.
 * @param {'checking'|'protected'|'unprotected'|'unsupported'} status
 * @returns {{title: string, message: string, canProtect: boolean}}
 */
export function describeStorage(status) {
  return TEXTS[status] ?? TEXTS.unsupported;
}
