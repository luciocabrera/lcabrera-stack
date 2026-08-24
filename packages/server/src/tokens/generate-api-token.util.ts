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
 * Two halves: a public `tokenId` for the indexed lookup, and a high-entropy `secret` of
 * which only the hash is persisted. `plaintext` — `<prefix><tokenId>.<secret>` — is shown
 * once at issue time and never stored. `prefix` is caller-supplied (e.g. a product tag
 * that aids secret scanning); this util stays generic.
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
