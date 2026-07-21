import { getPool } from '@lcabrera/server/db/get-pool.util';

export type RunRow = {
  readonly created_at: string;
  readonly finished_at: null | string;
  readonly git_branch: null | string;
  readonly git_commit_sha: null | string;
  readonly id: string;
  readonly origin: string;
  readonly project_id: string;
  readonly requested_scanners: readonly string[];
  readonly started_at: null | string;
  readonly status: string;
  readonly triggered_by: null | string;
};

type GetRunByIdArgs = {
  readonly runId: string;
};

export const getRunById = async ({
  runId,
}: GetRunByIdArgs): Promise<RunRow | undefined> => {
  const pool = getPool();
  const result = await pool.query<RunRow>(
    'SELECT * FROM cqms.v_runs WHERE id = $1',
    [runId],
  );
  return result.rows[0];
};
