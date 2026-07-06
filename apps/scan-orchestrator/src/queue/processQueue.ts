import { getQueuedScans } from '@repo/scan-ingestion/queries/getQueuedScans.util';

import type { RunStatusHub } from '../ws/runStatusHub.ts';

import { runQueuedScan } from './runQueuedScan.ts';

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
    let queued = await getQueuedScans();
    while (queued.length > 0) {
      for (const scan of queued) {
        await runQueuedScan({ hub, scan });
      }
      queued = await getQueuedScans();
    }
  };

  const wake = (): void => {
    if (isProcessing) {
      isWakeRequestedDuringProcessing = true;
      return;
    }

    isProcessing = true;
    drain()
      .catch((error: unknown) => {
        console.error('❌ Queue processor drain failed:', error);
      })
      .finally(() => {
        isProcessing = false;
        if (isWakeRequestedDuringProcessing) {
          isWakeRequestedDuringProcessing = false;
          wake();
        }
      });
  };

  return { wake };
};

export type QueueProcessor = ReturnType<typeof createQueueProcessor>;
