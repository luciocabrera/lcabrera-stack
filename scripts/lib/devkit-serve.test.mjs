/*
 * The two waits the created-workspace gate makes on a started server, against
 * plants that would hang an unbounded wait: a server that accepts and never
 * answers, and a process group that ignores SIGTERM.
 */

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createServer as createTcpServer } from 'node:net';
import process from 'node:process';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { firstAnswer, stopGroup } from './devkit-serve.mjs';

const IGNORES_SIGTERM =
  "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000); process.stdout.write('ready\\n');";

const LEAVES_A_GRANDCHILD = `
const { spawn } = require('node:child_process');
const grandchild = spawn(process.execPath, ['-e', ${JSON.stringify(IGNORES_SIGTERM)}], { stdio: ['ignore', 'pipe', 'ignore'] });
grandchild.stdout.once('data', () => process.stdout.write(grandchild.pid + '\\n'));
setInterval(() => {}, 1000);
`;

const isAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const gone = async (pid, withinMs) => {
  const deadline = Date.now() + withinMs;
  while (isAlive(pid) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return !isAlive(pid);
};

const started = [];

const startedChild = (script) => {
  const child = spawn(process.execPath, ['-e', script], {
    detached: true,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  started.push(child);
  return child;
};

const ready = (child) =>
  new Promise((resolve) => {
    child.stdout.once('data', (chunk) => resolve(String(chunk).trim()));
  });

const listening = (server) =>
  new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });

const closed = (server) =>
  new Promise((resolve) => {
    server.closeAllConnections?.();
    server.close(() => resolve());
  });

const servers = [];

afterEach(async () => {
  await Promise.all(started.map((child) => stopGroup({ child, graceMs: 100 })));
  started.length = 0;
  await Promise.all(servers.map((server) => closed(server)));
  servers.length = 0;
});

const idleChild = () => startedChild('setInterval(() => {}, 1000);');

describe('firstAnswer', () => {
  it('returns the status of a server that answers', async () => {
    const server = createServer((_, response) => response.end('ok'));
    servers.push(server);
    const port = await listening(server);

    const answer = await firstAnswer({
      child: idleChild(),
      deadline: Date.now() + 5000,
      pollMs: 50,
      requestTimeoutMs: 1000,
      url: `http://127.0.0.1:${port}/`,
    });

    expect(answer).toEqual({ status: 200 });
  });

  it('gives up on a server that accepts and never answers, by the deadline', async () => {
    const sockets = [];
    const server = createTcpServer((socket) => sockets.push(socket));
    servers.push({
      close: (done) => {
        for (const socket of sockets) socket.destroy();
        server.close(done);
      },
    });
    const port = await listening(server);
    const begun = Date.now();

    const answer = await firstAnswer({
      child: idleChild(),
      deadline: begun + 1500,
      pollMs: 50,
      requestTimeoutMs: 400,
      url: `http://127.0.0.1:${port}/`,
    });

    expect(answer.status).toBeUndefined();
    expect(answer.error).toContain('no answer before the deadline');
    expect(sockets.length).toBeGreaterThan(1);
    expect(Date.now() - begun).toBeLessThan(3000);
  });

  it('stops waiting once the task has exited', async () => {
    const child = startedChild('process.exit(3)');
    await new Promise((resolve) => child.once('exit', resolve));

    const answer = await firstAnswer({
      child,
      deadline: Date.now() + 5000,
      pollMs: 50,
      requestTimeoutMs: 400,
      url: 'http://127.0.0.1:9/',
    });

    expect(answer).toEqual({ error: 'the task exited 3 before answering' });
  });
});

describe('stopGroup', () => {
  it('stops a group that honours SIGTERM without forcing it', async () => {
    const child = startedChild(
      "process.stdout.write('ready\\n'); setInterval(() => {}, 1000);",
    );
    await ready(child);

    expect(await stopGroup({ child, graceMs: 2000 })).toEqual({
      forced: false,
    });
    expect(child.signalCode).toBe('SIGTERM');
  });

  it('kills a group that ignores SIGTERM after the grace period', async () => {
    const child = startedChild(IGNORES_SIGTERM);
    await ready(child);
    const begun = Date.now();

    expect(await stopGroup({ child, graceMs: 300 })).toEqual({ forced: true });
    expect(child.signalCode).toBe('SIGKILL');
    expect(Date.now() - begun).toBeLessThan(2000);
  });

  it('kills a grandchild that outlives a leader which honoured SIGTERM', async () => {
    const child = startedChild(LEAVES_A_GRANDCHILD);
    const grandchild = Number(await ready(child));
    expect(isAlive(grandchild)).toBe(true);

    await stopGroup({ child, graceMs: 2000 });

    expect(await gone(grandchild, 2000)).toBe(true);
  });
});
