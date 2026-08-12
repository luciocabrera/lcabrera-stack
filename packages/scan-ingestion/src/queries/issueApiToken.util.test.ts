import { isSecretHashValid } from '@lcabrera/server/crypto/is-secret-hash-valid.util';
import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { parseApiToken } from '@lcabrera/server/tokens/parse-api-token.util';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { API_TOKEN_PREFIX } from '../auth/auth.constants.ts';
import { issueApiToken } from './issueApiToken.util.ts';

describe('issueApiToken', () => {
  let userId: string;

  beforeAll(async () => {
    const pool = getPool();
    const created = await pool.query<{ id: string }>(
      `INSERT INTO cqms.users (username, display_name, password_hash)
       VALUES ($1, $2, $3) RETURNING id`,
      ['api-token-issue-user', 'Issue Test User', 'x:y'],
    );
    userId = created.rows[0]?.id ?? '';
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.users WHERE id = $1', [userId]);
    await closePool();
  });

  it('stores only the hash and lists the token without it', async () => {
    const { plaintext, tokenId } = await issueApiToken({
      name: 'my-laptop',
      userId,
    });

    const parsed = parseApiToken({ plaintext, prefix: API_TOKEN_PREFIX });
    expect(parsed?.tokenId).toBe(tokenId);

    const pool = getPool();
    const viewRow = await pool.query(
      'SELECT * FROM cqms.v_api_tokens WHERE token_id = $1',
      [tokenId],
    );
    expect(viewRow.rows[0]).toMatchObject({
      name: 'my-laptop',
      user_id: userId,
    });
    expect(viewRow.rows[0]).not.toHaveProperty('token_hash');

    const stored = await pool.query<{ token_hash: string }>(
      'SELECT token_hash FROM cqms.api_tokens WHERE token_id = $1',
      [tokenId],
    );
    expect(
      isSecretHashValid({
        secret: parsed?.secret ?? '',
        secretHash: stored.rows[0]?.token_hash ?? '',
      }),
    ).toBe(true);
  });

  it('rejects issuance for a disabled user', async () => {
    const pool = getPool();
    const disabled = await pool.query<{ id: string }>(
      `INSERT INTO cqms.users (username, display_name, password_hash, enabled)
       VALUES ($1, $2, $3, false) RETURNING id`,
      ['api-token-issue-disabled', 'Issue Disabled', 'x:y'],
    );
    const disabledId = disabled.rows[0]?.id ?? '';

    await expect(
      issueApiToken({ name: 'nope', userId: disabledId }),
    ).rejects.toThrow();

    await pool.query('DELETE FROM cqms.users WHERE id = $1', [disabledId]);
  });
});
