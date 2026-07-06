import { getPool } from '@repo/data-access/db/getPool.util';

export type QueuedScanRow = {
  readonly deterministic: boolean;
  readonly local_path: string;
  readonly project_id: string;
  readonly run_id: string;
  readonly scan_id: string;
  readonly scanner_id: string;
  readonly scope_type: string;
  readonly scope_value: string;
  readonly skill_path: string;
};

/**
 * Backs apps/scan-orchestrator's job queue (TECH_SPEC §2.7) — every scan
 * still at 'queued', joined to the scanner's execution shape
 * (deterministic/skill_path) and the owning project's local_path, so the
 * orchestrator has everything it needs to actually run the scan without a
 * second round-trip. Read on both the LISTEN/NOTIFY wake-up and the
 * reconciliation poll — the same query serves both, since exactly-once
 * processing is guaranteed by the row's own status transition, not by
 * which caller triggered the read. The 3-table join lives in the
 * cqms.v_queued_scans view (ADR-018) — soft-deleted scans, projects, or
 * scanners drop out of the queue there.
 */
export const getQueuedScans = async (): Promise<readonly QueuedScanRow[]> => {
  const pool = getPool();
  const result = await pool.query<QueuedScanRow>(
    `SELECT scan_id, run_id, project_id, scanner_id, scope_type, scope_value,
            deterministic, skill_path, local_path
     FROM cqms.v_queued_scans
     ORDER BY created_at ASC`,
  );
  return result.rows;
};
