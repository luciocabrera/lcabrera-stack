import { closePool, getPool } from '@repo/server/db/get-pool.util';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { makeTempDirectory } from '../testing/makeTempDirectory.util.ts';
import { getProjectHasActiveRun } from './getProjectHasActiveRun.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { triggerScan } from './triggerScan.util.ts';

describe('getProjectHasActiveRun', () => {
  let projectDir: string;
  let projectId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-has-active-run-');

    const pool = getPool();
    const result = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'has-active-run-test-project'],
    );
    projectId = result.rows[0]?.fn_register_project ?? '';

    // Triggering requires a synced snapshot (0027) — record one
    // pointing at the temp dir.
    await pool.query(
      'SELECT * FROM cqms.fn_set_project_snapshot($1, $2, $3, $4, $5, $6, $7)',
      [systemUserId, projectId, projectDir, 'test.zip', 42, 1, 'test'],
    );
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('is false for a project with no runs', async () => {
    expect(await getProjectHasActiveRun({ projectId })).toBe(false);
  });

  it('is true immediately after triggering a scan, and false again once it is finalized', async () => {
    const { runId } = await triggerScan({
      projectId,
      scannerIds: ['eslint'],
      userId: systemUserId,
    });

    expect(await getProjectHasActiveRun({ projectId })).toBe(true);

    const pool = getPool();
    await pool.query(
      `UPDATE cqms.scans SET status = 'succeeded' WHERE run_id = $1`,
      [runId],
    );
    await pool.query('SELECT cqms.fn_finalize_run_status($1)', [runId]);

    expect(await getProjectHasActiveRun({ projectId })).toBe(false);
  });
});
