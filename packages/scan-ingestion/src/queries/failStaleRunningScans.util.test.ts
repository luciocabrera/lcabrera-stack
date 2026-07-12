import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { acquireAdvisoryTestLock } from '@repo/scan-ingestion/testing/acquireAdvisoryTestLock.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { claimQueuedScan } from './claimQueuedScan.util.ts';
import { failStaleRunningScans } from './failStaleRunningScans.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { triggerScan } from './triggerScan.util.ts';

describe('failStaleRunningScans (ADR-026, real DB)', () => {
  let projectDir: string;
  let projectId: string;
  let releaseLock: () => Promise<void>;
  let systemUserId: string;

  beforeAll(async () => {
    // The sweep fails EVERY 'running' scan in the database — serialize
    // against the claimQueuedScan file, which briefly holds one (vitest
    // runs files in parallel workers).
    const lock = await acquireAdvisoryTestLock({
      lockName: 'cqms-scan-status-tests',
    });
    releaseLock = lock.release;

    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-stale-scan-');

    const pool = getPool();
    const result = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'stale-scan-test-project'],
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

  it('fails a crashed-mid-run scan, finalizes its run, and leaves queued siblings alone', async () => {
    // Two scans in one run: claim ONE to 'running' (the crash victim), the
    // other stays 'queued' (the startup drain's job, not reconciliation's).
    const { runId } = await triggerScan({
      projectId,
      scannerIds: ['eslint', 'oxlint'],
      userId: systemUserId,
    });

    const pool = getPool();
    const scanRows = await pool.query<{ id: string; scanner_id: string }>(
      'SELECT id, scanner_id FROM cqms.scans WHERE run_id = $1 ORDER BY scanner_id',
      [runId],
    );
    const eslintScanId =
      scanRows.rows.find((row) => row.scanner_id === 'eslint')?.id ?? '';
    const oxlintScanId =
      scanRows.rows.find((row) => row.scanner_id === 'oxlint')?.id ?? '';

    expect(
      await claimQueuedScan({ scanId: eslintScanId, userId: systemUserId }),
    ).toBe(true);

    const sweptCount = await failStaleRunningScans({ userId: systemUserId });
    expect(sweptCount).toBeGreaterThanOrEqual(1);

    const eslintScan = await pool.query<{
      error_message: null | string;
      status: string;
    }>('SELECT status, error_message FROM cqms.scans WHERE id = $1', [
      eslintScanId,
    ]);
    expect(eslintScan.rows[0]?.status).toBe('failed');
    expect(eslintScan.rows[0]?.error_message).toContain(
      'Orchestrator restarted',
    );

    const oxlintScan = await pool.query<{ status: string }>(
      'SELECT status FROM cqms.scans WHERE id = $1',
      [oxlintScanId],
    );
    expect(oxlintScan.rows[0]?.status).toBe('queued');

    // The run stays 'running' — one scan is still queued, so the sweep's
    // fn_finalize_run_status call must NOT prematurely terminalize it.
    const run = await pool.query<{ status: string }>(
      'SELECT status FROM cqms.runs WHERE id = $1',
      [runId],
    );
    expect(run.rows[0]?.status).toBe('running');
  });

  it('is a no-op sweep when nothing is running', async () => {
    expect(await failStaleRunningScans({ userId: systemUserId })).toBe(0);
  });
});
