import { randomBytes, scryptSync } from 'node:crypto';

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

type HashPasswordArgs = {
  readonly password: string;
};

/**
 * scrypt (node:crypto, default cost params N=16384/r=8/p=1) over bcrypt/
 * argon2 — zero new dependencies (ADR-017). Output format `<saltHex>:<hashHex>`
 * is what isPasswordValid parses; anything that doesn't match that shape
 * (e.g. the seeded `system` user's sentinel) can never verify. Hashes are
 * internal to this package: they go into cqms.users via queries and come
 * back only through fn_get_user_credentials inside authenticateUser —
 * never across the package boundary.
 */
export const hashPassword = ({ password }: HashPasswordArgs): string => {
  const salt = randomBytes(SALT_BYTES);
  const hash = scryptSync(password, salt, KEY_LENGTH);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
};
