import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getScanLintRuleSummary } from './getScanLintRuleSummary.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { triggerScan } from './triggerScan.util.ts';

describe('getScanLintRuleSummary', () => {
  let projectDir: string;
  let projectId: string;
  let scanId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-lint-summary-');

    const pool = getPool();
    const projectResult = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'lint-summary-test-project'],
    );
    projectId = projectResult.rows[0]?.fn_register_project ?? '';

    // Triggering requires a synced snapshot (0027) — record one
    // pointing at the temp dir.
    await pool.query(
      'SELECT * FROM cqms.fn_set_project_snapshot($1, $2, $3, $4, $5, $6, $7)',
      [systemUserId, projectId, projectDir, 'test.zip', 42, 1, 'test'],
    );

    const { runId } = await triggerScan({
      projectId,
      scannerIds: ['eslint'],
      userId: systemUserId,
    });
    const scanRow = await pool.query<{ id: string }>(
      'SELECT id FROM cqms.v_scans WHERE run_id = $1',
      [runId],
    );
    scanId = scanRow.rows[0]?.id ?? '';

    // Real procedure call — the same path ingestScanDetail takes.
    await pool.query('CALL cqms.sp_ingest_eslint_detail($1, $2, $3, $4)', [
      systemUserId,
      scanId,
      JSON.stringify({
        error_count: 2,
        fatal_error_count: 0,
        files_linted: 2,
        fixable_error_count: 1,
        fixable_warning_count: 0,
        rules_violated_count: 2,
        suppressed_count: 1,
        warning_count: 0,
      }),
      JSON.stringify([
        {
          file_path: 'src/a.ts',
          fixable: true,
          line: 1,
          message: 'm1',
          rule_id: 'rule-a',
          severity: 'HIGH',
          severity_raw: '2',
          source: 'eslint',
          suppressed: false,
        },
        {
          file_path: 'src/b.ts',
          fixable: false,
          line: 2,
          message: 'm2',
          rule_id: 'rule-a',
          severity: 'HIGH',
          severity_raw: '2',
          source: 'eslint',
          suppressed: false,
        },
        {
          file_path: 'src/c.ts',
          fixable: false,
          line: 3,
          message: 'm3',
          rule_id: 'rule-b',
          severity: 'MEDIUM',
          severity_raw: '1',
          source: 'eslint',
          suppressed: true,
          suppression_justification: 'baselined',
          suppression_kind: 'file',
        },
      ]),
    ]);
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('rolls violations up per rule, splitting active from suppressed', async () => {
    const summary = await getScanLintRuleSummary({ scanId });

    expect(summary).toEqual([
      {
        active_count: 2,
        rule_id: 'rule-a',
        source: 'eslint',
        suppressed_count: 0,
      },
      {
        active_count: 0,
        rule_id: 'rule-b',
        source: 'eslint',
        suppressed_count: 1,
      },
    ]);
  });

  it('populated the eslint_runs master 1:1 with the scan', async () => {
    const pool = getPool();
    const master = await pool.query<{
      files_linted: number;
      suppressed_count: number;
    }>(
      'SELECT files_linted, suppressed_count FROM cqms.v_eslint_runs WHERE scan_id = $1',
      [scanId],
    );

    expect(master.rows).toHaveLength(1);
    expect(master.rows[0]).toEqual({ files_linted: 2, suppressed_count: 1 });
  });

  it('re-ingestion is idempotent (DELETE-then-INSERT)', async () => {
    const pool = getPool();
    await pool.query('CALL cqms.sp_ingest_eslint_detail($1, $2, $3, $4)', [
      systemUserId,
      scanId,
      JSON.stringify({
        error_count: 0,
        fatal_error_count: 0,
        files_linted: 1,
        fixable_error_count: 0,
        fixable_warning_count: 0,
        rules_violated_count: 1,
        suppressed_count: 0,
        warning_count: 1,
      }),
      JSON.stringify([
        {
          file_path: 'src/only.ts',
          fixable: false,
          message: 'm',
          rule_id: 'rule-c',
          severity: 'MEDIUM',
          severity_raw: '1',
          source: 'eslint',
          suppressed: false,
        },
      ]),
    ]);

    const summary = await getScanLintRuleSummary({ scanId });
    expect(summary).toEqual([
      {
        active_count: 1,
        rule_id: 'rule-c',
        source: 'eslint',
        suppressed_count: 0,
      },
    ]);
  });
});
