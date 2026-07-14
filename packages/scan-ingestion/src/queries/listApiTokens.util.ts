import { getPool } from '@repo/data-access/db/getPool.util';

export type ApiTokenSummary = {
  readonly created_at: string;
  readonly expires_at: null | string;
  readonly last_used_at: null | string;
  readonly name: string;
  readonly token_id: string;
};

type ListApiTokensArgs = {
  readonly userId: string;
};

/**
 * Lists a user's live (non-revoked) tokens for the management UI, reading
 * cqms.v_api_tokens which never exposes token_hash. Newest first.
 */
export const listApiTokens = async ({
  userId,
}: ListApiTokensArgs): Promise<readonly ApiTokenSummary[]> => {
  const pool = getPool();
  const result = await pool.query<ApiTokenSummary>(
    `SELECT token_id, name, last_used_at, expires_at, created_at
     FROM cqms.v_api_tokens
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );

  return result.rows;
};
