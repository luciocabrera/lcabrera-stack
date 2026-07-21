import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { acquireAdvisoryTestLock } from '@repo/scan-ingestion/testing/acquireAdvisoryTestLock.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { claimQueuedScan } from './claimQueuedScan.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { triggerScan } from './triggerScan.util.ts';

describe('claimQueuedScan (ADR-026, real DB)', () => {
  let projectDir: string;
  let projectId: string;
  let releaseLock: () => Promise<void>;
  let systemUserId: string;

  beforeAll(async () => {
    // This file briefly holds a scan at 'running'; the
    // failStaleRunningScans file sweeps EVERY running scan — serialize the
    // two files (vitest runs files in parallel workers).
    const lock = await acquireAdvisoryTestLock({
      lockName: 'cqms-scan-status-tests',
    });
    releaseLock = lock.release;

    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-claim-scan-');

    const pool = getPool();
    const result = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'claim-scan-test-project'],
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
    await releaseLock();
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('the first claim wins (running + started_at), every later claim loses', async () => {
    const { runId } = await triggerScan({
      projectId,
      scannerIds: ['eslint'],
      userId: systemUserId,
    });

    const pool = getPool();
    const scanRow = await pool.query<{ id: string }>(
      'SELECT id FROM cqms.scans WHERE run_id = $1',
      [runId],
    );
    const scanId = scanRow.rows[0]?.id ?? '';

    expect(await claimQueuedScan({ scanId, userId: systemUserId })).toBe(true);

    const result = await pool.query<{
      started_at: Date | null;
      status: string;
    }>('SELECT status, started_at FROM cqms.scans WHERE id = $1', [scanId]);
    expect(result.rows[0]?.status).toBe('running');
    expect(result.rows[0]?.started_at).not.toBeNull();

    // A duplicate orchestrator (or overlapping wake) must lose the claim —
    // and must not clobber the winner's started_at.
    expect(await claimQueuedScan({ scanId, userId: systemUserId })).toBe(false);
    const after = await pool.query<{ started_at: Date | null }>(
      'SELECT started_at FROM cqms.scans WHERE id = $1',
      [scanId],
    );
    expect(after.rows[0]?.started_at).toEqual(result.rows[0]?.started_at);
  });
});
