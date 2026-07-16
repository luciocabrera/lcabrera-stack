import { hashSecret } from '@repo/data-access/crypto/hashSecret.util';
import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getUserById } from './getUserById.util.ts';

describe('getUserById', () => {
  let userId: string;
  let deletedUserId: string;

  beforeAll(async () => {
    const pool = getPool();
    const created = await pool.query<{ id: string }>(
      `INSERT INTO cqms.users (username, display_name, password_hash)
       VALUES ($1, $2, $3) RETURNING id`,
      ['get-user-test', 'Get User Test', hashSecret({ secret: 'irrelevant' })],
    );
    userId = created.rows[0]?.id ?? '';

    const deleted = await pool.query<{ id: string }>(
      `INSERT INTO cqms.users (username, display_name, password_hash, deleted_at)
       VALUES ($1, $2, $3, now()) RETURNING id`,
      [
        'get-user-test-deleted',
        'Get User Test Deleted',
        hashSecret({ secret: 'irrelevant' }),
      ],
    );
    deletedUserId = deleted.rows[0]?.id ?? '';
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.users WHERE id = ANY($1::uuid[])', [
      [userId, deletedUserId],
    ]);
    await closePool();
  });

  it('returns the user via v_users, without a password_hash column', async () => {
    const user = await getUserById({ userId });

    expect(user?.username).toBe('get-user-test');
    expect(user?.display_name).toBe('Get User Test');
    expect(user !== undefined && 'password_hash' in user).toBe(false);
  });

  it('returns undefined for a soft-deleted user', async () => {
    const user = await getUserById({ userId: deletedUserId });

    expect(user).toBeUndefined();
  });

  it('returns undefined for an unknown id', async () => {
    const user = await getUserById({
      userId: '00000000-0000-0000-0000-000000000000',
    });

    expect(user).toBeUndefined();
  });
});
