import { getPool } from '@repo/data-access/db/getPool.util';

export type ProjectWorkspaceRow = {
  readonly workspace_name: null | string;
  readonly workspace_path: string;
};

type GetProjectWorkspacesArgs = {
  readonly projectId: string;
};

/**
 * The persisted discovery snapshot for one project (ADR-021) — what
 * trigger-scan's workspace multi-select was last told exists. The
 * authoritative list at scan time is a FRESH discovery; this read backs
 * displays that must not touch the filesystem.
 */
export const getProjectWorkspaces = async ({
  projectId,
}: GetProjectWorkspacesArgs): Promise<readonly ProjectWorkspaceRow[]> => {
  const pool = getPool();
  const result = await pool.query<ProjectWorkspaceRow>(
    `SELECT workspace_path, workspace_name
     FROM cqms.v_project_workspaces
     WHERE project_id = $1
     ORDER BY workspace_path`,
    [projectId],
  );
  return result.rows;
};
