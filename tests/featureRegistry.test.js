import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRegistry } from '../src/ui/featureRegistry.js';

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
