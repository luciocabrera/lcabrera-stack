import { getPool } from '@repo/server/db/get-pool.util';

export type ScanFallowSummary = {
  readonly average_maintainability: null | number;
  readonly check_total_issues: number;
  readonly circular_dependency_count: number;
  readonly clone_group_count: number;
  readonly clone_instance_count: number;
  readonly dead_code_count: number;
  readonly fallow_version: null | string;
  readonly file_score_count: number;
  readonly files_analyzed: number;
  readonly function_finding_count: number;
  readonly functions_above_threshold: number;
  readonly hotspot_count: number;
  readonly large_function_count: number;
  readonly target_count: number;
};

type GetScanFallowSummaryArgs = {
  readonly scanId: string;
};

/**
 * One scan's fallow master row plus row counts across its detail tables
 * (ADR-019 addendum) — the first analytics read over the fallow
 * master/detail layer, and the integrity probe used to verify a detail
 * ingestion end to end. Returns undefined when the scan has no master row
 * (not a fallow scan, or detail extraction never ran).
 */
export const getScanFallowSummary = async ({
  scanId,
}: GetScanFallowSummaryArgs): Promise<ScanFallowSummary | undefined> => {
  const pool = getPool();
  const result = await pool.query<ScanFallowSummary>(
    `SELECT r.fallow_version,
            r.files_analyzed,
            r.functions_above_threshold,
            r.check_total_issues,
            r.average_maintainability::float8 AS average_maintainability,
            (SELECT count(*)::int FROM cqms.v_fallow_file_scores           WHERE scan_id = r.scan_id) AS file_score_count,
            (SELECT count(*)::int FROM cqms.v_fallow_hotspots              WHERE scan_id = r.scan_id) AS hotspot_count,
            (SELECT count(*)::int FROM cqms.v_fallow_clone_groups          WHERE scan_id = r.scan_id) AS clone_group_count,
            (SELECT count(*)::int FROM cqms.v_fallow_clone_instances       WHERE scan_id = r.scan_id) AS clone_instance_count,
            (SELECT count(*)::int FROM cqms.v_fallow_dead_code             WHERE scan_id = r.scan_id) AS dead_code_count,
            (SELECT count(*)::int FROM cqms.v_fallow_circular_dependencies WHERE scan_id = r.scan_id) AS circular_dependency_count,
            (SELECT count(*)::int FROM cqms.v_fallow_large_functions       WHERE scan_id = r.scan_id) AS large_function_count,
            (SELECT count(*)::int FROM cqms.v_fallow_targets               WHERE scan_id = r.scan_id) AS target_count,
            (SELECT count(*)::int FROM cqms.v_fallow_function_findings     WHERE scan_id = r.scan_id) AS function_finding_count
     FROM cqms.v_fallow_runs r
     WHERE r.scan_id = $1`,
    [scanId],
  );
  return result.rows[0];
};
