import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { issueApiToken } from './issueApiToken.util.ts';
import { revokeApiToken } from './revokeApiToken.util.ts';

describe('revokeApiToken', () => {
  let ownerId: string;
  let strangerId: string;

  beforeAll(async () => {
    const pool = getPool();
    const owner = await pool.query<{ id: string }>(
      `INSERT INTO cqms.users (username, display_name, password_hash)
       VALUES ($1, $2, $3) RETURNING id`,
      ['api-token-revoke-owner', 'Revoke Owner', 'x:y'],
    );
    ownerId = owner.rows[0]?.id ?? '';

    const stranger = await pool.query<{ id: string }>(
      `INSERT INTO cqms.users (username, display_name, password_hash)
       VALUES ($1, $2, $3) RETURNING id`,
      ['api-token-revoke-stranger', 'Revoke Stranger', 'x:y'],
    );
    strangerId = stranger.rows[0]?.id ?? '';
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.users WHERE id = ANY($1::uuid[])', [
      [ownerId, strangerId],
    ]);
    await closePool();
  });

  it('lets the owner revoke their own token (soft-delete, gone from the view)', async () => {
    const { tokenId } = await issueApiToken({ name: 'own', userId: ownerId });

    await revokeApiToken({ tokenId, userId: ownerId });

    const pool = getPool();
    const view = await pool.query(
      'SELECT 1 FROM cqms.v_api_tokens WHERE token_id = $1',
      [tokenId],
    );
    expect(view.rowCount).toBe(0);
  });

  it('rejects a non-owner without update:user permission', async () => {
    const { tokenId } = await issueApiToken({
      name: 'guarded',
      userId: ownerId,
    });

    await expect(
      revokeApiToken({ tokenId, userId: strangerId }),
    ).rejects.toThrow();
  });
});
