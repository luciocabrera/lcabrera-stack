import { closePool, getPool } from '@repo/server/db/get-pool.util';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { acquireAdvisoryTestLock } from '../testing/acquireAdvisoryTestLock.util.ts';
import { makeTempDirectory } from '../testing/makeTempDirectory.util.ts';
import { getProjectLlmCost } from './getProjectLlmCost.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { recordScanLlmUsage } from './recordScanLlmUsage.util.ts';
import { triggerScan } from './triggerScan.util.ts';

describe('getProjectLlmCost', () => {
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

    projectDir = makeTempDirectory('scan-ingestion-project-llm-cost-');

    const pool = getPool();
    const projectResult = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'project-llm-cost-test-project'],
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
      scannerIds: ['code-smell-checker'],
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

  it('reports call/capped counts and cost for this specific project only', async () => {
    await recordScanLlmUsage({
      outcome: 'succeeded',
      projectId,
      runId,
      scanId,
      scannerId: 'code-smell-checker',
      totalCostUsd: 4.25,
      userId: systemUserId,
    });
    await recordScanLlmUsage({
      errorMessage: 'capped',
      outcome: 'capped',
      projectId,
      runId,
      scanId,
      scannerId: 'code-smell-checker',
      userId: systemUserId,
    });

    const rows = await getProjectLlmCost();
    const row = rows.find((candidate) => candidate.project_id === projectId);

    expect(row).toMatchObject({
      call_count: 1,
      capped_count: 1,
      project_name: 'project-llm-cost-test-project',
    });
    expect(row?.total_cost_usd).toBeCloseTo(4.25, 6);
  });
});
