/**
 * Waiting for a started server's first answer and stopping it again, each in
 * bounded time, for verify-devkit-workspace.mjs. A server that accepts a
 * connection and never answers, or a process that ignores SIGTERM, must fail
 * the gate rather than hang it.
 */

import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

const isRunning = (child) =>
  child.exitCode === null && child.signalCode === null;

const endOf = (child) =>
  child.signalCode === null
    ? `the task exited ${child.exitCode}`
    : `the task was killed by ${child.signalCode}`;

/**
 * @param {{ chunk: string, limit: number, tail: string }} args
 * @returns {string}
 */
export const keptTail = ({ chunk, limit, tail }) =>
  `${tail}${chunk}`.slice(-limit);

/**
 * @param {{ child: import('node:child_process').ChildProcess, limit: number }} args
 * @returns {() => string}
 */
export const collectedTail = ({ child, limit }) => {
  let tail = '';
  const keep = (chunk) => {
    tail = keptTail({ chunk: String(chunk), limit, tail });
  };
  child.stdout?.on('data', keep);
  child.stderr?.on('data', keep);
  return () => tail;
};

const signalGroup = ({ child, signal }) => {
  try {
    process.kill(-child.pid, signal);
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error;
  }
};

const exited = ({ child, withinMs }) =>
  isRunning(child)
    ? Promise.race([
        new Promise((resolve) => {
          child.once('exit', () => resolve(true));
        }),
        delay(withinMs, false),
      ])
    : Promise.resolve(true);

const answerOf = async ({ requestTimeoutMs, url }) => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
    return { status: response.status };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
};

/**
 * @param {{ child: import('node:child_process').ChildProcess, deadline: number,
 *           pollMs: number, requestTimeoutMs: number, url: string,
 *           lastError?: string }} args
 * @returns {Promise<{ error?: string, status?: number }>}
 */
export const firstAnswer = async ({
  child,
  deadline,
  lastError,
  pollMs,
  requestTimeoutMs,
  url,
}) => {
  if (!isRunning(child)) {
    return { error: `${endOf(child)} before answering` };
  }
  if (Date.now() >= deadline) {
    return {
      error: `no answer before the deadline; the last attempt ended with: ${lastError ?? 'no attempt'}`,
    };
  }
  const answer = await answerOf({
    requestTimeoutMs: Math.min(requestTimeoutMs, deadline - Date.now()),
    url,
  });
  if (answer.status !== undefined) return answer;
  await delay(pollMs);
  return firstAnswer({
    child,
    deadline,
    lastError: answer.error,
    pollMs,
    requestTimeoutMs,
    url,
  });
};

/**
 * @param {{ child: import('node:child_process').ChildProcess, graceMs: number }} args
 * @returns {Promise<{ forced: boolean }>}
 */
export const stopGroup = async ({ child, graceMs }) => {
  signalGroup({ child, signal: 'SIGTERM' });
  const clean = await exited({ child, withinMs: graceMs });
  signalGroup({ child, signal: 'SIGKILL' });
  if (!clean) await exited({ child, withinMs: graceMs });
  return { forced: !clean };
};
