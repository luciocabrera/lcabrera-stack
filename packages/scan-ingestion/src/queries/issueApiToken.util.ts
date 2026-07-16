import { hashSecret } from '@repo/data-access/crypto/hashSecret.util';
import { getPool } from '@repo/data-access/db/getPool.util';
import { generateApiToken } from '@repo/data-access/tokens/generateApiToken.util';

import { API_TOKEN_PREFIX } from '../auth/apiToken.constants.ts';

export type IssueApiTokenResult = {
  readonly plaintext: string;
  readonly tokenId: string;
};

type IssueApiTokenArgs = {
  readonly expiresAt?: Date;
  readonly name: string;
  readonly userId: string;
};

/**
 * Mints a personal API token for the acting user (self-service, ADR-029).
 * The secret is hashed here and only its hash reaches the DB via
 * cqms.fn_issue_api_token; the plaintext is returned exactly once for the
 * caller to display and is never persisted. The DB function rejects a
 * disabled actor.
 */
export const issueApiToken = async ({
  expiresAt,
  name,
  userId,
}: IssueApiTokenArgs): Promise<IssueApiTokenResult> => {
  const { plaintext, secret, tokenId } = generateApiToken({
    prefix: API_TOKEN_PREFIX,
  });
  const tokenHash = hashSecret({ secret });

  const pool = getPool();
  // undefined parameters are serialized as SQL NULL by pg (prepareValue).
  await pool.query('SELECT cqms.fn_issue_api_token($1, $2, $3, $4, $5)', [
    userId,
    tokenId,
    tokenHash,
    name,
    expiresAt,
  ]);

  return { plaintext, tokenId };
};
