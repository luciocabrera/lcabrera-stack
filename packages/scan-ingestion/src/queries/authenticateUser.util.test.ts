import { hashSecret } from '@lcabrera/server/crypto/hash-secret.util';
import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { authenticateUser } from './authenticateUser.util.ts';

describe('authenticateUser', () => {
  let userId: string;
  let disabledUserId: string;

  beforeAll(async () => {
    const pool = getPool();
    const created = await pool.query<{ id: string }>(
      `INSERT INTO cqms.users (username, display_name, password_hash)
       VALUES ($1, $2, $3) RETURNING id`,
      [
        'auth-test-user',
        'Auth Test User',
        hashSecret({ secret: 'test-password-1' }),
      ],
    );
    userId = created.rows[0]?.id ?? '';

    const disabled = await pool.query<{ id: string }>(
      `INSERT INTO cqms.users (username, display_name, password_hash, enabled)
       VALUES ($1, $2, $3, false) RETURNING id`,
      [
        'auth-test-disabled',
        'Auth Test Disabled',
        hashSecret({ secret: 'test-password-2' }),
      ],
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

  it('returns the user for valid credentials, without the hash', async () => {
    const result = await authenticateUser({
      password: 'test-password-1',
      username: 'auth-test-user',
    });

    expect(result).toEqual({
      displayName: 'Auth Test User',
      userId,
      username: 'auth-test-user',
    });
  });

  it('returns undefined for a wrong password', async () => {
    const result = await authenticateUser({
      password: 'wrong',
      username: 'auth-test-user',
    });

    expect(result).toBeUndefined();
  });

  it('returns undefined for an unknown username', async () => {
    const result = await authenticateUser({
      password: 'anything',
      username: 'no-such-user',
    });

    expect(result).toBeUndefined();
  });

  it('returns undefined for a disabled user even with the right password', async () => {
    const result = await authenticateUser({
      password: 'test-password-2',
      username: 'auth-test-disabled',
    });

    expect(result).toBeUndefined();
  });

  it('cannot log in as the seeded system user (sentinel hash)', async () => {
    const result = await authenticateUser({
      password: '!no-login!',
      username: 'system',
    });

    expect(result).toBeUndefined();
  });
});
