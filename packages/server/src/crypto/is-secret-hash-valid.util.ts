import { scryptSync, timingSafeEqual } from 'node:crypto';

import { SCRYPT_KEY_LENGTH, SCRYPT_SALT_BYTES } from './crypto.constants.ts';

const SALT_HEX_LENGTH = SCRYPT_SALT_BYTES * 2;
const HASH_HEX_LENGTH = SCRYPT_KEY_LENGTH * 2;

type IsSecretHashValidArgs = {
  readonly secret: string;
  readonly secretHash: string;
};

/**
 * Counterpart of `hashSecret`: verifies a candidate secret against a stored
 * `<saltHex>:<hashHex>` hash with `timingSafeEqual`, so a partial match leaks no timing
 * signal. Returns false — never throws — for anything that isn't that shape, so a
 * non-verifiable sentinel in the hash column simply fails rather than erroring.
 */
export const isSecretHashValid = ({
  secret,
  secretHash,
}: IsSecretHashValidArgs) => {
  const [saltHex, hashHex] = secretHash.split(':', 2);
  if (
    saltHex === undefined ||
    hashHex === undefined ||
    saltHex.length !== SALT_HEX_LENGTH ||
    hashHex.length !== HASH_HEX_LENGTH ||
    !/^[0-9a-f]+$/.test(saltHex) ||
    !/^[0-9a-f]+$/.test(hashHex)
  ) {
    return false;
  }

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(secret, salt, SCRYPT_KEY_LENGTH);
  return timingSafeEqual(actual, expected);
};
