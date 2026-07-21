import { getPool } from '@repo/server/db/get-pool.util';

type MarkScanFailedArgs = {
  readonly errorMessage: string;
  readonly runId: string;
  readonly scanId: string;
  readonly userId: string;
};

/**
 * The failure counterpart to sp_ingest_scan_result's success path (TECH_SPEC
 * §2.3a) — a failed scan has no report/findings to ingest. fn_mark_scan_failed
 * owns the whole transition (status, error message, duration) and performs
 * the same fn_finalize_run_status roll-up sp_ingest_scan_result does on
 * success, so a run reaches a terminal state correctly regardless of which
 * of its scans failed vs. succeeded.
 */
export const markScanFailed = async ({
  errorMessage,
  runId,
  scanId,
  userId,
}: MarkScanFailedArgs): Promise<void> => {
  const pool = getPool();
  await pool.query('SELECT cqms.fn_mark_scan_failed($1, $2, $3, $4)', [
    userId,
    scanId,
    runId,
    errorMessage,
  ]);
};
