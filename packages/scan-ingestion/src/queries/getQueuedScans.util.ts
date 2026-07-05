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
 * which caller triggered the read.
 */
export const getQueuedScans = async (): Promise<readonly QueuedScanRow[]> => {
  const pool = getPool();
  const result = await pool.query<QueuedScanRow>(
    `SELECT
       s.id AS scan_id, s.run_id, s.project_id, s.scanner_id,
       s.scope_type, s.scope_value,
       sc.deterministic, sc.skill_path,
       p.local_path
     FROM cqms.scans s
     JOIN cqms.scanners sc ON sc.scanner_id = s.scanner_id
     JOIN cqms.projects p ON p.id = s.project_id
     WHERE s.status = 'queued'
     ORDER BY s.created_at ASC`,
  );
  return result.rows;
};
