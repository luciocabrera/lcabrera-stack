import { closePool, getPool } from '@repo/server/db/get-pool.util';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { acquireAdvisoryTestLock } from '../testing/acquireAdvisoryTestLock.util.ts';
import { makeTempDirectory } from '../testing/makeTempDirectory.util.ts';
import { getCappedLlmUsageAttempts } from './getCappedLlmUsageAttempts.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { recordScanLlmUsage } from './recordScanLlmUsage.util.ts';
import { triggerScan } from './triggerScan.util.ts';

describe('getCappedLlmUsageAttempts', () => {
  let projectDir: string;
  let projectId: string;
  let releaseLock: () => Promise<void>;
  let runId: string;
  let scanId: string;
  let systemUserId: string;

  beforeAll(async () => {
    // Org-wide view, shared with the other llm_usage query tests — same
    // lock name so none of them run concurrently against the shared table.
    const lock = await acquireAdvisoryTestLock({
      lockName: 'cqms-llm-usage-tests',
    });
    releaseLock = lock.release;

    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-capped-llm-attempts-');

    const pool = getPool();
    const projectResult = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'capped-llm-attempts-test-project'],
    );
    projectId = projectResult.rows[0]?.fn_register_project ?? '';

    // Triggering requires a synced snapshot (0027) — record one
    // pointing at the temp dir.
    await pool.query(
      'SELECT * FROM cqms.fn_set_project_snapshot($1, $2, $3, $4, $5, $6, $7)',
      [systemUserId, projectId, projectDir, 'test.zip', 42, 1, 'test'],
    );

    const triggered = await triggerScan({
      projectId,
      scannerIds: ['code-smell-zen'],
      triggeredBy: 'capped-attempts-test',
      userId: systemUserId,
    });
    runId = triggered.runId;

    const scanRow = await pool.query<{ id: string }>(
      'SELECT id FROM cqms.scans WHERE run_id = $1',
      [runId],
    );
    scanId = scanRow.rows[0]?.id ?? '';
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await releaseLock();
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('lists a capped attempt with its project/scanner context and skip reason, but omits succeeded rows', async () => {
    await recordScanLlmUsage({
      outcome: 'succeeded',
      projectId,
      runId,
      scanId,
      scannerId: 'code-smell-zen',
      totalCostUsd: 1,
      userId: systemUserId,
    });
    await recordScanLlmUsage({
      errorMessage: 'Org-wide 24h LLM spend is at/over the cap.',
      outcome: 'capped',
      projectId,
      runId,
      scanId,
      scannerId: 'code-smell-zen',
      userId: systemUserId,
    });

    const rows = await getCappedLlmUsageAttempts({ limit: 500 });
    const matching = rows.filter((row) => row.project_id === projectId);

    expect(matching).toHaveLength(1);
    expect(matching[0]).toMatchObject({
      error_message: 'Org-wide 24h LLM spend is at/over the cap.',
      project_name: 'capped-llm-attempts-test-project',
      scanner_display_name: 'Code Smell Zen',
      scanner_id: 'code-smell-zen',
      triggered_by: 'capped-attempts-test',
    });
  });
});
