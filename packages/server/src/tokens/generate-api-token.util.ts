import { randomBytes } from 'node:crypto';

const TOKEN_ID_BYTES = 8; // 16 hex chars — public, indexed lookup half
const SECRET_BYTES = 32; // 256-bit secret half — only its hash is stored

export type GenerateApiTokenResult = {
  readonly plaintext: string;
  readonly secret: string;
  readonly tokenId: string;
};

type GenerateApiTokenArgs = {
  readonly prefix?: string;
};

/**
 * `plaintext` — `<prefix><tokenId>.<secret>` — is shown to the user once at issue time and
 * never stored.
 * `prefix` is caller-supplied (e.g.
 */
export const generateApiToken = ({
  prefix = '',
}: GenerateApiTokenArgs = {}): GenerateApiTokenResult => {
  const tokenId = randomBytes(TOKEN_ID_BYTES).toString('hex');
  const secret = randomBytes(SECRET_BYTES).toString('hex');

  return {
    plaintext: `${prefix}${tokenId}.${secret}`,
    secret,
    tokenId,
  };
};
