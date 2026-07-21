import { getPool } from '@repo/server/db/get-pool.util';

export type ProjectRunRow = {
  readonly created_at: string;
  readonly finished_at: null | string;
  readonly git_branch: null | string;
  readonly git_commit_sha: null | string;
  readonly id: string;
  readonly origin: string;
  readonly requested_scanners: readonly string[];
  readonly started_at: null | string;
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
 * covers every run so `project-detail`'s Table can list run history. The
 * rollup join lives in the cqms.v_project_runs view (ADR-018); only the
 * filter + pagination stay here.
 */
export const getProjectRuns = async ({
  limit,
  projectId,
  skip,
}: GetProjectRunsArgs): Promise<readonly ProjectRunRow[]> => {
  const pool = getPool();
  const result = await pool.query<ProjectRunRow>(
    `SELECT * FROM cqms.v_project_runs
     WHERE project_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [projectId, limit, skip],
  );
  return result.rows;
};
