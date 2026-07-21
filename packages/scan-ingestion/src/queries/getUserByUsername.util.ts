import { getPool } from '@repo/server/db/get-pool.util';

import type { UserRow } from './getUserById.util.ts';

type GetUserByUsernameArgs = {
  readonly username: string;
};

/**
 * How non-interactive actors resolve their identity (ADR-018): the
 * orchestrator and the ingest CLI look up the seeded 'system' user before
 * calling any write function. Reads via cqms.v_users — no password_hash,
 * no soft-deleted rows.
 */
export const getUserByUsername = async ({
  username,
}: GetUserByUsernameArgs): Promise<undefined | UserRow> => {
  const pool = getPool();
  const result = await pool.query<UserRow>(
    'SELECT * FROM cqms.v_users WHERE username = $1 AND enabled',
    [username],
  );
  return result.rows[0];
};
