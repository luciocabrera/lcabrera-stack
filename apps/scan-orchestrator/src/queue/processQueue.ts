import { getQueuedScans } from '@repo/scan-ingestion/queries/getQueuedScans.util';
import { getUserByUsername } from '@repo/scan-ingestion/queries/getUserByUsername.util';

import type { RunStatusHub } from '../ws/runStatusHub.ts';

import { runQueuedScan } from './runQueuedScan.ts';
import { runWithConcurrencyLimit } from './runWithConcurrencyLimit.util.ts';

const SYSTEM_USERNAME = 'system';

type CreateQueueProcessorArgs = {
  readonly dailyCapUsd: number;
  readonly hub: RunStatusHub;
  readonly maxConcurrentScans: number;
};

/**
 * Bounded-concurrency drain loop. Each pass claims the currently-queued scans
 * and executes them through a worker pool sized by `maxConcurrentScans` — the
 * global host-protection cap of PRD_V2 §9 / ADR-033 — so no more than that many
 * scans ever run on the host at once; the rest wait for a slot (TECH_SPEC §2.7's
 * "worker pool is a straightforward later enhancement"). Re-entrant wake-ups (a
 * NOTIFY arriving mid-drain, or the reconciliation timer firing while a scan is
 * still running) just set a flag rather than starting a second overlapping
 * drain — the atomic per-scan claim (ADR-026) is what keeps the pool's workers
 * from executing the same scan twice.
 */
export const createQueueProcessor = ({
  dailyCapUsd,
  hub,
  maxConcurrentScans,
}: CreateQueueProcessorArgs) => {
  let isProcessing = false;
  let isWakeRequestedDuringProcessing = false;

  const drain = async (): Promise<void> => {
    // The orchestrator's actor identity for audit fields and permission
    // checks (ADR-018) — resolved per drain, not cached across the process
    // lifetime, so a disabled system user stops the queue on the next wake.
    const systemUser = await getUserByUsername({ username: SYSTEM_USERNAME });
    if (systemUser === undefined) {
      throw new Error(
        "The seeded 'system' user was not found — run migrations first.",
      );
    }

    let queued = await getQueuedScans();
    while (queued.length > 0) {
      await runWithConcurrencyLimit({
        items: queued,
        limit: maxConcurrentScans,
        worker: (scan) =>
          runQueuedScan({ dailyCapUsd, hub, scan, userId: systemUser.id }),
      });
      queued = await getQueuedScans();
    }
  };

  const drainAndReschedule = async (): Promise<void> => {
    try {
      await drain();
    } catch (error) {
      console.error('❌ Queue processor drain failed:', error);
    } finally {
      isProcessing = false;
      if (isWakeRequestedDuringProcessing) {
        isWakeRequestedDuringProcessing = false;
        wake();
      }
    }
  };

  const wake = (): void => {
    if (isProcessing) {
      isWakeRequestedDuringProcessing = true;
      return;
    }

    isProcessing = true;
    void drainAndReschedule();
  };

  return { wake };
};

export type QueueProcessor = ReturnType<typeof createQueueProcessor>;
