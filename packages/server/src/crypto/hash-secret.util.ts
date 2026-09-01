import { randomBytes, scryptSync } from 'node:crypto';

import { SCRYPT_KEY_LENGTH, SCRYPT_SALT_BYTES } from './crypto.constants.ts';

type HashSecretArgs = {
  readonly secret: string;
};

export const hashSecret = ({ secret }: HashSecretArgs) => {
  const salt = randomBytes(SCRYPT_SALT_BYTES);
  const hash = scryptSync(secret, salt, SCRYPT_KEY_LENGTH);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
};
