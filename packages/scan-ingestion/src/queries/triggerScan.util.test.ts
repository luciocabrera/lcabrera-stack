import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getUserByUsername } from './getUserByUsername.util.ts';
import { triggerScan } from './triggerScan.util.ts';

describe('triggerScan', () => {
  let projectDir: string;
  let projectId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-trigger-');

    const pool = getPool();
    const result = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'trigger-scan-test-project'],
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
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('creates a run with one queued scan per requested scanner', async () => {
    const result = await triggerScan({
      projectId,
      scannerIds: ['eslint', 'code-smell-checker'],
      userId: systemUserId,
    });

    expect(result.runId).toBeTruthy();

    const pool = getPool();
    const runRow = await pool.query<{
      requested_scanners: readonly string[];
      status: string;
    }>('SELECT status, requested_scanners FROM cqms.runs WHERE id = $1', [
      result.runId,
    ]);
    expect(runRow.rows[0]?.status).toBe('running');
    expect(runRow.rows[0]?.requested_scanners).toEqual([
      'eslint',
      'code-smell-checker',
    ]);

    const scanRows = await pool.query<{
      scanner_id: string;
      scope_value: string;
      status: string;
    }>(
      'SELECT scanner_id, status, scope_value FROM cqms.scans WHERE run_id = $1 ORDER BY scanner_id',
      [result.runId],
    );
    expect(scanRows.rows).toHaveLength(2);
    expect(scanRows.rows.map((row) => row.scanner_id)).toEqual([
      'code-smell-checker',
      'eslint',
    ]);
    expect(scanRows.rows.every((row) => row.status === 'queued')).toBe(true);
    expect(scanRows.rows.every((row) => row.scope_value === '.')).toBe(true);

    // Finalize this run so it no longer counts as "active" — the next
    // test triggers another scan for the same shared project, and the
    // concurrency guardrail (migration 0021) now rejects a second run
    // while one is still queued/running for the same project.
    await pool.query(
      `UPDATE cqms.scans SET status = 'succeeded' WHERE run_id = $1`,
      [result.runId],
    );
    await pool.query('SELECT cqms.fn_finalize_run_status($1)', [result.runId]);
  });

  it('fans out scanners × workspace scopes as folder-scoped scans (ADR-021)', async () => {
    const result = await triggerScan({
      projectId,
      scannerIds: ['eslint', 'oxlint'],
      userId: systemUserId,
      workspacePaths: ['apps/web', 'packages/ui'],
    });

    const pool = getPool();
    const scanRows = await pool.query<{
      scanner_id: string;
      scope_type: string;
      scope_value: string;
    }>(
      'SELECT scanner_id, scope_type, scope_value FROM cqms.scans WHERE run_id = $1 ORDER BY scanner_id, scope_value',
      [result.runId],
    );

    expect(
      scanRows.rows.map(
        (row) => `${row.scanner_id}:${row.scope_type}:${row.scope_value}`,
      ),
    ).toEqual([
      'eslint:folder:apps/web',
      'eslint:folder:packages/ui',
      'oxlint:folder:apps/web',
      'oxlint:folder:packages/ui',
    ]);
  });

  it('rejects a new run while one is already active for the project, then succeeds once it is finalized (concurrency guardrail)', async () => {
    // The previous test's run is still 'running' (never finalized) — a
    // real second submission for the same project must be rejected here.
    await expect(
      triggerScan({
        projectId,
        scannerIds: ['eslint'],
        userId: systemUserId,
      }),
    ).rejects.toThrow(
      'A scan is already running for this project. Wait for it to finish before starting another.',
    );

    const pool = getPool();
    const activeRun = await pool.query<{ id: string }>(
      `SELECT id FROM cqms.runs WHERE project_id = $1 AND status = 'running'`,
      [projectId],
    );
    const activeRunId = activeRun.rows[0]?.id ?? '';
    await pool.query(
      `UPDATE cqms.scans SET status = 'succeeded' WHERE run_id = $1`,
      [activeRunId],
    );
    await pool.query('SELECT cqms.fn_finalize_run_status($1)', [activeRunId]);

    const result = await triggerScan({
      projectId,
      scannerIds: ['eslint'],
      userId: systemUserId,
    });
    expect(result.runId).toBeTruthy();

    // Leave this run active too — nothing later in this file depends on
    // it, and the shared project is deleted wholesale in afterAll.
  });
});
