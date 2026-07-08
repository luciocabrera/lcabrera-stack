import type { CappedLlmUsageAttemptRow } from '@repo/scan-ingestion/queries/getCappedLlmUsageAttempts.util';

export type CappedLlmUsageAttemptsTableProps = {
  readonly cappedAttemptsPromise: Promise<readonly CappedLlmUsageAttemptRow[]>;
};
