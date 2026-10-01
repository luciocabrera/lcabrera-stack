/*
 * Runs `devkit create` as a process against stub `vp`, `pnpm` and `docker`
 * executables and a stub Postgres listener, all recording into one log, so a
 * suite can read which steps ran and in what order.
 *
 * Test scaffolding: the `files` negation for `*-fixtures.*` keeps it out of the
 * tarball.
 */

import { spawn } from 'node:child_process';
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEVKIT = join(dirname(fileURLToPath(import.meta.url)), 'devkit.mjs');

const AUTHENTICATION_OK = Buffer.from([82, 0, 0, 0, 8, 0, 0, 0, 0]);

const stubScript = (name) =>
  [
    '#!/bin/sh',
    `echo "${name} $*" >> "$SETUP_LOG"`,
    'if [ "$*" = "run db:seed" ] && [ -n "$FAIL_SEED" ]; then exit 1; fi',
    'if [ "$*" = "install" ] && [ -n "$FAIL_INSTALL" ]; then exit 1; fi',
    `if [ "${name}" = docker ] && [ -n "$DOCKER_STOPPED" ]; then exit 1; fi`,
    'exit 0',
    '',
  ].join('\n');

/**
 * @param {{ directory: string, names: readonly string[] }} args
 */
export const writeStubs = ({ directory, names }) => {
  mkdirSync(directory, { recursive: true });
  for (const name of names) {
    const path = join(directory, name);
    writeFileSync(path, stubScript(name));
    chmodSync(path, 0o755);
  }
};

/**
 * @param {string} log
 * @returns {Promise<{ close: () => Promise<void>, port: number }>}
 */
const answeringProbe = (log) => (socket) => {
  socket.once('data', () => {
    appendFileSync(log, 'probe\n');
    socket.end(AUTHENTICATION_OK);
  });
};

const closed = (server) =>
  new Promise((done) => {
    server.close(() => done());
  });

export const stubPostgres = (log) =>
  new Promise((resolve) => {
    const server = createServer(answeringProbe(log));
    server.listen(0, '127.0.0.1', () =>
      resolve({ close: () => closed(server), port: server.address().port }),
    );
  });

/**
 * @param {{ args: readonly string[], env: Record<string, string>,
 *           parent: string }} args
 * @returns {Promise<{ status: number | null, stderr: string, stdout: string }>}
 */
export const createProcess = ({ args, env, parent }) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [DEVKIT, 'create', ...args], {
      cwd: parent,
      env,
    });
    const out = [];
    const err = [];
    child.stdout.on('data', (chunk) => {
      out.push(chunk);
    });
    child.stderr.on('data', (chunk) => {
      err.push(chunk);
    });
    child.on('close', (status) =>
      resolve({
        status,
        stderr: Buffer.concat(err).toString('utf8'),
        stdout: Buffer.concat(out).toString('utf8'),
      }),
    );
  });

/**
 * @param {string} log
 * @returns {string[]}
 */
export const loggedSteps = (log) =>
  existsSync(log)
    ? readFileSync(log, 'utf8')
        .split('\n')
        .filter((line) => line !== '')
    : [];
