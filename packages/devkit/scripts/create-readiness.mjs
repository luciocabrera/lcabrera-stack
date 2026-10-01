/*
 * Whether a Postgres server is accepting connections, asked the way
 * `pg_isready` asks it: send a startup message and read the first answer.
 *
 * A TCP connect is not the question. A published container port accepts a
 * connection before anything inside the container listens on it, and the
 * image's first start runs a temporary server that listens on no TCP port at
 * all, so only an answer in the protocol tells a server that is up from a
 * port that is open. Any answer but "the database system is starting up" means
 * it is up: a refused role or a wrong password is the seed's to report.
 */

import { connect } from 'node:net';

const PROTOCOL_VERSION = 196_608;

const MAINTENANCE_DATABASE = 'postgres';

const STARTING_UP = '57P03';

const HEADER_BYTES = 5;

/**
 * @param {string} user
 * @returns {Buffer}
 */
export const startupMessage = (user) => {
  const body = Buffer.from(
    `user\0${user}\0database\0${MAINTENANCE_DATABASE}\0\0`,
    'utf8',
  );
  const head = Buffer.alloc(8);
  head.writeInt32BE(body.length + head.length, 0);
  head.writeInt32BE(PROTOCOL_VERSION, 4);
  return Buffer.concat([head, body]);
};

const errorCodeIn = (fields) =>
  fields
    .toString('utf8')
    .split('\0')
    .find((field) => field.startsWith('C'))
    ?.slice(1);

/**
 * @param {Buffer} bytes everything the server has sent so far
 * @returns {'pending' | 'ready' | 'starting' | 'unexpected'}
 */
export const answerFrom = (bytes) => {
  if (bytes.length === 0) return 'pending';
  const type = String.fromCodePoint(bytes[0]);
  if (type === 'R') return 'ready';
  if (type !== 'E') return 'unexpected';
  if (bytes.length < HEADER_BYTES) return 'pending';
  const end = 1 + bytes.readInt32BE(1);
  if (bytes.length < end) return 'pending';
  return errorCodeIn(bytes.subarray(HEADER_BYTES, end)) === STARTING_UP
    ? 'starting'
    : 'ready';
};

/**
 * @param {{ host: string, port: number, timeoutMs: number, user: string }} args
 * @returns {Promise<string>} `ready`, or what was seen instead
 */
export const probeOnce = ({ host, port, timeoutMs, user }) =>
  new Promise((resolve) => {
    const socket = connect({ host, port });
    const received = [];
    const settle = (answer) => {
      socket.destroy();
      resolve(answer);
    };
    socket.setTimeout(timeoutMs, () => settle('no answer'));
    socket.once('error', (error) => settle(error.code ?? error.message));
    socket.once('close', () => settle('closed'));
    socket.once('connect', () => socket.write(startupMessage(user)));
    socket.on('data', (chunk) => {
      received.push(chunk);
      const answer = answerFrom(Buffer.concat(received));
      if (answer !== 'pending') settle(answer);
    });
  });

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {{ deadlineMs: number, host: string, pollMs: number, port: number,
 *           probe?: typeof probeOnce, user: string }} args
 * @returns {Promise<{ last: string, ready: boolean }>}
 */
export const waitForDatabase = async ({
  deadlineMs,
  host,
  pollMs,
  port,
  probe = probeOnce,
  user,
}) => {
  const deadline = Date.now() + deadlineMs;
  const attempt = async () => {
    const last = await probe({ host, port, timeoutMs: pollMs * 4, user });
    if (last === 'ready') return { last, ready: true };
    if (Date.now() >= deadline) return { last, ready: false };
    await pause(pollMs);
    return attempt();
  };
  return attempt();
};
