/**
 * The scratch npm registry verify-devkit-workspace.mjs installs the packed
 * `@lcabrera/*` tarballs from. Served over HTTP rather than as `file:`
 * specifiers so pnpm resolves each one as the semver version it will carry on
 * npm, and a peer range between two of them behaves as it will for a consumer
 * (ADR-125). The gate runs it in a child copy of itself, because the gate's own
 * calls block, and waits here for the port it writes.
 */

import { spawn } from 'node:child_process';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, dirname, join } from 'node:path';
import process from 'node:process';

import { packumentFor } from './devkit-workspace-packages.mjs';

const TARBALL_PREFIX = '/-/';

const START_DEADLINE_MS = 10_000;

const POLL_MS = 50;

const MAX_PORT = 65_535;

const send = ({ body, response, status, type }) => {
  response.writeHead(status, { 'content-type': type });
  response.end(body);
};

const tarballResponse = ({ directory, path, response }) => {
  const file = basename(path);
  send({
    body: readFileSync(join(directory, file)),
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

/**
 * @param {{ port: number, portFile: string }} args
 */
export const publishPort = ({ port, portFile }) => {
  const staged = `${portFile}.partial`;
  writeFileSync(staged, String(port));
  renameSync(staged, portFile);
};

/**
 * @param {string | undefined} text
 * @returns {number | undefined}
 */
export const parsedPort = (text) => {
  const trimmed = text?.trim() ?? '';
  if (!/^\d+$/.test(trimmed)) return undefined;
  const port = Number(trimmed);
  return port >= 1 && port <= MAX_PORT ? port : undefined;
};

/**
 * @param {{ indexPath: string, portFile: string }} args
 */
export const serveRegistry = ({ indexPath, portFile }) => {
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  const directory = dirname(indexPath);
  const server = createServer((request, response) => {
    const [path] = (request.url ?? '/').split('?');
    const baseUrl = `http://${request.headers.host}`;
    if (path.startsWith(TARBALL_PREFIX)) {
      tarballResponse({ directory, path, response });
      return;
    }
    packumentResponse({ baseUrl, index, path, response });
  });
  server.listen(0, '127.0.0.1', () => {
    publishPort({ port: server.address().port, portFile });
  });
};

const sleep = (milliseconds) =>
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);

const readOrUndefined = (path) => {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return undefined;
  }
};

/**
 * @param {{ deadlineMs?: number, portFile: string }} args
 * @returns {number}
 */
export const portFrom = ({ deadlineMs = START_DEADLINE_MS, portFile }) => {
  const deadline = Date.now() + deadlineMs;
  let text = readOrUndefined(portFile);
  while (parsedPort(text) === undefined && Date.now() < deadline) {
    sleep(POLL_MS);
    text = readOrUndefined(portFile);
  }
  const port = parsedPort(text);
  if (port === undefined) {
    throw new Error(
      text === undefined
        ? `the scratch registry did not start within ${deadlineMs} ms`
        : `the scratch registry wrote ${JSON.stringify(text)} as its port, which is not an integer from 1 to ${MAX_PORT}`,
    );
  }
  return port;
};

/**
 * @param {{ launch: readonly string[],
 *           packed: ReadonlyArray<{ manifest: { name: string } }>,
 *           staging: string }} args
 * @returns {{ server: import('node:child_process').ChildProcess, url: string }}
 */
export const startedRegistry = ({ launch, packed, staging }) => {
  const index = join(staging, 'registry-index.json');
  const portFile = join(staging, 'registry-port');
  writeFileSync(
    index,
    JSON.stringify(
      Object.fromEntries(packed.map((entry) => [entry.manifest.name, entry])),
    ),
  );
  const server = spawn(process.execPath, [...launch, index, portFile], {
    stdio: 'ignore',
  });
  try {
    return { server, url: `http://127.0.0.1:${portFrom({ portFile })}` };
  } catch (error) {
    server.kill();
    throw error;
  }
};
