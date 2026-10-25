import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRegistry, visibleMenu } from '../src/ui/featureRegistry.js';

const feature = (overrides = {}) => ({
  id: 'home',
  title: 'Home',
  icon: 'home',
  route: '/',
  render: () => {},
  ...overrides,
});

test('a correct list builds, with defaults filled in', () => {
  const { features, tabs, quickAction } = buildRegistry([feature()]);
  assert.equal(features[0].nav, true);
  assert.equal(features[0].order, 100);
  assert.equal(tabs.length, 1);
  assert.equal(quickAction, null);
});

test('features are sorted by order, then title', () => {
  const list = [
    feature({ id: 'c', route: '/c', title: 'C', order: 30 }),
    feature({ id: 'a', route: '/a', title: 'A', order: 10 }),
    feature({ id: 'home', order: 10, title: 'Home' }),
  ];
  assert.deepEqual(buildRegistry(list).features.map((f) => f.id), ['a', 'home', 'c']);
});

test('nav: false keeps a feature out of the tabs but in the routes', () => {
  const { features, tabs } = buildRegistry([feature(), feature({ id: 'x', route: '/x', title: 'X', nav: false })]);
  assert.equal(features.length, 2);
  assert.deepEqual(tabs.map((f) => f.id), ['home']);
});

test('the quick action is found', () => {
  const open = () => {};
  const { quickAction } = buildRegistry([feature({ quickAction: { title: 'Add', open } })]);
  assert.equal(quickAction.open, open);
});

test('clear errors for mistakes', () => {
  assert.throws(() => buildRegistry([feature({ id: undefined })]), /"id" must be a string/);
  assert.throws(() => buildRegistry([feature({ render: 'no' })]), /"render" must be a function/);
  assert.throws(() => buildRegistry([feature({ route: 'x' })]), /must start with "\/"/);
  assert.throws(() => buildRegistry([feature({ icon: 'banana' })]), /unknown icon/);
  assert.throws(() => buildRegistry([feature({ quickAction: { title: 'Add' } })]), /quickAction needs/);
  assert.throws(() => buildRegistry([feature({ quickAction: { title: 'A', open: () => {}, icon: 'banana' } })]), /unknown quickAction icon/);
});

test('duplicate ids or routes, no home, two quick actions', () => {
  assert.throws(() => buildRegistry([feature(), feature({ route: '/x' })]), /same id/);
  assert.throws(() => buildRegistry([feature(), feature({ id: 'x' })]), /same route/);
  assert.throws(() => buildRegistry([feature({ route: '/x' })]), /route "\/"/);
  const action = { title: 'Add', open: () => {} };
  assert.throws(
    () => buildRegistry([feature({ quickAction: action }), feature({ id: 'x', route: '/x', quickAction: action })]),
    /Only one feature/,
  );
});

test('menu: features with a menu number are listed in that order; the rest are not', () => {
  const list = [
    feature(),
    feature({ id: 'b', route: '/b', title: 'B', nav: false, menu: 20 }),
    feature({ id: 'a', route: '/a', title: 'A', nav: false, menu: 10 }),
    feature({ id: 'c', route: '/c', title: 'C', nav: false }),
  ];
  assert.deepEqual(buildRegistry(list).menu.map((f) => f.id), ['a', 'b']);
  assert.deepEqual(buildRegistry([feature()]).menu, []);
});

test('menu: a row can hide itself with menuVisible(state)', () => {
  const list = [feature(), feature({ id: 'r', route: '/r', nav: false, menu: 1, menuVisible: (state) => state.on }), feature({ id: 'g', route: '/g', nav: false, menu: 2 })];
  const { menu } = buildRegistry(list);
  assert.deepEqual(visibleMenu(menu, { on: false }).map((f) => f.id), ['g']);
  assert.deepEqual(visibleMenu(menu, { on: true }).map((f) => f.id), ['r', 'g']);
});

test('menu: wrong types give a clear error', () => {
  assert.throws(() => buildRegistry([feature({ menu: 'first' })]), /"menu" must be a number/);
  assert.throws(() => buildRegistry([feature({ menuVisible: true })]), /"menuVisible" must be a function/);
});
