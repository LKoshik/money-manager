import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cssPaths, makeVersion, makeHtml, makeServiceWorker } from '../tools/buildHtml.mjs';

const TEMPLATE = `<head>
  <!-- data-dev-css: removed by the build. -->
  <link rel="manifest" href="pwa/manifest.json">
  <link data-dev-css rel="stylesheet" href="styles/tokens.css">
  <link data-dev-css rel="stylesheet" href="styles/base.css">
</head>
<body><script type="module" src="main.js"></script></body>`;

test('CSS order: global files first, then features in registry order', () => {
  const paths = cssPaths([{ id: 'dashboard' }, { id: 'reports' }]);
  assert.equal(paths[0], 'styles/tokens.css');
  assert.deepEqual(paths.slice(-2), ['features/dashboard/styles.css', 'features/reports/styles.css']);
  const globals = paths.filter((p) => p.startsWith('styles/')).map((p) => p.slice(7, -4));
  assert.equal(globals.join(' '), 'tokens theme-light theme-dark base layout components lists overlays drawer numpad forms charts');
});

test('makeHtml inlines CSS and JS and removes the development links', () => {
  const html = makeHtml(TEMPLATE, { css: 'a{b:c}', js: 'run()' });
  assert.ok(!html.includes('data-dev-css'));
  assert.ok(html.includes('<style>a{b:c}</style>'));
  assert.ok(html.includes('<script type="module">run()</script>'));
  assert.ok(!html.includes('src="main.js"'));
});

test('makeHtml moves manifest and icon links next to index.html', () => {
  assert.ok(makeHtml(TEMPLATE, { css: '', js: '' }).includes('href="manifest.json"'));
});

test('makeHtml keeps special characters in code untouched and escapes </script', () => {
  const js = 'x="$&$1";y="</script>"';
  const html = makeHtml(TEMPLATE, { css: '', js });
  assert.ok(html.includes('x="$&$1";'));
  assert.ok(html.includes('y="<\\/script>"'));
  assert.equal(html.match(/<\/script>/g).length, 1);
});

test('makeHtml fails when the template has no script tag', () => {
  assert.throws(() => makeHtml('<head></head><body></body>', { css: '', js: '' }), /script tag/);
});

test('version is 14 digits and the worker gets it', () => {
  assert.equal(makeVersion(new Date('2026-10-24T09:30:15Z')), '20261024093015');
  assert.equal(makeServiceWorker("const VERSION = '__BUILD_VERSION__';", '42'), "const VERSION = '42';");
  assert.throws(() => makeServiceWorker('nothing here', '42'), /VERSION placeholder/);
  const real = makeServiceWorker(readFileSync(new URL('../src/pwa/sw.js', import.meta.url), 'utf8'), '42');
  assert.ok(real.includes("const VERSION = '42';"));
  assert.ok(!real.includes('__BUILD_VERSION__'));
});
