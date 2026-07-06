import { getPool } from '@repo/data-access/db/getPool.util';

type MarkScanRunningArgs = {
  readonly scanId: string;
  readonly userId: string;
};

/**
 * The queued → running transition apps/scan-orchestrator makes right before
 * actually executing a scan (acting as the seeded `system` user, ADR-018).
 * fn_mark_scan_running sets started_at then (not at scan-creation time)
 * because sp_ingest_scan_result's duration_ms computation is
 * `now() - started_at`, and a scan can legitimately sit at 'queued' for a
 * while before the orchestrator picks it up.
 */
export const markScanRunning = async ({
  scanId,
  userId,
}: MarkScanRunningArgs): Promise<void> => {
  const pool = getPool();
  await pool.query('SELECT cqms.fn_mark_scan_running($1, $2)', [
    userId,
    scanId,
  ]);
};
