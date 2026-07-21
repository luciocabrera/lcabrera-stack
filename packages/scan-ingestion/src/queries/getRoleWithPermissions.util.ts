import { getPool } from '@repo/server/db/get-pool.util';

export type RoleWithPermissions = {
  readonly description: null | string;
  readonly enabled: boolean;
  readonly id: string;
  readonly permission_ids: readonly string[];
  readonly role_name: string;
};

type GetRoleWithPermissionsArgs = {
  readonly roleName: string;
};

/**
 * One role plus its permission assignments, keyed by role_name — the admin
 * UI's routes use the role name as the human-readable row id (ADR-024).
 */
export const getRoleWithPermissions = async ({
  roleName,
}: GetRoleWithPermissionsArgs): Promise<RoleWithPermissions | undefined> => {
  const pool = getPool();
  const result = await pool.query<RoleWithPermissions>(
    `SELECT r.id, r.role_name, r.description, r.enabled,
            coalesce(
              (SELECT array_agg(rp.permission_id)
               FROM cqms.v_role_permissions rp
               WHERE rp.role_id = r.id),
              '{}'
            ) AS permission_ids
     FROM cqms.v_roles r
     WHERE r.role_name = $1`,
    [roleName],
  );
  return result.rows[0];
};
