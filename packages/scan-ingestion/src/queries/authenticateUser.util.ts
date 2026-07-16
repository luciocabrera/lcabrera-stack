import { isSecretHashValid } from '@repo/data-access/crypto/isSecretHashValid.util';
import { getPool } from '@repo/data-access/db/getPool.util';

export type AuthenticatedUser = {
  readonly displayName: string;
  readonly userId: string;
  readonly username: string;
};

type AuthenticateUserArgs = {
  readonly password: string;
  readonly username: string;
};

type CredentialsRow = {
  readonly display_name: string;
  readonly id: string;
  readonly password_hash: string;
  readonly username: string;
};

/**
 * Backs the login action (ADR-017). fn_get_user_credentials is the ONLY
 * read path that returns password_hash — disabled/soft-deleted users get
 * no row, so they fail before any hash comparison. Returns undefined for
 * both unknown-user and wrong-password (no oracle distinguishing them);
 * the hash itself never crosses this function's boundary.
 */
export const authenticateUser = async ({
  password,
  username,
}: AuthenticateUserArgs): Promise<AuthenticatedUser | undefined> => {
  const pool = getPool();
  const result = await pool.query<CredentialsRow>(
    'SELECT * FROM cqms.fn_get_user_credentials($1)',
    [username],
  );

  const row = result.rows[0];
  if (row === undefined) return undefined;

  const isValid = isSecretHashValid({
    secret: password,
    secretHash: row.password_hash,
  });
  if (!isValid) return undefined;

  return {
    displayName: row.display_name,
    userId: row.id,
    username: row.username,
  };
};
