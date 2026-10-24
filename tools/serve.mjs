/**
 * A tiny static file server for development and preview (no dependencies).
 * Usage: node tools/serve.mjs <folder> [port]
 * "localhost" counts as a secure address, so IndexedDB, randomUUID and the service worker all work.
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

/** Map a URL path to a file inside root, or null if it tries to leave root. */
async function findFile(root, urlPath) {
  const target = resolve(root, '.' + decodeURIComponent(urlPath.split('?')[0]));
  if (target !== root && !target.startsWith(root + sep)) return null;
  const info = await stat(target).catch(() => null);
  if (info?.isDirectory()) return resolve(target, 'index.html');
  return info ? target : null;
}

function createServer(root) {
  return http.createServer(async (request, response) => {
    try {
      const file = await findFile(root, request.url);
      if (!file) throw new Error('not found');
      const body = await readFile(file);
      // no-store: while developing, a reload must always show the newest files.
      response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(body);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('Not found');
    }
  });
}

const root = resolve(process.argv[2] ?? 'src');
const port = Number(process.argv[3] ?? 8012);
createServer(root).listen(port, () => console.log(`Serving ${root} at http://localhost:${port}/`));
