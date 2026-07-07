import { getPool } from '@repo/data-access/db/getPool.util';

import { hashPassword } from '../auth/hashPassword.util.ts';

type SetUserPasswordArgs = {
  readonly password: string;
  readonly targetUserId: string;
  readonly userId: string;
};

/**
 * Sets a password through cqms.fn_set_user_password (ADR-024): changing
 * your OWN password needs no role permission (this is how the seeded admin
 * default gets rotated); changing someone else's asserts 'update' on
 * 'user'. Hashing happens here (scrypt, ADR-017) — the hash never crosses
 * the package boundary.
 */
export const setUserPassword = async ({
  password,
  targetUserId,
  userId,
}: SetUserPasswordArgs): Promise<void> => {
  const pool = getPool();
  await pool.query('SELECT cqms.fn_set_user_password($1, $2, $3)', [
    userId,
    targetUserId,
    hashPassword({ password }),
  ]);
};
