import { getPool } from '@lcabrera/server/db/get-pool.util';

export type CreateRoleResult = {
  readonly roleId: string;
};

type CreateRoleArgs = {
  readonly description?: string;
  readonly roleName: string;
  readonly userId: string;
};

/** Creates a role through cqms.fn_create_role (ADR-024, asserts 'create' on 'role'). */
export const createRole = async ({
  description,
  roleName,
  userId,
}: CreateRoleArgs): Promise<CreateRoleResult> => {
  const pool = getPool();
  const result = await pool.query<{ fn_create_role: string }>(
    'SELECT cqms.fn_create_role($1, $2, $3) AS fn_create_role',
    [userId, roleName, description],
  );

  const roleId = result.rows[0]?.fn_create_role;
  if (!roleId) {
    throw new Error('Failed to create role.');
  }
  return { roleId };
};
