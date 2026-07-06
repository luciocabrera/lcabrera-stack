import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getQueuedScans } from './getQueuedScans.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { triggerScan } from './triggerScan.util.ts';

describe('getQueuedScans', () => {
  let projectDir: string;
  let projectId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-queued-');

    const pool = getPool();
    const result = await pool.query<{ fn_upsert_project: string }>(
      'SELECT cqms.fn_upsert_project($1, $2, $3) AS fn_upsert_project',
      [systemUserId, 'get-queued-scans-test-project', projectDir],
    );
    projectId = result.rows[0]?.fn_upsert_project ?? '';
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('lists a real queued scan joined to its scanner and project shape', async () => {
    const { runId } = await triggerScan({
      projectId,
      scannerIds: ['eslint'],
      scopeValue: '.',
      userId: systemUserId,
    });

    const rows = await getQueuedScans();
    const row = rows.find((candidate) => candidate.run_id === runId);

    expect(row).toBeDefined();
    expect(row?.scanner_id).toBe('eslint');
    expect(row?.deterministic).toBe(true);
    expect(row?.skill_path).toBe('.github/skills/linter-checker');
    expect(row?.local_path).toBe(projectDir);
    expect(row?.scope_value).toBe('.');
  });

  it('does not list a scan once it is no longer queued', async () => {
    const { runId } = await triggerScan({
      projectId,
      scannerIds: ['code-smell-zen'],
      scopeValue: '.',
      userId: systemUserId,
    });

    const pool = getPool();
    await pool.query(
      `UPDATE cqms.scans SET status = 'running' WHERE run_id = $1`,
      [runId],
    );

    const rows = await getQueuedScans();
    expect(rows.some((candidate) => candidate.run_id === runId)).toBe(false);
  });
});
