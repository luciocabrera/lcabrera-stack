import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getProjectById } from './getProjectById.util.ts';
import { getProjectListView } from './getProjectListView.util.ts';
import { getProjectRuns } from './getProjectRuns.util.ts';
import { getProjectScannerTrend } from './getProjectScannerTrend.util.ts';
import { getRunById } from './getRunById.util.ts';
import { getRunScans } from './getRunScans.util.ts';
import { getScanById } from './getScanById.util.ts';
import { getScanFindings } from './getScanFindings.util.ts';
import { getScanReport } from './getScanReport.util.ts';

/**
 * Real integration tests against the live cqms_db — no mocked pg client,
 * matching this package's established convention (ingestReport.test.ts).
 * One project/run/scan/report/findings hierarchy is seeded once in
 * beforeAll and shared read-only across every test below, since these are
 * all thin SELECT wrappers over the same real rows — re-seeding per test
 * would just be repeated round trips proving nothing new.
 */
describe('queries', () => {
  let projectDir: string;
  let projectId: string;
  let runId: string;
  let scanId: string;

  beforeAll(async () => {
    projectDir = makeTempDirectory('scan-ingestion-queries-');

    const pool = getPool();

    const projectResult = await pool.query<{ fn_upsert_project: string }>(
      'SELECT cqms.fn_upsert_project($1, $2) AS fn_upsert_project',
      ['queries-test-project', projectDir],
    );
    projectId = projectResult.rows[0]?.fn_upsert_project ?? '';

    const runResult = await pool.query<{ fn_create_run: string }>(
      `SELECT cqms.fn_create_run($1, 'interactive_session', '["linter"]'::jsonb, 'test-user', 'abc123', 'main') AS fn_create_run`,
      [projectId],
    );
    runId = runResult.rows[0]?.fn_create_run ?? '';

    const scanResult = await pool.query<{ id: string }>(
      `INSERT INTO cqms.scans (run_id, project_id, scanner_id, status, scope_type, scope_value, started_at, finished_at, duration_ms, raw_json)
       VALUES ($1, $2, 'linter', 'succeeded', 'repo', '.', now(), now(), 1234, '{"kind":"combined"}'::jsonb)
       RETURNING id`,
      [runId, projectId],
    );
    scanId = scanResult.rows[0]?.id ?? '';

    await pool.query(
      `INSERT INTO cqms.reports (scan_id, report_id, generated_at, report_markdown, report_json, files_analyzed, blocker_count, high_count, medium_count, low_count, nit_count, top_risk)
       VALUES ($1, 'queries-test-report', now(), '# Report', '{}'::jsonb, 1, 0, 1, 1, 0, 0, 'top risk')`,
      [scanId],
    );

    await pool.query(
      `INSERT INTO cqms.scan_findings (scan_id, finding_id, rule_id, severity, confidence, location_path, why, fix)
       VALUES
         ($1, 'f1', 'no-var', 'HIGH', 'high', 'src/a.ts', 'uses var', 'use const'),
         ($1, 'f2', 'eqeqeq', 'MEDIUM', 'high', 'src/b.ts', 'loose equality', 'use ===')`,
      [scanId],
    );
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('getProjectListView includes the seeded project with its rolled-up severity counts', async () => {
    const rows = await getProjectListView();
    const row = rows.find((r) => r.id === projectId);

    expect(row).toBeDefined();
    expect(row?.latest_run_id).toBe(runId);
    expect(row?.total_high).toBe(1);
  });

  it('getProjectById returns the seeded project', async () => {
    const project = await getProjectById({ projectId });
    expect(project?.name).toBe('queries-test-project');
  });

  it('getProjectById returns undefined for an unknown id', async () => {
    const project = await getProjectById({
      projectId: '00000000-0000-0000-0000-000000000000',
    });
    expect(project).toBeUndefined();
  });

  it('getProjectRuns returns the seeded run with its severity rollup', async () => {
    const runs = await getProjectRuns({ limit: 10, projectId, skip: 0 });
    expect(runs).toHaveLength(1);
    expect(runs[0]?.id).toBe(runId);
    expect(runs[0]?.total_high).toBe(1);
  });

  it('getProjectScannerTrend returns one row for the seeded run', async () => {
    const trend = await getProjectScannerTrend({ projectId });
    expect(trend).toHaveLength(1);
    expect(trend[0]?.scanner_id).toBe('linter');
    expect(trend[0]?.high_count).toBe(1);
  });

  it('getRunById returns the seeded run', async () => {
    const run = await getRunById({ runId });
    expect(run?.project_id).toBe(projectId);
    // fn_create_run always sets 'running' — only fn_finalize_run_status
    // (never called by this seed) transitions it further.
    expect(run?.status).toBe('running');
  });

  it('getRunScans returns the seeded scan summary', async () => {
    const scans = await getRunScans({ runId });
    expect(scans).toHaveLength(1);
    expect(scans[0]?.scan_id).toBe(scanId);
    expect(scans[0]?.high_count).toBe(1);
  });

  it('getScanById returns the seeded scan', async () => {
    const scan = await getScanById({ scanId });
    expect(scan?.scanner_id).toBe('linter');
    expect(scan?.status).toBe('succeeded');
  });

  it('getScanReport returns the seeded report', async () => {
    const report = await getScanReport({ scanId });
    expect(report?.report_id).toBe('queries-test-report');
    expect(report?.top_risk).toBe('top risk');
  });

  it('getScanFindings returns both seeded findings, ordered by severity', async () => {
    const result = await getScanFindings({ limit: 10, scanId, skip: 0 });
    expect(result.total).toBe(2);
    expect(result.rows.map((f) => f.finding_id)).toEqual(['f1', 'f2']);
  });

  it('getScanFindings filters by severity', async () => {
    const result = await getScanFindings({
      limit: 10,
      scanId,
      severity: 'MEDIUM',
      skip: 0,
    });
    expect(result.total).toBe(1);
    expect(result.rows[0]?.finding_id).toBe('f2');
  });

  it('getScanFindings paginates', async () => {
    const result = await getScanFindings({ limit: 1, scanId, skip: 1 });
    expect(result.total).toBe(2);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.finding_id).toBe('f2');
  });
});
