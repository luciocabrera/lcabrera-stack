import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { markScanRunning } from './markScanRunning.util.ts';
import { triggerScan } from './triggerScan.util.ts';

describe('markScanRunning', () => {
  let projectDir: string;
  let projectId: string;

  beforeAll(async () => {
    projectDir = makeTempDirectory('scan-ingestion-mark-running-');

    const pool = getPool();
    const result = await pool.query<{ fn_upsert_project: string }>(
      'SELECT cqms.fn_upsert_project($1, $2) AS fn_upsert_project',
      ['mark-scan-running-test-project', projectDir],
    );
    projectId = result.rows[0]?.fn_upsert_project ?? '';
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('transitions a real queued scan to running and sets started_at', async () => {
    const { runId } = await triggerScan({
      projectId,
      scannerIds: ['linter'],
      scopeValue: '.',
    });

    const pool = getPool();
    const scanRow = await pool.query<{ id: string }>(
      'SELECT id FROM cqms.scans WHERE run_id = $1',
      [runId],
    );
    const scanId = scanRow.rows[0]?.id ?? '';

    await markScanRunning({ scanId });

    const result = await pool.query<{
      started_at: Date | null;
      status: string;
    }>('SELECT status, started_at FROM cqms.scans WHERE id = $1', [scanId]);

    expect(result.rows[0]?.status).toBe('running');
    expect(result.rows[0]?.started_at).not.toBeNull();
  });
});
