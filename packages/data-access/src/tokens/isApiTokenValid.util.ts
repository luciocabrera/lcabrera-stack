import { scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const SALT_HEX_LENGTH = 32;
const HASH_HEX_LENGTH = KEY_LENGTH * 2;

type IsApiTokenValidArgs = {
  readonly secret: string;
  readonly tokenHash: string;
};

/**
 * Counterpart of hashApiToken (`<saltHex>:<hashHex>`, scrypt). Returns
 * false — never throws — for a malformed stored hash, and compares with
 * timingSafeEqual so a partial match leaks no timing signal.
 */
export const isApiTokenValid = ({
  secret,
  tokenHash,
}: IsApiTokenValidArgs): boolean => {
  const [saltHex, hashHex] = tokenHash.split(':');
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
  const actual = scryptSync(secret, salt, KEY_LENGTH);
  return timingSafeEqual(actual, expected);
};
