/*
 * The readiness probe against listeners that answer the way a Postgres server
 * does in each of its states, and one that answers in no protocol at all.
 */

import { createServer } from 'node:net';
import { afterEach, describe, expect, test } from 'vite-plus/test';

import {
  answerFrom,
  probeOnce,
  startupMessage,
  waitForDatabase,
} from './create-readiness.mjs';

const errorResponse = (code) => {
  const fields = Buffer.from(`SFATAL\0C${code}\0Mnot now\0\0`, 'utf8');
  const head = Buffer.alloc(5);
  head.write('E', 0);
  head.writeInt32BE(fields.length + 4, 1);
  return Buffer.concat([head, fields]);
};

const AUTHENTICATION_OK = Buffer.from([82, 0, 0, 0, 8, 0, 0, 0, 0]);

const servers = [];

afterEach(async () => {
  const open = [...servers];
  servers.length = 0;
  await Promise.all(
    open.map((server) => new Promise((done) => server.close(() => done()))),
  );
});

const listening = (answers) =>
  new Promise((resolve) => {
    const queue = [...answers];
    const server = createServer((socket) => {
      socket.once('data', () => {
        const answer = queue.length > 1 ? queue.shift() : queue[0];
        if (answer === undefined) socket.destroy();
        else socket.end(answer);
      });
    });
    servers.push(server);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });

describe('startupMessage', () => {
  test('is length-prefixed, protocol 3.0, and names the user', () => {
    const message = startupMessage('someone');

    expect(message.readInt32BE(0)).toBe(message.length);
    expect(message.readInt32BE(4)).toBe(196_608);
    expect(message.toString('utf8', 8)).toBe(
      'user\0someone\0database\0postgres\0\0',
    );
  });
});

describe('answerFrom', () => {
  test.each([
    [Buffer.alloc(0), 'pending'],
    [AUTHENTICATION_OK, 'ready'],
    [errorResponse('57P03'), 'starting'],
    [errorResponse('28P01'), 'ready'],
    [errorResponse('57P03').subarray(0, 9), 'pending'],
    [Buffer.from('HTTP/1.1 400'), 'unexpected'],
  ])('reads %j as %s', (bytes, expected) => {
    expect(answerFrom(bytes)).toBe(expected);
  });
});

describe('waitForDatabase', () => {
  const host = '127.0.0.1';

  test('keeps asking while the server is starting up, and stops when it answers', async () => {
    const port = await listening([
      errorResponse('57P03'),
      errorResponse('57P03'),
      AUTHENTICATION_OK,
    ]);

    await expect(
      waitForDatabase({ deadlineMs: 5000, host, pollMs: 10, port, user: 'u' }),
    ).resolves.toEqual({ last: 'ready', ready: true });
  });

  test('gives up at the deadline on a port that accepts and never answers in the protocol', async () => {
    const port = await listening([undefined]);

    await expect(
      waitForDatabase({ deadlineMs: 100, host, pollMs: 10, port, user: 'u' }),
    ).resolves.toEqual({ last: 'closed', ready: false });
  });

  test('reports a refused connection as what it saw', async () => {
    const port = await listening([AUTHENTICATION_OK]);
    const [server] = servers;
    await new Promise((done) => server.close(() => done()));
    servers.length = 0;

    await expect(
      probeOnce({ host, port, timeoutMs: 1000, user: 'u' }),
    ).resolves.toBe('ECONNREFUSED');
  });
});
