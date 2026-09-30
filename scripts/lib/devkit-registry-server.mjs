/**
 * The scratch npm registry verify-devkit-workspace.mjs installs the packed
 * `@lcabrera/*` tarballs from. Served over HTTP rather than as `file:`
 * specifiers so pnpm resolves each one as the semver version it will carry on
 * npm, and a peer range between two of them behaves as it will for a consumer
 * (ADR-125). It runs as a child process because the gate's own calls block.
 *
 * Usage: node scripts/lib/devkit-registry-server.mjs <index.json> <port-file>
 * Exit codes: 1 = the index could not be read; otherwise it serves until killed.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, dirname, join } from 'node:path';
import process from 'node:process';

import { packumentFor } from './devkit-workspace-packages.mjs';

const TARBALL_PREFIX = '/-/';

const [indexPath, portFile] = process.argv.slice(2);

const send = ({ body, response, status, type }) => {
  response.writeHead(status, { 'content-type': type });
  response.end(body);
};

const tarballResponse = ({ path, response }) => {
  const file = basename(path);
  send({
    body: readFileSync(join(dirname(indexPath), file)),
    response,
    status: 200,
    type: 'application/octet-stream',
  });
};

const packumentResponse = ({ baseUrl, index, path, response }) => {
  const packed = index[decodeURIComponent(path.slice(1))];
  if (packed === undefined) {
    send({ body: '{}', response, status: 404, type: 'application/json' });
    return;
  }
  send({
    body: JSON.stringify(packumentFor({ baseUrl, packed })),
    response,
    status: 200,
    type: 'application/json',
  });
};

const serve = (index) => {
  const server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://registry').pathname;
    const baseUrl = `http://${request.headers.host}`;
    if (path.startsWith(TARBALL_PREFIX)) {
      tarballResponse({ path, response });
      return;
    }
    packumentResponse({ baseUrl, index, path, response });
  });
  server.listen(0, '127.0.0.1', () => {
    writeFileSync(portFile, String(server.address().port));
  });
};

try {
  serve(JSON.parse(readFileSync(indexPath, 'utf8')));
} catch (error) {
  process.stderr.write(`${String(error)}\n`);
  process.exitCode = 1;
}
