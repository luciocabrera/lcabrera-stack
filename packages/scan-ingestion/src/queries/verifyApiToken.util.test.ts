import { hashSecret } from '@repo/data-access/crypto/hashSecret.util';
import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { generateApiToken } from '@repo/data-access/tokens/generateApiToken.util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { API_TOKEN_PREFIX } from '../auth/apiToken.constants.ts';
import { issueApiToken } from './issueApiToken.util.ts';
import { verifyApiToken } from './verifyApiToken.util.ts';

type SeedTokenArgs = {
  readonly deletedAt?: string;
  readonly enabled?: boolean;
  readonly expiresAt?: string;
  readonly ownerId: string;
};

// Seeds a token row directly so a test can control expiry/revocation/state
// (issueApiToken always writes a live token), returning its plaintext.
const seedToken = async ({
  deletedAt,
  enabled = true,
  expiresAt,
  ownerId,
}: SeedTokenArgs) => {
  const { plaintext, secret, tokenId } = generateApiToken({
    prefix: API_TOKEN_PREFIX,
  });
  const pool = getPool();
  await pool.query(
    `INSERT INTO cqms.api_tokens
       (user_id, token_id, token_hash, name, expires_at, enabled, deleted_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $1)`,
    // undefined parameters are serialized as SQL NULL by pg (prepareValue).
    [
      ownerId,
      tokenId,
      hashSecret({ secret }),
      'seed',
      expiresAt,
      enabled,
      deletedAt,
    ],
  );
  return { plaintext, tokenId };
};

describe('verifyApiToken', () => {
  let userId: string;
  let disabledUserId: string;

  beforeAll(async () => {
    const pool = getPool();
    const user = await pool.query<{ id: string }>(
      `INSERT INTO cqms.users (username, display_name, password_hash)
       VALUES ($1, $2, $3) RETURNING id`,
      ['api-token-verify-user', 'Verify User', 'x:y'],
    );
    userId = user.rows[0]?.id ?? '';

    const disabled = await pool.query<{ id: string }>(
      `INSERT INTO cqms.users (username, display_name, password_hash, enabled)
       VALUES ($1, $2, $3, false) RETURNING id`,
      ['api-token-verify-disabled', 'Verify Disabled', 'x:y'],
    );
    disabledUserId = disabled.rows[0]?.id ?? '';
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.users WHERE id = ANY($1::uuid[])', [
      [userId, disabledUserId],
    ]);
    await closePool();
  });

  it('resolves a freshly issued token to its owner and touches last_used_at', async () => {
    const { plaintext, tokenId } = await issueApiToken({
      name: 'valid',
      userId,
    });

    expect(await verifyApiToken(plaintext)).toEqual({ userId });

    const pool = getPool();
    const touched = await pool.query<{ last_used_at: null | string }>(
      'SELECT last_used_at FROM cqms.api_tokens WHERE token_id = $1',
      [tokenId],
    );
    expect(touched.rows[0]?.last_used_at).not.toBeNull();
  });

  it('rejects a wrong secret for a real tokenId', async () => {
    const { tokenId } = await issueApiToken({ name: 'wrong', userId });

    expect(
      await verifyApiToken(`${API_TOKEN_PREFIX}${tokenId}.wrongsecret`),
    ).toBeUndefined();
  });

  it('rejects malformed and unknown tokens', async () => {
    expect(await verifyApiToken('garbage')).toBeUndefined();
    expect(
      await verifyApiToken(`${API_TOKEN_PREFIX}deadbeef.secret`),
    ).toBeUndefined();
  });

  it('rejects an expired token', async () => {
    const { plaintext } = await seedToken({
      expiresAt: '2000-01-01T00:00:00Z',
      ownerId: userId,
    });

    expect(await verifyApiToken(plaintext)).toBeUndefined();
  });

  it('rejects a revoked (soft-deleted) token', async () => {
    const { plaintext } = await seedToken({
      deletedAt: '2020-01-01T00:00:00Z',
      enabled: false,
      ownerId: userId,
    });

    expect(await verifyApiToken(plaintext)).toBeUndefined();
  });

  it('rejects a token whose owner is disabled', async () => {
    const { plaintext } = await seedToken({ ownerId: disabledUserId });

    expect(await verifyApiToken(plaintext)).toBeUndefined();
  });
});
