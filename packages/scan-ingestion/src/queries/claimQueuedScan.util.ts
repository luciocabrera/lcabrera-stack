import { getPool } from '@lcabrera/server/db/get-pool.util';

type ClaimQueuedScanArgs = {
  readonly scanId: string;
  readonly userId: string;
};

/**
 * The queued → running transition apps/scan-orchestrator makes right
 * before actually executing a scan (acting as the seeded `system` user,
 * ADR-018). Unlike the fn_mark_scan_running it replaced (ADR-026), the
 * transition is a CLAIM: fn_claim_queued_scan only flips a row still at
 * 'queued' and reports whether this caller won, so a duplicate
 * orchestrator (or an overlapping wake) skips the scan instead of
 * executing it twice. fn_claim_queued_scan sets started_at then (not at
 * scan-creation time) because sp_ingest_scan_result's duration_ms
 * computation is `now() - started_at`, and a scan can legitimately sit at
 * 'queued' for a while before the orchestrator picks it up.
 */
export const claimQueuedScan = async ({
  scanId,
  userId,
}: ClaimQueuedScanArgs): Promise<boolean> => {
  const pool = getPool();
  const result = await pool.query<{ fn_claim_queued_scan: boolean }>(
    'SELECT cqms.fn_claim_queued_scan($1, $2) AS fn_claim_queued_scan',
    [userId, scanId],
  );
  return result.rows[0]?.fn_claim_queued_scan ?? false;
};
