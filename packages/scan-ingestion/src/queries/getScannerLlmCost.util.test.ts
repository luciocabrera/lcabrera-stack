import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { acquireAdvisoryTestLock } from '../testing/acquireAdvisoryTestLock.util.ts';
import { makeTempDirectory } from '../testing/makeTempDirectory.util.ts';
import { getScannerLlmCost } from './getScannerLlmCost.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { recordScanLlmUsage } from './recordScanLlmUsage.util.ts';
import { triggerScan } from './triggerScan.util.ts';

describe('getScannerLlmCost', () => {
  let projectDir: string;
  let projectId: string;
  let releaseLock: () => Promise<void>;
  let runId: string;
  let scanId: string;
  let systemUserId: string;

  beforeAll(async () => {
    // Grouped by scanner_id, org-wide — must serialize against every other
    // test file that records against the same 'code-smell-checker' scanner.
    const lock = await acquireAdvisoryTestLock({
      lockName: 'cqms-llm-usage-tests',
    });
    releaseLock = lock.release;

    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-scanner-llm-cost-');

    const pool = getPool();
    const projectResult = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'scanner-llm-cost-test-project'],
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

  it('increases the scanner row call/capped counts and cost by exactly what was recorded', async () => {
    const findScanner = (rows: Awaited<ReturnType<typeof getScannerLlmCost>>) =>
      rows.find((row) => row.scanner_id === 'code-smell-checker');

    const before = findScanner(await getScannerLlmCost());
    const beforeCallCount = before?.call_count ?? 0;
    const beforeCappedCount = before?.capped_count ?? 0;
    const beforeCost = before?.total_cost_usd ?? 0;

    await recordScanLlmUsage({
      outcome: 'succeeded',
      projectId,
      runId,
      scanId,
      scannerId: 'code-smell-checker',
      totalCostUsd: 3.5,
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

    const after = findScanner(await getScannerLlmCost());
    expect(after).toBeDefined();
    expect(after?.display_name).toBe('Code Smell Checker');
    expect((after?.call_count ?? 0) - beforeCallCount).toBe(1);
    expect((after?.capped_count ?? 0) - beforeCappedCount).toBe(1);
    expect((after?.total_cost_usd ?? 0) - beforeCost).toBeCloseTo(3.5, 6);
  });
});
