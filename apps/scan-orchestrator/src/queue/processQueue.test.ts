import type { QueuedScanRow } from '@repo/scan-ingestion/queries/getQueuedScans.util';

import { getQueuedScans } from '@repo/scan-ingestion/queries/getQueuedScans.util';
import { getUserByUsername } from '@repo/scan-ingestion/queries/getUserByUsername.util';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { RunStatusHub } from '../ws/runStatusHub.ts';

import { createQueueProcessor } from './processQueue.ts';
import { runQueuedScan } from './runQueuedScan.ts';

vi.mock('@repo/scan-ingestion/queries/getQueuedScans.util', () => ({
  getQueuedScans: vi.fn(),
}));
vi.mock('@repo/scan-ingestion/queries/getUserByUsername.util', () => ({
  getUserByUsername: vi.fn(),
}));
vi.mock('./runQueuedScan.ts', () => ({
  runQueuedScan: vi.fn(),
}));

const hub = { publish: vi.fn() } as unknown as RunStatusHub;

const makeScans = (count: number): QueuedScanRow[] =>
  Array.from(
    { length: count },
    (_, index) => ({ scan_id: `scan-${index}` }) as unknown as QueuedScanRow,
  );

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getUserByUsername).mockResolvedValue({
    id: 'system-user-id',
  } as never);
});

describe('createQueueProcessor', () => {
  it('runs no more than maxConcurrentScans scans on the host at once', async () => {
    const scans = makeScans(5);
    // One non-empty batch, then empty so the drain loop terminates.
    vi.mocked(getQueuedScans)
      .mockResolvedValueOnce(scans)
      .mockResolvedValue([]);

    const pending: Array<() => void> = [];
    let inFlight = 0;
    let peak = 0;
    vi.mocked(runQueuedScan).mockImplementation(() => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      return new Promise<void>((resolve) => {
        pending.push(() => {
          inFlight -= 1;
          resolve();
        });
      });
    });

    const processor = createQueueProcessor({
      dailyCapUsd: 50,
      hub,
      maxConcurrentScans: 2,
    });
    processor.wake();

    let released = 0;
    while (released < scans.length) {
      await vi.waitFor(() => expect(pending.length).toBeGreaterThan(0));
      expect(pending.length).toBeLessThanOrEqual(2);
      const wave = [...pending];
      pending.length = 0;
      released += wave.length;
      for (const resolve of wave) {
        resolve();
      }
    }

    await vi.waitFor(() =>
      expect(runQueuedScan).toHaveBeenCalledTimes(scans.length),
    );
    expect(peak).toBe(2);
  });

  it('forwards the daily cap and system user id to each scan', async () => {
    vi.mocked(getQueuedScans)
      .mockResolvedValueOnce(makeScans(1))
      .mockResolvedValue([]);
    vi.mocked(runQueuedScan).mockResolvedValue();

    const processor = createQueueProcessor({
      dailyCapUsd: 42,
      hub,
      maxConcurrentScans: 3,
    });
    processor.wake();

    await vi.waitFor(() => expect(runQueuedScan).toHaveBeenCalledTimes(1));
    expect(runQueuedScan).toHaveBeenCalledWith(
      expect.objectContaining({ dailyCapUsd: 42, userId: 'system-user-id' }),
    );
  });
});
