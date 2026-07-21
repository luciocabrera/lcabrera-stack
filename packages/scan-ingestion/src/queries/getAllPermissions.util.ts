import { getPool } from '@repo/server/db/get-pool.util';

export type PermissionRow = {
  readonly action: string;
  readonly id: string;
  readonly resource_type: string;
};

/** The full action × resource-type matrix — the role editor's options. */
export const getAllPermissions = async (): Promise<
  readonly PermissionRow[]
> => {
  const pool = getPool();
  const result = await pool.query<PermissionRow>(
    `SELECT id, action, resource_type
     FROM cqms.v_permissions
     ORDER BY resource_type, action`,
  );
  return result.rows;
};
