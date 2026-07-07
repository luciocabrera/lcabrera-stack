import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getScanFallowSummary } from './getScanFallowSummary.util.ts';
import { getUserByUsername } from './getUserByUsername.util.ts';
import { triggerScan } from './triggerScan.util.ts';

const masterFixture = {
  average_maintainability: 93.2,
  check_total_issues: 3,
  clone_group_count: 1,
  clone_instance_count: 2,
  fallow_version: '3.0.0',
  files_analyzed: 10,
  files_scored: 2,
  functions_above_threshold: 1,
  functions_analyzed: 40,
  raw_kind: 'combined',
  severity_critical_count: 1,
  severity_high_count: 0,
  severity_moderate_count: 0,
  unit_size_profile: { low_risk: 73.2 },
};

const detailFixture = {
  circular_dependencies: [
    {
      cycle_length: 2,
      entry_file_path: 'src/A.tsx',
      files: ['src/A.tsx', 'src/B.tsx'],
    },
  ],
  clone_groups: [
    {
      fingerprint: 'fp-1',
      instances: [
        { end_line: 19, file_path: 'src/a.ts', start_line: 7 },
        { end_line: 18, file_path: 'src/b.ts', start_line: 7 },
      ],
      line_count: 13,
      suggested_name: 'sharedHelper',
      token_count: 120,
    },
  ],
  dead_code: [
    { category: 'unused_file', file_path: 'src/old.ts' },
    {
      category: 'unused_dependency',
      dependency_location: 'dependencies',
      package_name: 'left-pad',
    },
  ],
  file_scores: [
    {
      fan_in: 2,
      fan_out: 5,
      file_path: 'src/a.ts',
      maintainability_index: 94.3,
    },
    { fan_in: 0, fan_out: 0, file_path: 'src/b.ts' },
  ],
  function_findings: [
    {
      crap: 702,
      exceeded: 'all',
      file_path: 'src/a.ts',
      function_name: 'bigOne',
      severity: 'critical',
    },
  ],
  hotspots: [{ commits: 12, file_path: 'src/a.ts', score: 66 }],
  large_functions: [
    { file_path: 'src/a.ts', function_name: '<arrow>', line_count: 303 },
  ],
  targets: [
    {
      category: 'break_circular_dependency',
      file_path: 'src/A.tsx',
      priority: 27.6,
    },
  ],
};

describe('getScanFallowSummary', () => {
  let projectDir: string;
  let projectId: string;
  let scanId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    projectDir = makeTempDirectory('scan-ingestion-fallow-summary-');

    const pool = getPool();
    const projectResult = await pool.query<{ fn_upsert_project: string }>(
      'SELECT cqms.fn_upsert_project($1, $2, $3) AS fn_upsert_project',
      [systemUserId, 'fallow-summary-test-project', projectDir],
    );
    projectId = projectResult.rows[0]?.fn_upsert_project ?? '';

    const { runId } = await triggerScan({
      projectId,
      scannerIds: ['fallow'],
      userId: systemUserId,
    });
    const scanRow = await pool.query<{ id: string }>(
      'SELECT id FROM cqms.v_scans WHERE run_id = $1',
      [runId],
    );
    scanId = scanRow.rows[0]?.id ?? '';

    // Real procedure call — the same path ingestScanDetail takes.
    await pool.query('CALL cqms.sp_ingest_fallow_detail($1, $2, $3, $4)', [
      systemUserId,
      scanId,
      JSON.stringify(masterFixture),
      JSON.stringify(detailFixture),
    ]);
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('returns the master row with counts across every detail table', async () => {
    const summary = await getScanFallowSummary({ scanId });

    expect(summary).toEqual({
      average_maintainability: 93.2,
      check_total_issues: 3,
      circular_dependency_count: 1,
      clone_group_count: 1,
      clone_instance_count: 2,
      dead_code_count: 2,
      fallow_version: '3.0.0',
      file_score_count: 2,
      files_analyzed: 10,
      function_finding_count: 1,
      functions_above_threshold: 1,
      hotspot_count: 1,
      large_function_count: 1,
      target_count: 1,
    });
  });

  it('linked clone instances to their group through the generated id', async () => {
    const pool = getPool();
    const instances = await pool.query<{
      file_path: string;
      suggested_name: string;
    }>(
      `SELECT i.file_path, g.suggested_name
       FROM cqms.v_fallow_clone_instances i
       JOIN cqms.v_fallow_clone_groups g ON g.id = i.clone_group_id
       WHERE i.scan_id = $1
       ORDER BY i.file_path`,
      [scanId],
    );

    expect(instances.rows).toEqual([
      { file_path: 'src/a.ts', suggested_name: 'sharedHelper' },
      { file_path: 'src/b.ts', suggested_name: 'sharedHelper' },
    ]);
  });

  it('re-ingestion is idempotent (DELETE-then-INSERT, instances cascade)', async () => {
    const pool = getPool();
    await pool.query('CALL cqms.sp_ingest_fallow_detail($1, $2, $3, $4)', [
      systemUserId,
      scanId,
      JSON.stringify({ ...masterFixture, files_analyzed: 11 }),
      JSON.stringify({
        ...detailFixture,
        clone_groups: [],
        file_scores: [{ fan_in: 0, fan_out: 0, file_path: 'src/only.ts' }],
      }),
    ]);

    const summary = await getScanFallowSummary({ scanId });
    expect(summary).toMatchObject({
      clone_group_count: 0,
      clone_instance_count: 0,
      file_score_count: 1,
      files_analyzed: 11,
    });
  });

  it('returns undefined for a scan without a fallow master row', async () => {
    const summary = await getScanFallowSummary({
      scanId: '00000000-0000-0000-0000-000000000000',
    });
    expect(summary).toBeUndefined();
  });
});
