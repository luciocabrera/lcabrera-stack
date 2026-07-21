import { randomBytes, scryptSync } from 'node:crypto';

import { SCRYPT_KEY_LENGTH, SCRYPT_SALT_BYTES } from './crypto.constants.ts';

type HashSecretArgs = {
  readonly secret: string;
};

/**
 * Hashes any secret for storage — a user password, an API token's secret
 * half, anything that must be verifiable but never readable back. scrypt
 * (node:crypto, zero new deps — ADR-017), output format
 * `<saltHex>:<hashHex>`, fresh salt per call.
 *
 * One shape for every credential on the platform: only the hash is
 * persisted, and isSecretHashValid is the only counterpart that reads it.
 */
export const hashSecret = ({ secret }: HashSecretArgs) => {
  const salt = randomBytes(SCRYPT_SALT_BYTES);
  const hash = scryptSync(secret, salt, SCRYPT_KEY_LENGTH);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
};
