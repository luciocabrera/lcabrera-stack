import { getPool } from '@lcabrera/server/db/get-pool.util';

type ReplaceRolePermissionsArgs = {
  readonly permissionIds: readonly string[];
  readonly roleId: string;
  readonly userId: string;
};

/**
 * Replaces a role's permission set through cqms.fn_replace_role_permissions
 * (ADR-024). The seeded admin role is immutable — the global lockout guard
 * lives in the function, not here.
 */
export const replaceRolePermissions = async ({
  permissionIds,
  roleId,
  userId,
}: ReplaceRolePermissionsArgs): Promise<void> => {
  const pool = getPool();
  await pool.query('SELECT cqms.fn_replace_role_permissions($1, $2, $3)', [
    userId,
    roleId,
    JSON.stringify(permissionIds),
  ]);
};
