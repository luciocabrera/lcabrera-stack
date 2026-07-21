import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { acquireAdvisoryTestLock } from '../testing/acquireAdvisoryTestLock.util.ts';
import { makeTempDirectory } from '../testing/makeTempDirectory.util.ts';
import { getTrailingLlmCostUsd } from './getTrailingLlmCostUsd.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { recordScanLlmUsage } from './recordScanLlmUsage.util.ts';
import { triggerScan } from './triggerScan.util.ts';

describe('getTrailingLlmCostUsd', () => {
  let projectDir: string;
  let projectId: string;
  let releaseLock: () => Promise<void>;
  let runId: string;
  let scanId: string;
  let systemUserId: string;

  beforeAll(async () => {
    // Sums across the WHOLE table (org-wide, not project-scoped) — must be
    // serialized against every other test file inserting into
    // llm_usage.scan_llm_usage, same lock name across all of them.
    const lock = await acquireAdvisoryTestLock({
      lockName: 'cqms-llm-usage-tests',
    });
    releaseLock = lock.release;

    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-trailing-llm-cost-');

    const pool = getPool();
    const projectResult = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'trailing-llm-cost-test-project'],
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

  it('sums only non-capped rows within the trailing 24h, ignoring capped and older rows', async () => {
    const before = await getTrailingLlmCostUsd();

    await recordScanLlmUsage({
      outcome: 'succeeded',
      projectId,
      runId,
      scanId,
      scannerId: 'code-smell-checker',
      totalCostUsd: 5,
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
    await recordScanLlmUsage({
      outcome: 'succeeded',
      projectId,
      runId,
      scanId,
      scannerId: 'code-smell-checker',
      totalCostUsd: 100,
      userId: systemUserId,
    });

    const pool = getPool();
    // Backdate the 100-cost row to 2 days ago so it falls outside the window.
    await pool.query(
      `UPDATE llm_usage.scan_llm_usage SET created_at = now() - interval '2 days'
       WHERE scan_id = $1 AND total_cost_usd = 100`,
      [scanId],
    );

    const after = await getTrailingLlmCostUsd();
    expect(after - before).toBeCloseTo(5, 6);
  });
});
