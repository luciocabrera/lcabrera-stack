import { randomBytes, scryptSync } from 'node:crypto';

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

type HashApiTokenArgs = {
  readonly secret: string;
};

/**
 * Hashes an API token's secret half for storage. scrypt (node:crypto, zero
 * new deps), format `<saltHex>:<hashHex>` — the same scheme cqms user
 * passwords use, so credential hashing has one shape across the platform.
 * Only this hash is persisted; the secret is never stored. Counterpart of
 * isApiTokenValid.
 */
export const hashApiToken = ({ secret }: HashApiTokenArgs): string => {
  const salt = randomBytes(SALT_BYTES);
  const hash = scryptSync(secret, salt, KEY_LENGTH);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
};
