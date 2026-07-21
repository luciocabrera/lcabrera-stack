import { getPool } from '@repo/server/db/get-pool.util';

export type ProjectRow = {
  readonly created_at: string;
  readonly default_branch: string;
  readonly id: string;
  readonly last_scanned_at: null | string;
  readonly latest_snapshot_id: null | string;
  readonly name: string;
  /** Server directory of the latest synced snapshot — null until first sync (ADR-028). */
  readonly snapshot_path: null | string;
  readonly sync_source: null | string;
  readonly synced_at: null | string;
  readonly synced_by: null | string;
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
