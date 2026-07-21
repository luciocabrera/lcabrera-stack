import { getPool } from '@lcabrera/server/db/get-pool.util';

export type ScanFindingRow = {
  readonly confidence: string;
  readonly effort: null | string;
  readonly evidence_excerpt: null | string;
  readonly finding_id: string;
  readonly fix: string;
  readonly location_hint: null | string;
  readonly location_path: string;
  readonly rule_id: string;
  readonly severity: string;
  readonly status: string;
  readonly why: string;
};

export type ScanFindingsResult = {
  readonly rows: readonly ScanFindingRow[];
  readonly total: number;
};

type GetScanFindingsArgs = {
  readonly limit: number;
  readonly scanId: string;
  readonly severity?: string;
  readonly skip: number;
};

/**
 * Paginated, optionally severity-filtered findings for one scan. `severity`
 * is validated by the caller (a Zod enum matching the `scan_findings`
 * CHECK constraint's values) before reaching here — this function only
 * binds it as a parameter, never string-interpolates it.
 */
export const getScanFindings = async ({
  limit,
  scanId,
  severity,
  skip,
}: GetScanFindingsArgs): Promise<ScanFindingsResult> => {
  const pool = getPool();
  const severityFilter = severity ? 'AND severity = $4' : '';
  const params = severity
    ? [scanId, limit, skip, severity]
    : [scanId, limit, skip];

  const [rowsResult, countResult] = await Promise.all([
    pool.query<ScanFindingRow>(
      `SELECT confidence, effort, evidence_excerpt, finding_id, fix, location_hint, location_path, rule_id, severity, status, why
       FROM cqms.v_all_findings
       WHERE scan_id = $1 ${severityFilter}
       ORDER BY severity, location_path
       LIMIT $2 OFFSET $3`,
      params,
    ),
    pool.query<{ count: string }>(
      `SELECT count(*) FROM cqms.v_all_findings WHERE scan_id = $1 ${severity ? 'AND severity = $2' : ''}`,
      severity ? [scanId, severity] : [scanId],
    ),
  ]);

  return {
    rows: rowsResult.rows,
    total: Number(countResult.rows[0]?.count ?? 0),
  };
};
