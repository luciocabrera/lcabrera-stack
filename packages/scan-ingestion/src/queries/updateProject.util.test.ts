import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getUserByUsername } from './getUserByUsername.util.ts';
import { updateProject } from './updateProject.util.ts';

describe('updateProject', () => {
  let projectId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    const pool = getPool();
    const result = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'update-test-project'],
    );
    projectId = result.rows[0]?.fn_register_project ?? '';
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
  });

  it('updates the name of an existing project', async () => {
    await updateProject({
      name: 'renamed-project',
      projectId,
      userId: systemUserId,
    });

    const pool = getPool();
    const row = await pool.query<{ name: string }>(
      'SELECT name FROM cqms.projects WHERE id = $1',
      [projectId],
    );

    expect(row.rows[0]?.name).toBe('renamed-project');
  });

  it('rejects an unknown project id', async () => {
    await expect(
      updateProject({
        name: 'nope',
        projectId: '00000000-0000-0000-0000-000000000000',
        userId: systemUserId,
      }),
    ).rejects.toThrow(/not found/);
  });
});
