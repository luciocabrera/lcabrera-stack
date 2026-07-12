import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { acquireAdvisoryTestLock } from '@repo/scan-ingestion/testing/acquireAdvisoryTestLock.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { claimQueuedScan } from './claimQueuedScan.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { markScanFailed } from './markScanFailed.util.ts';
import { triggerScan } from './triggerScan.util.ts';

describe('markScanFailed', () => {
  let projectDir: string;
  let projectId: string;
  let releaseLock: () => Promise<void>;
  let systemUserId: string;

  beforeAll(async () => {
    // This file briefly holds a scan at 'running'; the
    // failStaleRunningScans file sweeps EVERY running scan — serialize the
    // files (vitest runs files in parallel workers).
    const lock = await acquireAdvisoryTestLock({
      lockName: 'cqms-scan-status-tests',
    });
    releaseLock = lock.release;

    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-mark-failed-');

    const pool = getPool();
    const result = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'mark-scan-failed-test-project'],
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

  it('marks a real scan failed, records the error, and finalizes the run as failed', async () => {
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

    await claimQueuedScan({ scanId, userId: systemUserId });
    await markScanFailed({
      errorMessage: 'eslint failed to run: something broke',
      runId,
      scanId,
      userId: systemUserId,
    });

    const scanResult = await pool.query<{
      duration_ms: null | number;
      error_message: null | string;
      finished_at: Date | null;
      status: string;
    }>(
      'SELECT status, error_message, finished_at, duration_ms FROM cqms.scans WHERE id = $1',
      [scanId],
    );
    expect(scanResult.rows[0]?.status).toBe('failed');
    expect(scanResult.rows[0]?.error_message).toBe(
      'eslint failed to run: something broke',
    );
    expect(scanResult.rows[0]?.finished_at).not.toBeNull();
    expect(scanResult.rows[0]?.duration_ms).not.toBeNull();

    const runResult = await pool.query<{ status: string }>(
      'SELECT status FROM cqms.runs WHERE id = $1',
      [runId],
    );
    expect(runResult.rows[0]?.status).toBe('failed');
  });
});
