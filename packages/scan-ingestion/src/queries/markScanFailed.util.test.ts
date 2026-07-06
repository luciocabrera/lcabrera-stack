import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getUserByUsername } from './getUserByUsername.util.ts';
import { markScanFailed } from './markScanFailed.util.ts';
import { markScanRunning } from './markScanRunning.util.ts';
import { triggerScan } from './triggerScan.util.ts';

describe('markScanFailed', () => {
  let projectDir: string;
  let projectId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-mark-failed-');

    const pool = getPool();
    const result = await pool.query<{ fn_upsert_project: string }>(
      'SELECT cqms.fn_upsert_project($1, $2, $3) AS fn_upsert_project',
      [systemUserId, 'mark-scan-failed-test-project', projectDir],
    );
    projectId = result.rows[0]?.fn_upsert_project ?? '';
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('marks a real scan failed, records the error, and finalizes the run as failed', async () => {
    const { runId } = await triggerScan({
      projectId,
      scannerIds: ['eslint'],
      scopeValue: '.',
      userId: systemUserId,
    });

    const pool = getPool();
    const scanRow = await pool.query<{ id: string }>(
      'SELECT id FROM cqms.scans WHERE run_id = $1',
      [runId],
    );
    const scanId = scanRow.rows[0]?.id ?? '';

    await markScanRunning({ scanId, userId: systemUserId });
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
