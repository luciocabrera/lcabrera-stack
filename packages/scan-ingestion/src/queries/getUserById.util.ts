import { getPool } from '@lcabrera/server/db/get-pool.util';

export type UserRow = {
  readonly created_at: string;
  readonly created_by: null | string;
  readonly display_name: string;
  readonly edited_at: null | string;
  readonly edited_by: null | string;
  readonly enabled: boolean;
  readonly id: string;
  readonly username: string;
};

type GetUserByIdArgs = {
  readonly userId: string;
};

/**
 * Session validation read (ADR-017) — goes through cqms.v_users, which
 * excludes password_hash and soft-deleted rows by construction. A session
 * whose user has since been deleted or disabled resolves to undefined and
 * gets logged out by requireUser.
 */
export const getUserById = async ({
  userId,
}: GetUserByIdArgs): Promise<undefined | UserRow> => {
  const pool = getPool();
  const result = await pool.query<UserRow>(
    'SELECT * FROM cqms.v_users WHERE id = $1 AND enabled',
    [userId],
  );
  return result.rows[0];
};
