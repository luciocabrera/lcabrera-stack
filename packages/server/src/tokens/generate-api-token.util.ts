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
 * Mints a bearer token as two halves: a public `tokenId` (the indexed
 * lookup) and a high-entropy `secret` (only its hash is ever persisted).
 * `plaintext` — `<prefix><tokenId>.<secret>` — is shown to the user once at
 * issue time and never stored. `prefix` is caller-supplied (e.g. a product
 * tag that aids secret scanning); this util stays generic and reusable
 * across apps, with no product-specific value baked in.
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
