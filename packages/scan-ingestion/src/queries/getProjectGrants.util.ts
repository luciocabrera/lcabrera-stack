import { getPool } from '@repo/server/db/get-pool.util';

export type ProjectGrantRow = {
  readonly action: string;
  readonly display_name: string;
  readonly id: string;
  readonly resource_type: string;
  readonly username: string;
};

type GetProjectGrantsArgs = {
  readonly projectId: string;
};

/**
 * Per-instance grants targeting one project (ADR-024's grants editor) —
 * every grant whose resource_id IS the project, regardless of resource
 * type: "execute scans on project Y" is (execute, scan, <project uuid>),
 * the exact tuple fn_create_run asserts (0009).
 */
export const getProjectGrants = async ({
  projectId,
}: GetProjectGrantsArgs): Promise<readonly ProjectGrantRow[]> => {
  const pool = getPool();
  const result = await pool.query<ProjectGrantRow>(
    `SELECT g.id, g.action, g.resource_type, u.username, u.display_name
     FROM cqms.v_resource_grants g
     JOIN cqms.v_users u ON u.id = g.grantee_user_id
     WHERE g.resource_id = $1
     ORDER BY u.username, g.resource_type, g.action`,
    [projectId],
  );
  return result.rows;
};
