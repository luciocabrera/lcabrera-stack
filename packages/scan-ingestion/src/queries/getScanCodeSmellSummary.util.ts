import { getPool } from '@lcabrera/server/db/get-pool.util';

export type CodeSmellScannerId = 'code-smell-checker' | 'code-smell-zen';

export type ScanCodeSmellSummary = {
  readonly blocker_count: number;
  readonly confidence_high_count: number;
  readonly confidence_low_count: number;
  readonly confidence_medium_count: number;
  readonly detail_view_finding_count: number;
  readonly effort_large_count: number;
  readonly effort_medium_count: number;
  readonly effort_small_count: number;
  readonly files_analyzed: number;
  readonly finding_count: number;
  readonly high_count: number;
  readonly report_id: null | string;
  readonly rules_flagged_count: number;
  readonly top_risk: null | string;
};

type GetScanCodeSmellSummaryArgs = {
  readonly scanId: string;
  readonly scannerId: CodeSmellScannerId;
};

// Literal view names keyed by scanner id — never interpolate caller input
// into SQL identifiers.
const VIEWS_BY_SCANNER = {
  'code-smell-checker': {
    findings: 'cqms.code_smell_checker_findings',
    runs: 'cqms.v_code_smell_checker_runs',
  },
  'code-smell-zen': {
    findings: 'cqms.code_smell_zen_findings',
    runs: 'cqms.v_code_smell_zen_runs',
  },
} as const;

/**
 * One scan's code-smell master row plus the row count its scanner-filtered
 * findings view yields (ADR-019 addendum, Step 5) — the analytics read
 * proving master and detail view line up. Returns undefined when the scan
 * has no master row.
 */
export const getScanCodeSmellSummary = async ({
  scanId,
  scannerId,
}: GetScanCodeSmellSummaryArgs): Promise<ScanCodeSmellSummary | undefined> => {
  const views = VIEWS_BY_SCANNER[scannerId];
  const pool = getPool();
  const result = await pool.query<ScanCodeSmellSummary>(
    `SELECT r.report_id, r.files_analyzed, r.finding_count,
            r.blocker_count, r.high_count,
            r.confidence_high_count, r.confidence_medium_count, r.confidence_low_count,
            r.effort_small_count, r.effort_medium_count, r.effort_large_count,
            r.rules_flagged_count, r.top_risk,
            (SELECT count(*)::int FROM ${views.findings} WHERE scan_id = r.scan_id)
              AS detail_view_finding_count
     FROM ${views.runs} r
     WHERE r.scan_id = $1`,
    [scanId],
  );
  return result.rows[0];
};
