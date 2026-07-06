import { getQueuedScans } from '@repo/scan-ingestion/queries/getQueuedScans.util';
import { getUserByUsername } from '@repo/scan-ingestion/queries/getUserByUsername.util';

import type { RunStatusHub } from '../ws/runStatusHub.ts';

import { runQueuedScan } from './runQueuedScan.ts';

const SYSTEM_USERNAME = 'system';

type CreateQueueProcessorArgs = {
  readonly hub: RunStatusHub;
};

/**
 * Sequential drain loop (TECH_SPEC §2.7 — one queued scan at a time is
 * sufficient for v1, a low-traffic internal tool; a worker pool is a
 * straightforward later enhancement, not a v1 requirement). Re-entrant
 * wake-ups (a NOTIFY arriving mid-drain, or the reconciliation timer
 * firing while a scan is still running) just set a flag rather than
 * starting a second overlapping drain.
 */
export const createQueueProcessor = ({ hub }: CreateQueueProcessorArgs) => {
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
      for (const scan of queued) {
        await runQueuedScan({ hub, scan, userId: systemUser.id });
      }
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
