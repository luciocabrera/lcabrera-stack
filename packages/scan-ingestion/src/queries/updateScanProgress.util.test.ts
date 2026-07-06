import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getUserByUsername } from './getUserByUsername.util.ts';
import { triggerScan } from './triggerScan.util.ts';
import { updateScanProgress } from './updateScanProgress.util.ts';

describe('updateScanProgress', () => {
  let projectDir: string;
  let projectId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-progress-');

    const pool = getPool();
    const result = await pool.query<{ fn_upsert_project: string }>(
      'SELECT cqms.fn_upsert_project($1, $2, $3) AS fn_upsert_project',
      [systemUserId, 'update-scan-progress-test-project', projectDir],
    );
    projectId = result.rows[0]?.fn_upsert_project ?? '';
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('writes a real progress message onto the scan row', async () => {
    const { runId } = await triggerScan({
      projectId,
      scannerIds: ['fallow'],
      scopeValue: '.',
      userId: systemUserId,
    });

    const pool = getPool();
    const scanRow = await pool.query<{ id: string }>(
      'SELECT id FROM cqms.scans WHERE run_id = $1',
      [runId],
    );
    const scanId = scanRow.rows[0]?.id ?? '';

    await updateScanProgress({
      progressMessage: 'assistant:message',
      scanId,
      userId: systemUserId,
    });

    const result = await pool.query<{ progress_message: null | string }>(
      'SELECT progress_message FROM cqms.scans WHERE id = $1',
      [scanId],
    );
    expect(result.rows[0]?.progress_message).toBe('assistant:message');
  });
});
