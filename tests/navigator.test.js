import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNavigator, parseRoute, pathFromHash } from '../src/ui/navigator.js';
import { createFakeBrowser } from './fakeBrowser.js';

const KNOWN = ['/', '/a', '/b', '/c'];

/** Start a navigator on a fake browser. "shown" records every screen that was drawn. */
function setup(startRoute = '', startState = null) {
  const browser = createFakeBrowser(startRoute, startState);
  const shown = [];
  const nav = createNavigator({
    ...browser,
    onShow: (route) => shown.push(route),
    isKnownPath: (path) => KNOWN.includes(path),
  });
  nav.start();
  return { browser, nav, shown };
}

test('parseRoute: path and query', () => {
  assert.equal(parseRoute('/reports').path, '/reports');
  assert.equal(parseRoute('/reports/').path, '/reports');
  assert.equal(parseRoute('reports').path, '/reports');
  assert.equal(parseRoute('').path, '/');
  assert.equal(parseRoute('/').path, '/');
  assert.equal(parseRoute('/reports?month=2026-10').query.get('month'), '2026-10');
});

test('pathFromHash removes the #', () => {
  assert.equal(pathFromHash('#/reports'), '/reports');
  assert.equal(pathFromHash(''), '');
});

test('start on Home: one history entry, Home is shown', () => {
  const { browser, shown } = setup('');
  assert.deepEqual(shown, ['/']);
  assert.deepEqual(browser.routes(), ['/']);
  assert.deepEqual(browser.history.state, { depth: 0 });
});

test('start on a deep link: Home is put below it, so Back goes Home', async () => {
  const { browser, shown } = setup('/a');
  assert.deepEqual(browser.routes(), ['/', '/a']);
  assert.deepEqual(shown, ['/a']);
  browser.history.back();
  await browser.settle();
  assert.deepEqual(shown, ['/a', '/']);
});

test('start on an unknown route: Home is shown, with no extra entries', () => {
  const { browser, shown } = setup('/nonsense');
  assert.deepEqual(shown, ['/']);
  assert.deepEqual(browser.routes(), ['/']);
});

test('reload keeps the existing history (it does not stack Home again)', () => {
  const { browser, shown } = setup('/b', { depth: 2 });
  assert.deepEqual(browser.routes(), ['/b']);
  assert.deepEqual(shown, ['/b']);
});

test('navigate adds an entry, and Back returns', async () => {
  const { browser, nav, shown } = setup('');
  nav.navigate('/a');
  assert.deepEqual(browser.history.state, { depth: 1 });
  nav.navigate('/b');
  assert.deepEqual(browser.history.state, { depth: 2 });
  browser.history.back();
  await browser.settle();
  assert.deepEqual(shown, ['/', '/a', '/b', '/a']);
});

test('navigate with replace swaps the entry', () => {
  const { browser, nav } = setup('');
  nav.navigate('/a');
  nav.navigate('/b', { replace: true });
  assert.deepEqual(browser.routes(), ['/', '/b']);
});

test('in-app back: uses history, and at depth 0 goes Home without leaving', async () => {
  const { browser, nav, shown } = setup('');
  nav.navigate('/a');
  nav.back();
  await browser.settle();
  assert.equal(nav.getCurrentPath(), '/');
  nav.back(); // already at the bottom
  assert.equal(browser.routes().length, 2);
  assert.deepEqual(shown.at(-1), '/');
});

test('tabs: from Home push, between tabs replace, back to Home goes back', async () => {
  const { browser, nav, shown } = setup('');
  nav.goToTab('/a');
  assert.deepEqual(browser.routes(), ['/', '/a']);
  nav.goToTab('/b');
  assert.deepEqual(browser.routes(), ['/', '/b']); // replaced, not added
  nav.goToTab('/');
  await browser.settle();
  assert.equal(browser.position(), 0);
  assert.equal(nav.getCurrentPath(), '/');
  assert.deepEqual(shown, ['/', '/a', '/b', '/']);
});

test('tabs: tapping the tab you are on does nothing', () => {
  const { nav, shown } = setup('');
  nav.goToTab('/');
  assert.deepEqual(shown, ['/']);
});

test('Back from a tab after a deep link goes Home', async () => {
  const { browser, nav, shown } = setup('/a');
  nav.goToTab('/b');
  browser.history.back();
  await browser.settle();
  assert.equal(shown.at(-1), '/');
});

test('overlay: the phone Back button closes only the overlay', async () => {
  const { browser, nav, shown } = setup('');
  nav.navigate('/a');
  let closed = 0;
  nav.pushOverlay(() => { closed += 1; });
  assert.equal(browser.history.state.overlay, 'overlay-1');
  browser.history.back(); // phone Back button
  await browser.settle();
  assert.equal(closed, 1);
  assert.deepEqual(shown, ['/', '/a']); // the screen was not changed
  assert.equal(nav.getCurrentPath(), '/a');
});

test('overlay: closing from code removes its entry and does not call onClose', async () => {
  const { browser, nav, shown } = setup('');
  nav.navigate('/a');
  let closed = 0;
  const close = nav.pushOverlay(() => { closed += 1; });
  await close();
  assert.equal(closed, 0);
  assert.equal(browser.position(), 1);
  assert.deepEqual(shown, ['/', '/a']);
  await close(); // closing twice is harmless
});

test('overlay: after closing, Back works normally again', async () => {
  const { browser, nav, shown } = setup('');
  nav.navigate('/a');
  await nav.pushOverlay(() => {})();
  browser.history.back();
  await browser.settle();
  assert.equal(shown.at(-1), '/');
});

test('two overlays: Back closes the top one first', async () => {
  const { browser, nav } = setup('');
  const order = [];
  nav.pushOverlay(() => order.push('first'));
  nav.pushOverlay(() => order.push('second'));
  browser.history.back();
  await browser.settle();
  browser.history.back();
  await browser.settle();
  assert.deepEqual(order, ['second', 'first']);
});

test('reload while an overlay entry was current: it becomes a normal entry', () => {
  const { browser, shown } = setup('/a', { depth: 3, overlay: 'overlay-9' });
  assert.deepEqual(browser.history.state, { depth: 3 });
  assert.deepEqual(shown, ['/a']);
});

test('Back to an unknown route shows Home', async () => {
  const { browser, nav, shown } = setup('');
  nav.navigate('/a');
  browser.history.replaceState(null, '', '#/gone'); // the person typed a bad address
  nav.navigate('/b');
  browser.history.back();
  await browser.settle();
  assert.equal(shown.at(-1), '/');
});
