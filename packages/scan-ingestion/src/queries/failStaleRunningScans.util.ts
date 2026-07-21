import { getPool } from '@lcabrera/server/db/get-pool.util';

type FailStaleRunningScansArgs = {
  readonly userId: string;
};

/**
 * Startup reconciliation for apps/scan-orchestrator (ADR-026): a scan
 * whose orchestrator died mid-run stays 'running' forever — never
 * re-queued, never failed, its run never finalized. Called ONCE at
 * process startup, before the queue listener/claims begin — at that
 * moment every 'running' row is necessarily stale, because a single
 * active orchestrator is the deployment model (ADR-015).
 * fn_fail_stale_running_scans fails them set-wise with a clear
 * re-trigger message and finalizes each affected run, and returns how
 * many scans it swept.
 */
export const failStaleRunningScans = async ({
  userId,
}: FailStaleRunningScansArgs): Promise<number> => {
  const pool = getPool();
  const result = await pool.query<{ fn_fail_stale_running_scans: number }>(
    'SELECT cqms.fn_fail_stale_running_scans($1) AS fn_fail_stale_running_scans',
    [userId],
  );
  return result.rows[0]?.fn_fail_stale_running_scans ?? 0;
};
