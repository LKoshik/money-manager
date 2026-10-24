/**
 * Builds the app into dist/: one index.html (JS and CSS inside), plus
 * manifest.json, sw.js and icons/. Run with "npm run build".
 * esbuild is the only tool used.
 */
import { build, transform } from 'esbuild';
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { buildRegistry } from './src/ui/featureRegistry.js';
import * as featureModules from './src/features/index.js';
import { cssPaths, makeVersion, makeHtml, makeServiceWorker } from './tools/buildHtml.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');

/** Bundle all JavaScript into one minified string. */
async function bundleJs() {
  const result = await build({
    entryPoints: [join(SRC, 'main.js')],
    bundle: true,
    minify: true,
    format: 'esm',
    target: ['chrome90'],
    // Tells ui/styles.js and ui/pwaUpdate.js they run in the built app.
    define: { __BUNDLED__: 'true' },
    write: false,
    logLevel: 'warning',
  });
  return result.outputFiles[0].text;
}

/** Join all CSS files in the order the page needs, then minify. */
async function bundleCss(features) {
  const files = cssPaths(features).filter((path) => existsSync(join(SRC, path)));
  const parts = await Promise.all(files.map((path) => readFile(join(SRC, path), 'utf8')));
  const { code } = await transform(parts.join('\n'), { loader: 'css', minify: true });
  return code;
}

async function copyPwaFiles(version) {
  const pwa = join(SRC, 'pwa');
  await cp(join(pwa, 'manifest.json'), join(DIST, 'manifest.json'));
  // .gitkeep only exists to keep an empty folder in git.
  await cp(join(pwa, 'icons'), join(DIST, 'icons'), { recursive: true, filter: (path) => !path.endsWith('.gitkeep') });
  const worker = makeServiceWorker(await readFile(join(pwa, 'sw.js'), 'utf8'), version);
  await writeFile(join(DIST, 'sw.js'), worker);
}

async function main() {
  const version = makeVersion(new Date());
  const { features } = buildRegistry(Object.values(featureModules));
  const [js, css, template] = await Promise.all([bundleJs(), bundleCss(features), readFile(join(SRC, 'index.html'), 'utf8')]);
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await writeFile(join(DIST, 'index.html'), makeHtml(template, { css, js }));
  await copyPwaFiles(version);
  const kb = (text) => Math.round(Buffer.byteLength(text) / 1024);
  console.log(`Built dist/ (version ${version}): JS ${kb(js)} KB, CSS ${kb(css)} KB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
