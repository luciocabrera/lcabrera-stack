import { getPool } from '@repo/data-access/db/getPool.util';

type MarkScanFailedArgs = {
  readonly errorMessage: string;
  readonly runId: string;
  readonly scanId: string;
};

/**
 * The failure counterpart to sp_ingest_scan_result's success path (TECH_SPEC
 * §2.3a) — a failed scan has no report/findings to ingest, so this is a
 * direct status update rather than a call through that procedure, followed
 * by the same fn_finalize_run_status roll-up sp_ingest_scan_result itself
 * calls on success, so a run reaches a terminal state correctly regardless
 * of which of its scans failed vs. succeeded.
 */
export const markScanFailed = async ({
  errorMessage,
  runId,
  scanId,
}: MarkScanFailedArgs): Promise<void> => {
  const pool = getPool();
  await pool.query(
    `UPDATE cqms.scans
     SET status = 'failed', error_message = $2, finished_at = now(),
         duration_ms = EXTRACT(epoch FROM (now() - started_at)) * 1000
     WHERE id = $1`,
    [scanId, errorMessage],
  );
  await pool.query('SELECT cqms.fn_finalize_run_status($1)', [runId]);
};
