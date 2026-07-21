import { getPool } from '@repo/server/db/get-pool.util';

type ReplaceUserRolesArgs = {
  readonly roleIds: readonly string[];
  readonly targetUserId: string;
  readonly userId: string;
};

/**
 * Replaces a user's role set through cqms.fn_replace_user_roles (ADR-024)
 * — DELETE-then-INSERT snapshot semantics like every other replace
 * function; the function guards self-admin-removal and the system account.
 */
export const replaceUserRoles = async ({
  roleIds,
  targetUserId,
  userId,
}: ReplaceUserRolesArgs): Promise<void> => {
  const pool = getPool();
  await pool.query('SELECT cqms.fn_replace_user_roles($1, $2, $3)', [
    userId,
    targetUserId,
    JSON.stringify(roleIds),
  ]);
};
