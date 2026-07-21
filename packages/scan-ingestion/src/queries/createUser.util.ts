import { hashSecret } from '@repo/server/crypto/hash-secret.util';
import { getPool } from '@repo/server/db/get-pool.util';

export type CreateUserResult = {
  readonly createdUserId: string;
};

type CreateUserArgs = {
  readonly displayName: string;
  readonly password: string;
  readonly userId: string;
  readonly username: string;
};

/**
 * Creates a user through cqms.fn_create_user (ADR-024, asserts 'create' on
 * 'user'). The plain password is hashed HERE (scrypt, ADR-017) — hashes
 * never cross this package's boundary in either direction.
 */
export const createUser = async ({
  displayName,
  password,
  userId,
  username,
}: CreateUserArgs): Promise<CreateUserResult> => {
  const pool = getPool();
  const result = await pool.query<{ fn_create_user: string }>(
    'SELECT cqms.fn_create_user($1, $2, $3, $4) AS fn_create_user',
    [userId, username, displayName, hashSecret({ secret: password })],
  );

  const createdUserId = result.rows[0]?.fn_create_user;
  if (!createdUserId) {
    throw new Error('Failed to create user.');
  }
  return { createdUserId };
};
