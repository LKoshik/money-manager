import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/state/store.js';

test('getState gives the starting state', () => {
  assert.deepEqual(createStore({ a: 1 }).getState(), { a: 1 });
});

test('setState merges the patch and tells subscribers', () => {
  const store = createStore({ a: 1, b: 2 });
  const seen = [];
  store.subscribe((state) => seen.push(state));
  store.setState({ a: 5 });
  assert.deepEqual(store.getState(), { a: 5, b: 2 });
  assert.deepEqual(seen, [{ a: 5, b: 2 }]);
});

test('setState does nothing when no value changed', () => {
  const list = [];
  const store = createStore({ list });
  let calls = 0;
  store.subscribe(() => { calls += 1; });
  store.setState({ list });
  assert.equal(calls, 0);
  store.setState({ list: [] }); // a new array is a change
  assert.equal(calls, 1);
});

test('state is never changed in place', () => {
  const store = createStore({ a: 1 });
  const before = store.getState();
  store.setState({ a: 2 });
  assert.equal(before.a, 1);
  assert.notEqual(store.getState(), before);
});

test('unsubscribe stops the notifications', () => {
  const store = createStore({ a: 1 });
  let calls = 0;
  const stop = store.subscribe(() => { calls += 1; });
  store.setState({ a: 2 });
  stop();
  store.setState({ a: 3 });
  assert.equal(calls, 1);
});

test('a broken subscriber does not stop the others', () => {
  const store = createStore({ a: 1 });
  const original = console.error;
  console.error = () => {};
  let reached = false;
  store.subscribe(() => { throw new Error('boom'); });
  store.subscribe(() => { reached = true; });
  store.setState({ a: 2 });
  console.error = original;
  assert.equal(reached, true);
});
