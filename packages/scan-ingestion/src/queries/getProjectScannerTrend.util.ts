import { getPool } from '@lcabrera/server/db/get-pool.util';

export type ProjectScannerTrendRow = {
  readonly created_at: string;
  readonly high_count: null | number;
  readonly high_count_delta: null | number;
  readonly medium_count: null | number;
  readonly medium_count_delta: null | number;
  readonly run_id: string;
  readonly scanner_id: string;
};

type GetProjectScannerTrendArgs = {
  readonly projectId: string;
};

/**
 * Backs `project-detail`'s trend view — run-over-run deltas are computed
 * in SQL by `cqms.project_scanner_trend`'s window function, not
 * fetched-then-diffed here.
 */
export const getProjectScannerTrend = async ({
  projectId,
}: GetProjectScannerTrendArgs): Promise<readonly ProjectScannerTrendRow[]> => {
  const pool = getPool();
  const result = await pool.query<ProjectScannerTrendRow>(
    `SELECT scanner_id, run_id, created_at, high_count, medium_count, high_count_delta, medium_count_delta
     FROM cqms.project_scanner_trend
     WHERE project_id = $1
     ORDER BY scanner_id, created_at`,
    [projectId],
  );
  return result.rows;
};
