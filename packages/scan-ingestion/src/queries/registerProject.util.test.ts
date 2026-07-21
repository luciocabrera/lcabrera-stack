import { closePool, getPool } from '@repo/server/db/get-pool.util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getUserByUsername } from './getUserByUsername.util.ts';
import { registerProject } from './registerProject.util.ts';

describe('registerProject', () => {
  const createdProjectIds: string[] = [];
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';
  });

  afterAll(async () => {
    const pool = getPool();
    for (const projectId of createdProjectIds) {
      await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    }
    await closePool();
  });

  it('registers a project as an identity row (no path, no snapshot yet)', async () => {
    const result = await registerProject({
      name: 'register-test-project',
      userId: systemUserId,
    });
    createdProjectIds.push(result.projectId);

    expect(result.projectId).toBeTruthy();

    const pool = getPool();
    const row = await pool.query<{
      latest_snapshot_id: null | string;
      name: string;
    }>('SELECT name, latest_snapshot_id FROM cqms.projects WHERE id = $1', [
      result.projectId,
    ]);

    expect(row.rows[0]?.name).toBe('register-test-project');
    expect(row.rows[0]?.latest_snapshot_id).toBeNull();
  });

  it('creates distinct projects on repeated registration (no path-upsert semantics — ADR-028)', async () => {
    const first = await registerProject({
      name: 'twice-registered',
      userId: systemUserId,
    });
    const second = await registerProject({
      name: 'twice-registered',
      userId: systemUserId,
    });
    createdProjectIds.push(first.projectId, second.projectId);

    expect(second.projectId).not.toBe(first.projectId);
  });
});
