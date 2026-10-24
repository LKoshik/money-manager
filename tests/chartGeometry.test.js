import { test } from 'node:test';
import assert from 'node:assert/strict';
import { polarPoint, sliceAngles, buildDonut, buildBars } from '../src/core/chartGeometry.js';

const ring = { cx: 100, cy: 100, radius: 76 };

test('polarPoint: 0 degrees is the top, 90 is the right', () => {
  assert.deepEqual(polarPoint(100, 100, 50, 0), { x: 100, y: 50 });
  assert.deepEqual(polarPoint(100, 100, 50, 90), { x: 150, y: 100 });
});

test('sliceAngles: slices cover 360 degrees in order, zeros are skipped', () => {
  const angles = sliceAngles([30, 0, 70]);
  assert.deepEqual(angles.map((a) => a.index), [0, 2]);
  assert.equal(angles[0].start, 0);
  assert.ok(Math.abs(angles[1].end - 360) < 1e-9);
});

test('sliceAngles: equal values keep a stable order', () => {
  const angles = sliceAngles([5, 5, 5, 5]);
  assert.deepEqual(angles.map((a) => a.index), [0, 1, 2, 3]);
  assert.ok(angles.every((a, i) => i === 0 || a.start === angles[i - 1].end));
});

test('sliceAngles: a tiny slice is widened to stay visible, total stays 360', () => {
  const angles = sliceAngles([1, 1000000]);
  assert.ok(angles[0].end - angles[0].start >= 2);
  assert.ok(Math.abs(angles[1].end - 360) < 1e-9);
});

test('sliceAngles: nothing to draw gives an empty list', () => {
  assert.deepEqual(sliceAngles([0, 0]), []);
  assert.deepEqual(sliceAngles([]), []);
});

test('buildDonut: one slice is a full circle, not an arc', () => {
  const shapes = buildDonut([0, 5000], ring);
  assert.equal(shapes.length, 1);
  assert.equal(shapes[0].kind, 'circle');
  assert.equal(shapes[0].index, 1);
  assert.equal(shapes[0].r, 76);
});

test('buildDonut: arcs use the large-arc flag only above 180 degrees', () => {
  const [big, small] = buildDonut([75, 25], ring);
  assert.match(big.d, /A 76 76 0 1 1/);
  assert.match(small.d, /A 76 76 0 0 1/);
  assert.ok(!big.d.includes('NaN'));
});

test('buildBars: higher value = taller bar, zero = no bar', () => {
  const rows = [
    { key: '2026-08', label: 'Aug', income: 0, expense: 20000 },
    { key: '2026-09', label: 'Sep', income: 50000, expense: 40000 },
  ];
  const chart = buildBars(rows);
  const [aug, sep] = chart.groups;
  assert.equal(aug.income.height, 0);
  assert.ok(sep.income.height > sep.expense.height);
  assert.ok(sep.expense.height > aug.expense.height);
  assert.ok(chart.max >= 50000);
});

test('buildBars: a tiny value still gets a visible bar', () => {
  const chart = buildBars([{ key: 'k', label: 'x', income: 1, expense: 10000000 }]);
  assert.ok(chart.groups[0].income.height >= 2);
});

test('buildBars: bars stay inside the plot and ticks run bottom to top', () => {
  const rows = ['a', 'b', 'c', 'd', 'e', 'f'].map((key, i) => ({ key, label: key, income: i * 12345, expense: i * 999 }));
  const chart = buildBars(rows);
  assert.equal(chart.groups.length, 6);
  for (const group of chart.groups) {
    for (const bar of [group.income, group.expense]) {
      assert.ok(bar.x >= chart.left && bar.x + bar.width <= chart.width - chart.right);
      assert.ok(bar.y + bar.height <= chart.baseline + 0.001);
    }
  }
  assert.equal(chart.ticks[0].y, chart.baseline);
  assert.ok(chart.ticks[4].y < chart.ticks[0].y);
});

test('buildBars: all zeros and no rows do not produce NaN', () => {
  for (const rows of [[], [{ key: 'k', label: 'x', income: 0, expense: 0 }]]) {
    assert.ok(!JSON.stringify(buildBars(rows)).includes('null'));
  }
});
