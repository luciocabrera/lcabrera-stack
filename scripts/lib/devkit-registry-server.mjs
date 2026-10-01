/**
 * The scratch npm registry verify-devkit-workspace.mjs installs the packed
 * `@lcabrera/*` tarballs from. Served over HTTP rather than as `file:`
 * specifiers so pnpm resolves each one as the semver version it will carry on
 * npm, and a peer range between two of them behaves as it will for a consumer
 * (ADR-125). The gate runs it in a child copy of itself, because the gate's own
 * calls block, and waits here for the port it writes. Every path it does not
 * hold gets a 404, so a request for one cannot take the registry down.
 */

import { spawn } from 'node:child_process';
import {
  closeSync,
  openSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { join } from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

import { outputTail } from './devkit-workspace.mjs';
import { packumentFor } from './devkit-workspace-packages.mjs';

const TARBALL_PREFIX = '/-/';

const START_DEADLINE_MS = 10_000;

const POLL_MS = 50;

const MAX_PORT = 65_535;

const PROBE_TIMEOUT_MS = 5000;

const EXIT_WAIT_MS = 2000;

const decodedName = (path) => {
  try {
    return decodeURIComponent(path.slice(1));
  } catch {
    return '';
  }
};

const NOT_FOUND = {
  body: JSON.stringify({ error: 'not found' }),
  status: 404,
  type: 'application/json',
};

/**
 * @param {{ baseUrl: string,
 *           index: Record<string, { file: string, integrity: string,
 *                                   manifest: Record<string, unknown>,
 *                                   tarballPath: string }>,
 *           path: string }} args
 * @returns {{ body?: string, status: number, tarballPath?: string,
 *             type: string }}
 */
export const registryResponse = ({ baseUrl, index, path }) => {
  if (path.startsWith(TARBALL_PREFIX)) {
    const indexed = Object.values(index).find(
      (entry) => `${TARBALL_PREFIX}${entry.file}` === path,
    );
    return indexed === undefined
      ? NOT_FOUND
      : {
          status: 200,
          tarballPath: indexed.tarballPath,
          type: 'application/octet-stream',
        };
  }
  const name = decodedName(path);
  const packed = Object.hasOwn(index, name) ? index[name] : undefined;
  return packed === undefined
    ? NOT_FOUND
    : {
        body: JSON.stringify(packumentFor({ baseUrl, packed })),
        status: 200,
        type: 'application/json',
      };
};

const send = ({ body, response, status, type }) => {
  response.writeHead(status, { 'content-type': type });
  response.end(body);
};

const answer = ({ baseUrl, index, path, response }) => {
  const { body, status, tarballPath, type } = registryResponse({
    baseUrl,
    index,
    path,
  });
  send({
    body: tarballPath === undefined ? body : readFileSync(tarballPath),
    response,
    status,
    type,
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
  const server = createServer((request, response) => {
    const [path] = (request.url ?? '/').split('?');
    try {
      answer({
        baseUrl: `http://${request.headers.host}`,
        index,
        path,
        response,
      });
    } catch (error) {
      process.stderr.write(`${request.url}: ${error.stack ?? error}\n`);
      send({ body: String(error), response, status: 500, type: 'text/plain' });
    }
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
 *           packed: ReadonlyArray<{ file: string, manifest: { name: string } }>,
 *           staging: string }} args
 * @returns {{ log: string, server: import('node:child_process').ChildProcess,
 *             url: string }}
 */
export const startedRegistry = ({ launch, packed, staging }) => {
  const index = join(staging, 'registry-index.json');
  const portFile = join(staging, 'registry-port');
  const log = join(staging, 'registry.log');
  writeFileSync(
    index,
    JSON.stringify(
      Object.fromEntries(
        packed.map((entry) => [
          entry.manifest.name,
          { ...entry, tarballPath: join(staging, entry.file) },
        ]),
      ),
    ),
  );
  const logFd = openSync(log, 'w');
  const server = spawn(process.execPath, [...launch, index, portFile], {
    stdio: ['ignore', 'ignore', logFd],
  });
  closeSync(logFd);
  try {
    return {
      log,
      server,
      url: `http://127.0.0.1:${portFrom({ portFile })}`,
    };
  } catch (error) {
    server.kill();
    throw error;
  }
};

const isRunning = (server) =>
  server.exitCode === null && server.signalCode === null;

const exitWithin = ({ milliseconds, server }) => {
  const ended = new AbortController();
  return Promise.race([
    once(server, 'exit', { signal: ended.signal }).catch(() => undefined),
    delay(milliseconds, undefined, { signal: ended.signal }).catch(
      () => undefined,
    ),
  ]).finally(() => ended.abort());
};

const probeOf = async (url) => {
  try {
    const response = await fetch(`${url}/`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return { status: response.status };
  } catch (error) {
    return { error: error.cause?.message ?? error.message };
  }
};

/**
 * @param {{ server: import('node:child_process').ChildProcess, url: string }} args
 * @returns {Promise<{ exit?: { code: number | null, signal: string | null },
 *                     probe: { error?: string, status?: number } }>}
 */
export const registryState = async ({ server, url }) => {
  const probe = await probeOf(url);
  if (probe.error !== undefined && isRunning(server)) {
    await exitWithin({ milliseconds: EXIT_WAIT_MS, server });
  }
  const { exitCode: code, signalCode: signal } = server;
  return isRunning(server) ? { probe } : { exit: { code, signal }, probe };
};

const faultOf = ({ exit, probe }) => {
  if (exit === undefined) return probe.error;
  return exit.signal === null
    ? `it exited ${exit.code}`
    : `it was killed by ${exit.signal}`;
};

/**
 * @param {{ exit?: { code: number | null, signal: string | null },
 *           log?: string,
 *           probe: { error?: string, status?: number },
 *           url: string }} args
 * @returns {string[]}
 */
export const registryFaultFindings = ({ exit, log = '', probe, url }) => {
  const fault = faultOf({ exit, probe });
  return fault === undefined
    ? []
    : [
        `the scratch registry at ${url} stopped answering (${fault}). That is a fault in the gate's own registry, not in the created tree, so read an install or metadata failure below as its consequence. Its last output:\n${outputTail(log)}`,
      ];
};

const logFindings = ({ log, url }) =>
  log.trim() === ''
    ? []
    : [
        `the scratch registry at ${url} wrote to its stderr during this failing run, so a request it could not serve may be behind a finding above. Its last output:\n${outputTail(log)}`,
      ];

/**
 * @param {{ exit?: { code: number | null, signal: string | null },
 *           findings: readonly string[],
 *           log?: string,
 *           probe: { error?: string, status?: number },
 *           url: string }} args
 * @returns {string[]}
 */
export const withRegistryFindings = ({
  exit,
  findings,
  log = '',
  probe,
  url,
}) => {
  const fault = registryFaultFindings({ exit, log, probe, url });
  if (fault.length > 0) return [...fault, ...findings];
  return findings.length === 0
    ? []
    : [...findings, ...logFindings({ log, url })];
};
