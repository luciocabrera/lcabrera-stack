/**
 * The failure this guards is the one that motivated the helper: a bare
 * `fetch failed`, thrown by undici for a reset connection with no status and no
 * detail, taking a whole job down on its first and only attempt.
 *
 * The negative direction matters as much as the positive one. A retry wrapper
 * that also retries a 404 looks identical on a healthy run and turns a clear
 * "that label does not exist" into four of them plus a delay, so the
 * client-error case is asserted rather than assumed.
 *
 * `sleep` is injected throughout — a suite that actually waited out the backoff
 * would be slow enough that someone would eventually shorten the schedule to
 * speed it up, which is the wrong thing to optimise.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  fetchWithRetry,
  isRetryableStatus,
  retryDelayMs,
} from './fetch-retry.mjs';

const scripted = (outcomes) => {
  const calls = [];
  const attempt = () => {
    const next = outcomes[calls.length];
    calls.push(next);
    return next instanceof Error
      ? Promise.reject(next)
      : Promise.resolve({ status: next });
  };
  return { attempt, calls };
};

const noSleep = () => Promise.resolve();

describe('isRetryableStatus', () => {
  it.each([408, 425, 429, 500, 502, 503, 504])(
    'retries the transient status %i',
    (status) => {
      expect(isRetryableStatus(status)).toBe(true);
    },
  );

  it.each([200, 201, 400, 401, 403, 404, 422])('never retries %i', (status) => {
    expect(isRetryableStatus(status)).toBe(false);
  });
});

describe('retryDelayMs', () => {
  it('backs off exponentially from the first retry', () => {
    expect([0, 1, 2, 3].map((index) => retryDelayMs(index))).toEqual([
      250, 500, 1000, 2000,
    ]);
  });

  it('caps the delay so a long budget cannot stall a job', () => {
    expect(retryDelayMs(20)).toBe(4000);
  });
});

describe('fetchWithRetry', () => {
  it('returns the first success without sleeping', async () => {
    const slept = [];
    const { attempt, calls } = scripted([200]);

    const response = await fetchWithRetry(attempt, {
      sleep: (ms) => {
        slept.push(ms);
        return Promise.resolve();
      },
    });

    expect(response.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(slept).toEqual([]);
  });

  it('recovers from the transport throw that caused this helper', async () => {
    const { attempt, calls } = scripted([new TypeError('fetch failed'), 200]);

    const response = await fetchWithRetry(attempt, { sleep: noSleep });

    expect(response.status).toBe(200);
    expect(calls).toHaveLength(2);
  });

  it('recovers from a transient status', async () => {
    const { attempt, calls } = scripted([503, 200]);

    const response = await fetchWithRetry(attempt, { sleep: noSleep });

    expect(response.status).toBe(200);
    expect(calls).toHaveLength(2);
  });

  it('returns a client error immediately rather than hammering it', async () => {
    const { attempt, calls } = scripted([404, 200]);

    const response = await fetchWithRetry(attempt, { sleep: noSleep });

    expect(response.status).toBe(404);
    expect(calls).toHaveLength(1);
  });

  it('surfaces the final error once the budget is spent', async () => {
    const { attempt, calls } = scripted([
      new TypeError('fetch failed'),
      new TypeError('fetch failed'),
      new TypeError('still failing'),
    ]);

    await expect(
      fetchWithRetry(attempt, { attempts: 3, sleep: noSleep }),
    ).rejects.toThrow('still failing');
    expect(calls).toHaveLength(3);
  });

  it('returns the last response rather than throwing when it is a status', async () => {
    const { attempt } = scripted([503, 503, 503]);

    const response = await fetchWithRetry(attempt, {
      attempts: 3,
      sleep: noSleep,
    });

    expect(response.status).toBe(503);
  });

  it('reports each retry with the reason', async () => {
    const seen = [];
    const { attempt } = scripted([new TypeError('fetch failed'), 503, 200]);

    await fetchWithRetry(attempt, {
      onRetry: (event) => seen.push(event),
      sleep: noSleep,
    });

    expect(seen).toEqual([
      { attempt: 1, reason: 'fetch failed' },
      { attempt: 2, reason: 'HTTP 503' },
    ]);
  });

  it('waits the backoff schedule between attempts', async () => {
    const delays = [];
    const { attempt } = scripted([500, 500, 200]);

    await fetchWithRetry(attempt, {
      sleep: (ms) => {
        delays.push(ms);
        return Promise.resolve();
      },
    });

    expect(delays).toEqual([250, 500]);
  });
});
