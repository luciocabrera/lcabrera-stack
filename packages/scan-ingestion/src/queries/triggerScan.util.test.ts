import { closePool, getPool } from '@repo/data-access/db/getPool.util';
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
    const result = await pool.query<{ fn_upsert_project: string }>(
      'SELECT cqms.fn_upsert_project($1, $2, $3) AS fn_upsert_project',
      [systemUserId, 'trigger-scan-test-project', projectDir],
    );
    projectId = result.rows[0]?.fn_upsert_project ?? '';
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
      scannerIds: ['linter', 'code-smell-checker'],
      scopeValue: '.',
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
      'linter',
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
      'linter',
    ]);
    expect(scanRows.rows.every((row) => row.status === 'queued')).toBe(true);
    expect(scanRows.rows.every((row) => row.scope_value === '.')).toBe(true);
  });
});
