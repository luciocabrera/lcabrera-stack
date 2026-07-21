import { getPool } from '@lcabrera/server/db/get-pool.util';

type UpdateRoleArgs = {
  readonly description?: string;
  readonly isEnabled?: boolean;
  readonly roleId: string;
  readonly userId: string;
};

/**
 * Updates description / enabled through cqms.fn_update_role (ADR-024).
 * role_name is immutable (the lockout guards reference it by name) and the
 * seeded admin role can never be disabled — both enforced in the function.
 */
export const updateRole = async ({
  description,
  isEnabled,
  roleId,
  userId,
}: UpdateRoleArgs): Promise<void> => {
  const pool = getPool();
  // undefined parameters are serialized as SQL NULL by pg (prepareValue).
  await pool.query('SELECT cqms.fn_update_role($1, $2, $3, $4)', [
    userId,
    roleId,
    description,
    isEnabled,
  ]);
};
