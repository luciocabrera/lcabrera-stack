import { getPool } from '@repo/data-access/db/getPool.util';

type MarkScanRunningArgs = {
  readonly scanId: string;
};

/**
 * The queued → running transition apps/scan-orchestrator makes right before
 * actually executing a scan. Setting started_at here (not at scan-creation
 * time) matters: sp_ingest_scan_result's duration_ms computation is
 * `now() - started_at`, and a scan can legitimately sit at 'queued' for a
 * while before the orchestrator picks it up.
 */
export const markScanRunning = async ({
  scanId,
}: MarkScanRunningArgs): Promise<void> => {
  const pool = getPool();
  await pool.query(
    `UPDATE cqms.scans SET status = 'running', started_at = now() WHERE id = $1`,
    [scanId],
  );
};
