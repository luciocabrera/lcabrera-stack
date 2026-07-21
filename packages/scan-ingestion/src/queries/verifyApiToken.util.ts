import { isSecretHashValid } from '@repo/server/crypto/is-secret-hash-valid.util';
import { getPool } from '@repo/server/db/get-pool.util';
import { parseApiToken } from '@repo/server/tokens/parse-api-token.util';

import { API_TOKEN_PREFIX } from '../auth/apiToken.constants.ts';

export type VerifiedApiToken = {
  readonly userId: string;
};

type ApiTokenSecretRow = {
  readonly token_hash: string;
  readonly user_id: string;
};

/**
 * Verifies a bearer-token plaintext and resolves it to the owning user, or
 * undefined for anything invalid — malformed, unknown, revoked, expired,
 * disabled owner, or wrong secret (no oracle distinguishing them). Mirrors
 * authenticateUser (ADR-017): fn_get_api_token_secret is the ONLY path that
 * returns the stored hash, the comparison happens here, and the hash never
 * crosses this boundary. Records last use on success.
 */
export const verifyApiToken = async (
  plaintext: string,
): Promise<undefined | VerifiedApiToken> => {
  const parsed = parseApiToken({ plaintext, prefix: API_TOKEN_PREFIX });
  if (parsed === undefined) {
    return undefined;
  }

  const pool = getPool();
  const result = await pool.query<ApiTokenSecretRow>(
    'SELECT * FROM cqms.fn_get_api_token_secret($1)',
    [parsed.tokenId],
  );

  const row = result.rows[0];
  if (row === undefined) {
    return undefined;
  }

  if (
    !isSecretHashValid({ secret: parsed.secret, secretHash: row.token_hash })
  ) {
    return undefined;
  }

  await pool.query('SELECT cqms.fn_touch_api_token($1)', [parsed.tokenId]);

  return { userId: row.user_id };
};
