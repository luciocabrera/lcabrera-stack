import { getPool } from '@repo/server/db/get-pool.util';

type UpdateUserArgs = {
  readonly displayName?: string;
  readonly isEnabled?: boolean;
  readonly targetUserId: string;
  readonly userId: string;
};

/**
 * Updates display name / enabled through cqms.fn_update_user (ADR-024) —
 * the function carries the lockout guards (own account, system account).
 * Absent fields keep their current values (SQL NULL → coalesce).
 */
export const updateUser = async ({
  displayName,
  isEnabled,
  targetUserId,
  userId,
}: UpdateUserArgs): Promise<void> => {
  const pool = getPool();
  // undefined parameters are serialized as SQL NULL by pg (prepareValue).
  await pool.query('SELECT cqms.fn_update_user($1, $2, $3, $4)', [
    userId,
    targetUserId,
    displayName,
    isEnabled,
  ]);
};
