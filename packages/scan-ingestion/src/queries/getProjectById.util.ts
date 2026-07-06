import { getPool } from '@repo/data-access/db/getPool.util';

export type ProjectRow = {
  readonly created_at: string;
  readonly default_branch: string;
  readonly id: string;
  readonly last_scanned_at: null | string;
  readonly local_path: string;
  readonly name: string;
};

type GetProjectByIdArgs = {
  readonly projectId: string;
};

export const getProjectById = async ({
  projectId,
}: GetProjectByIdArgs): Promise<ProjectRow | undefined> => {
  const pool = getPool();
  const result = await pool.query<ProjectRow>(
    'SELECT * FROM cqms.v_projects WHERE id = $1',
    [projectId],
  );
  return result.rows[0];
};
