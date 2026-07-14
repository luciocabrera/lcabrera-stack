import { getPool } from '@repo/data-access/db/getPool.util';

type RevokeApiTokenArgs = {
  readonly tokenId: string;
  readonly userId: string;
};

/**
 * Revokes (soft-deletes) a token via cqms.fn_revoke_api_token: the owner may
 * revoke their own; revoking another user's requires 'update' on that user
 * (ADR-024). The DB function raises for an unknown token or a permission
 * failure (ERRCODE 42501).
 */
export const revokeApiToken = async ({
  tokenId,
  userId,
}: RevokeApiTokenArgs): Promise<void> => {
  const pool = getPool();
  await pool.query('SELECT cqms.fn_revoke_api_token($1, $2)', [
    userId,
    tokenId,
  ]);
};
