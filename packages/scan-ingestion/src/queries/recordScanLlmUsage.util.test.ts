import { closePool, getPool } from '@repo/server/db/get-pool.util';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { acquireAdvisoryTestLock } from '../testing/acquireAdvisoryTestLock.util.ts';
import { makeTempDirectory } from '../testing/makeTempDirectory.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { recordScanLlmUsage } from './recordScanLlmUsage.util.ts';
import { triggerScan } from './triggerScan.util.ts';

describe('recordScanLlmUsage', () => {
  let projectDir: string;
  let projectId: string;
  let releaseLock: () => Promise<void>;
  let runId: string;
  let scanId: string;
  let systemUserId: string;

  beforeAll(async () => {
    // Inserts rows into the shared, org-wide llm_usage.scan_llm_usage
    // table — other test files' aggregate assertions (getTrailingLlmCostUsd
    // et al.) would be polluted by these rows if this file ran
    // concurrently with them, same lock name across all of them.
    const lock = await acquireAdvisoryTestLock({
      lockName: 'cqms-llm-usage-tests',
    });
    releaseLock = lock.release;

    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-record-llm-usage-');

    const pool = getPool();
    const projectResult = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'record-llm-usage-test-project'],
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
      triggeredBy: 'record-llm-usage-test',
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

  it('persists a succeeded row with cost/turns and resolves triggered_by from cqms.runs', async () => {
    await recordScanLlmUsage({
      numTurns: 12,
      outcome: 'succeeded',
      projectId,
      runId,
      scanId,
      scannerId: 'code-smell-checker',
      totalCostUsd: 1.234567,
      userId: systemUserId,
    });

    const pool = getPool();
    const result = await pool.query(
      `SELECT outcome, total_cost_usd, num_turns, error_message, triggered_by
       FROM llm_usage.scan_llm_usage WHERE scan_id = $1 AND outcome = 'succeeded'`,
      [scanId],
    );

    expect(result.rows[0]).toMatchObject({
      num_turns: 12,
      outcome: 'succeeded',
      total_cost_usd: '1.234567',
      triggered_by: 'record-llm-usage-test',
    });
    expect(result.rows[0]?.error_message).toBeNull();
  });

  it('persists a capped row with no cost/turns and the skip reason as the error message', async () => {
    await recordScanLlmUsage({
      errorMessage: 'Org-wide 24h LLM spend is at/over the cap.',
      outcome: 'capped',
      projectId,
      runId,
      scanId,
      scannerId: 'code-smell-checker',
      userId: systemUserId,
    });

    const pool = getPool();
    const result = await pool.query(
      `SELECT outcome, total_cost_usd, num_turns, error_message
       FROM llm_usage.scan_llm_usage WHERE scan_id = $1 AND outcome = 'capped'`,
      [scanId],
    );

    expect(result.rows[0]).toMatchObject({
      error_message: 'Org-wide 24h LLM spend is at/over the cap.',
      outcome: 'capped',
    });
    expect(result.rows[0]?.num_turns).toBeNull();
    expect(result.rows[0]?.total_cost_usd).toBeNull();
  });

  it('rejects an unknown user id', async () => {
    await expect(
      recordScanLlmUsage({
        outcome: 'succeeded',
        projectId,
        runId,
        scanId,
        scannerId: 'code-smell-checker',
        totalCostUsd: 1,
        userId: randomUUID(),
      }),
    ).rejects.toThrow();
  });
});
