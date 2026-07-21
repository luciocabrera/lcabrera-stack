import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { closePool, getPool } from '@repo/server/db/get-pool.util';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getQueuedScans } from './getQueuedScans.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { triggerScan } from './triggerScan.util.ts';

describe('getQueuedScans', () => {
  let snapshotDir: string;
  let projectId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    snapshotDir = makeTempDirectory('scan-ingestion-queued-');

    const pool = getPool();
    const result = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'get-queued-scans-test-project'],
    );
    projectId = result.rows[0]?.fn_register_project ?? '';

    // Triggering requires a synced snapshot (0027) and v_queued_scans
    // inner-joins it — record one pointing at a real temp dir.
    await pool.query(
      'SELECT * FROM cqms.fn_set_project_snapshot($1, $2, $3, $4, $5, $6, $7)',
      [systemUserId, projectId, snapshotDir, 'test.zip', 42, 1, 'test'],
    );
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
    rmSync(snapshotDir, { force: true, recursive: true });
  });

  it('lists a real queued scan joined to its scanner shape and snapshot path', async () => {
    const { runId } = await triggerScan({
      projectId,
      scannerIds: ['eslint'],
      userId: systemUserId,
    });

    const rows = await getQueuedScans();
    const row = rows.find((candidate) => candidate.run_id === runId);

    expect(row).toBeDefined();
    expect(row?.scanner_id).toBe('eslint');
    expect(row?.deterministic).toBe(true);
    expect(row?.skill_path).toBe('.github/skills/linter-checker');
    expect(row?.snapshot_path).toBe(snapshotDir);
    expect(row?.scope_value).toBe('.');

    // Finalize this run so it no longer counts as "active" — the next
    // test triggers another scan for the same shared project, and the
    // concurrency guardrail (migration 0021) now rejects a second run
    // while one is still queued/running for the same project.
    const pool = getPool();
    await pool.query(
      `UPDATE cqms.scans SET status = 'succeeded' WHERE run_id = $1`,
      [runId],
    );
    await pool.query('SELECT cqms.fn_finalize_run_status($1)', [runId]);
  });

  it('does not list a scan once it is no longer queued', async () => {
    const { runId } = await triggerScan({
      projectId,
      scannerIds: ['code-smell-zen'],
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
