import { getPool } from '@repo/server/db/get-pool.util';

export type LintRuleSummaryRow = {
  readonly active_count: number;
  readonly rule_id: string;
  readonly source: string;
  readonly suppressed_count: number;
};

type GetScanLintRuleSummaryArgs = {
  readonly scanId: string;
};

/**
 * Per-rule rollup over one scan's cqms.v_lint_violations (ADR-019) — the
 * first analytics read over the lint detail tables, splitting live
 * violations from suppressed (baselined) debt per rule.
 */
export const getScanLintRuleSummary = async ({
  scanId,
}: GetScanLintRuleSummaryArgs): Promise<readonly LintRuleSummaryRow[]> => {
  const pool = getPool();
  const result = await pool.query<LintRuleSummaryRow>(
    `SELECT source, rule_id,
            (count(*) FILTER (WHERE NOT suppressed))::int AS active_count,
            (count(*) FILTER (WHERE suppressed))::int AS suppressed_count
     FROM cqms.v_lint_violations
     WHERE scan_id = $1
     GROUP BY source, rule_id
     ORDER BY count(*) DESC, rule_id ASC`,
    [scanId],
  );
  return result.rows;
};
