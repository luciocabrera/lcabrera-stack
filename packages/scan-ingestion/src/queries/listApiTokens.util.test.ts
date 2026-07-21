import { closePool, getPool } from '@repo/server/db/get-pool.util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { issueApiToken } from './issueApiToken.util.ts';
import { listApiTokens } from './listApiTokens.util.ts';
import { revokeApiToken } from './revokeApiToken.util.ts';

describe('listApiTokens', () => {
  let userId: string;
  let otherUserId: string;
  let liveTokenId: string;
  let revokedTokenId: string;
  let otherTokenId: string;

  beforeAll(async () => {
    const pool = getPool();
    const user = await pool.query<{ id: string }>(
      `INSERT INTO cqms.users (username, display_name, password_hash)
       VALUES ($1, $2, $3) RETURNING id`,
      ['api-token-list-user', 'List User', 'x:y'],
    );
    userId = user.rows[0]?.id ?? '';

    const other = await pool.query<{ id: string }>(
      `INSERT INTO cqms.users (username, display_name, password_hash)
       VALUES ($1, $2, $3) RETURNING id`,
      ['api-token-list-other', 'List Other', 'x:y'],
    );
    otherUserId = other.rows[0]?.id ?? '';

    const liveToken = await issueApiToken({ name: 'live', userId });
    liveTokenId = liveToken.tokenId;
    const revokedToken = await issueApiToken({ name: 'revoked', userId });
    revokedTokenId = revokedToken.tokenId;
    const otherToken = await issueApiToken({
      name: 'other',
      userId: otherUserId,
    });
    otherTokenId = otherToken.tokenId;

    await revokeApiToken({ tokenId: revokedTokenId, userId });
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.users WHERE id = ANY($1::uuid[])', [
      [userId, otherUserId],
    ]);
    await closePool();
  });

  it("returns only the owner's live tokens, without the hash", async () => {
    const tokens = await listApiTokens({ userId });
    const ids = tokens.map((token) => token.token_id);

    expect(ids).toContain(liveTokenId);
    expect(ids).not.toContain(revokedTokenId);
    expect(ids).not.toContain(otherTokenId);
    expect(tokens[0]).not.toHaveProperty('token_hash');
  });
});
