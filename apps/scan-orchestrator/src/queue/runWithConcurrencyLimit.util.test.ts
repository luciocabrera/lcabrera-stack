import { describe, expect, it, vi } from 'vitest';

import { runWithConcurrencyLimit } from './runWithConcurrencyLimit.util.ts';

/**
 * Releases workers in waves so the peak-concurrency assertion is deterministic:
 * each `gate` entry is a suspended worker that only finishes when released. A
 * wave can never hold more than the limit, which is exactly what we assert.
 */
const createGate = () => {
  const pending: Array<() => void> = [];
  const suspend = () =>
    new Promise<void>((resolve) => {
      pending.push(resolve);
    });
  const releaseWave = () => {
    const wave = [...pending];
    pending.length = 0;
    for (const resolve of wave) {
      resolve();
    }
    return wave.length;
  };
  return { pending, releaseWave, suspend };
};

describe('runWithConcurrencyLimit', () => {
  it('processes every item exactly once', async () => {
    const items = [1, 2, 3, 4, 5];
    const processed: number[] = [];

    await runWithConcurrencyLimit({
      items,
      limit: 2,
      worker: async (item) => {
        await Promise.resolve();
        processed.push(item);
      },
    });

    expect(processed.toSorted((a, b) => a - b)).toEqual(items);
  });

  it('never runs more than `limit` workers at once', async () => {
    const items = Array.from({ length: 10 }, (_, index) => index);
    const gate = createGate();
    let inFlight = 0;
    let peak = 0;

    const run = runWithConcurrencyLimit({
      items,
      limit: 3,
      worker: async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await gate.suspend();
        inFlight -= 1;
      },
    });

    let released = 0;
    while (released < items.length) {
      await vi.waitFor(() => expect(gate.pending.length).toBeGreaterThan(0));
      expect(gate.pending.length).toBeLessThanOrEqual(3);
      released += gate.releaseWave();
    }

    await run;
    expect(peak).toBe(3);
  });

  it('runs sequentially when the limit is 1', async () => {
    const items = [1, 2, 3];
    let inFlight = 0;
    let peak = 0;

    await runWithConcurrencyLimit({
      items,
      limit: 1,
      worker: async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await Promise.resolve();
        inFlight -= 1;
      },
    });

    expect(peak).toBe(1);
  });

  it('caps the worker count at the number of items', async () => {
    const items = [1, 2];
    let inFlight = 0;
    let peak = 0;

    await runWithConcurrencyLimit({
      items,
      limit: 100,
      worker: async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await Promise.resolve();
        inFlight -= 1;
      },
    });

    expect(peak).toBe(2);
  });

  it('clamps a non-positive limit to 1 rather than stalling', async () => {
    const items = [1, 2, 3];
    const processed: number[] = [];

    await runWithConcurrencyLimit({
      items,
      limit: 0,
      worker: async (item) => {
        await Promise.resolve();
        processed.push(item);
      },
    });

    expect(processed).toHaveLength(3);
  });

  it('resolves without calling the worker for an empty list', async () => {
    const worker = vi.fn(async () => {
      await Promise.resolve();
    });

    await runWithConcurrencyLimit({ items: [], limit: 3, worker });

    expect(worker).not.toHaveBeenCalled();
  });
});
