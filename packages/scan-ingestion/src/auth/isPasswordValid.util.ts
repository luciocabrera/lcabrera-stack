import { scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const SALT_HEX_LENGTH = 32;
const HASH_HEX_LENGTH = KEY_LENGTH * 2;

type IsPasswordValidArgs = {
  readonly password: string;
  readonly passwordHash: string;
};

/**
 * Counterpart of hashPassword (`<saltHex>:<hashHex>`, scrypt). Returns
 * false — never throws — for malformed stored hashes, so non-loginable
 * sentinel values (the seeded `system` user) simply fail verification.
 * Comparison is timingSafeEqual to avoid leaking prefix-match timing.
 */
export const isPasswordValid = ({
  password,
  passwordHash,
}: IsPasswordValidArgs): boolean => {
  const [saltHex, hashHex] = passwordHash.split(':');
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
  const actual = scryptSync(password, salt, KEY_LENGTH);
  return timingSafeEqual(actual, expected);
};
