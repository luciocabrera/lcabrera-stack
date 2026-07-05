import { getPool } from '@repo/data-access/db/getPool.util';

export type ProjectRunRow = {
  readonly created_at: string;
  readonly finished_at: string | null;
  readonly git_branch: string | null;
  readonly git_commit_sha: string | null;
  readonly id: string;
  readonly origin: string;
  readonly requested_scanners: readonly string[];
  readonly started_at: string | null;
  readonly status: string;
  readonly total_high: number;
  readonly total_medium: number;
};

type GetProjectRunsArgs = {
  readonly limit: number;
  readonly projectId: string;
  readonly skip: number;
};

/**
 * Paginated runs for one project, each with its own severity rollup —
 * unlike `project_run_summary` (latest run only, TECH_SPEC §2.3a), this
 * covers every run so `project-detail`'s Table can list run history.
 */
export const getProjectRuns = async ({
  limit,
  projectId,
  skip,
}: GetProjectRunsArgs): Promise<readonly ProjectRunRow[]> => {
  const pool = getPool();
  const result = await pool.query<ProjectRunRow>(
    `SELECT r.*,
            COALESCE(SUM(rep.high_count), 0)::int AS total_high,
            COALESCE(SUM(rep.medium_count), 0)::int AS total_medium
     FROM cqms.runs r
     LEFT JOIN cqms.scans s ON s.run_id = r.id
     LEFT JOIN cqms.reports rep ON rep.scan_id = s.id
     WHERE r.project_id = $1
     GROUP BY r.id
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [projectId, limit, skip],
  );
  return result.rows;
};
