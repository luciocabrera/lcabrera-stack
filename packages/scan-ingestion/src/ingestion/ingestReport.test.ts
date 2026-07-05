import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { ingestReport } from './ingestReport.ts';

/**
 * Real integration tests against the live cqms_db — no mocked pg client.
 * Matches the manual smoke test already run against this schema (ADR-006);
 * this is that same path, now under the standalone quality gate.
 */
describe('ingestReport', () => {
  const createdProjectPaths: string[] = [];
  let workDir: string;

  afterEach(() => {
    if (workDir) rmSync(workDir, { force: true, recursive: true });
  });

  afterAll(async () => {
    const pool = getPool();
    for (const localPath of createdProjectPaths) {
      await pool.query('DELETE FROM cqms.projects WHERE local_path = $1', [
        localPath,
      ]);
    }
    await closePool();
  });

  const writeReportFiles = (report: Record<string, unknown>) => {
    workDir = mkdtempSync(join(tmpdir(), 'scan-ingestion-report-'));
    writeFileSync(join(workDir, 'report.json'), JSON.stringify(report), 'utf8');
    writeFileSync(join(workDir, 'report.md'), '# Test Report\n', 'utf8');
    return workDir;
  };

  it('creates a project/run/scan and ingests findings on the ad hoc path (no runId)', async () => {
    const projectDir = realpathSync(
      mkdtempSync(join(tmpdir(), 'scan-ingestion-project-')),
    );
    createdProjectPaths.push(projectDir);

    const reportDir = writeReportFiles({
      findings: [
        {
          confidence: 'high',
          finding_id: 'f1',
          fix: 'remove it',
          location_path: 'src/foo.ts',
          rule_id: 'no-unused-export',
          severity: 'HIGH',
          why: 'unused',
        },
      ],
      generated_at: '2026-01-01T00:00:00Z',
      high_count: 1,
      report_id: 'report-ingest-test-1',
      top_risk: 'unused-export',
    });

    const result = await ingestReport({
      localPath: projectDir,
      origin: 'interactive_session',
      reportJsonPath: join(reportDir, 'report.json'),
      reportMarkdownPath: join(reportDir, 'report.md'),
      scannerId: 'code-smell-checker',
      scopeType: 'repo',
      scopeValue: '.',
    });

    expect(result.findingsIngested).toBe(1);
    expect(result.reportId).toBe('report-ingest-test-1');

    const pool = getPool();
    const runRow = await pool.query<{ status: string }>(
      'SELECT status FROM cqms.runs WHERE id = $1',
      [result.runId],
    );
    expect(runRow.rows[0]?.status).toBe('succeeded');

    const findingRow = await pool.query<{ severity: string }>(
      'SELECT severity FROM cqms.scan_findings WHERE scan_id = $1',
      [result.scanId],
    );
    expect(findingRow.rows[0]?.severity).toBe('HIGH');
  });

  it('reuses an existing run/scan on the UI path (runId provided)', async () => {
    const projectDir = realpathSync(
      mkdtempSync(join(tmpdir(), 'scan-ingestion-project-')),
    );
    createdProjectPaths.push(projectDir);

    const pool = getPool();
    const projectResult = await pool.query<{ fn_upsert_project: string }>(
      'SELECT cqms.fn_upsert_project($1, $2) AS fn_upsert_project',
      ['ui-path-project', projectDir],
    );
    const projectId = projectResult.rows[0]?.fn_upsert_project;

    const runResult = await pool.query<{ fn_create_run: string }>(
      `SELECT cqms.fn_create_run($1, 'ui_agent_sdk', '["linter"]'::jsonb, NULL, NULL, NULL) AS fn_create_run`,
      [projectId],
    );
    const runId = runResult.rows[0]?.fn_create_run;

    await pool.query(
      `INSERT INTO cqms.scans (run_id, project_id, scanner_id, status, scope_type, scope_value, started_at)
       VALUES ($1, $2, 'linter', 'running', 'repo', '.', now())`,
      [runId, projectId],
    );

    const reportDir = writeReportFiles({
      findings: [],
      generated_at: '2026-01-01T00:00:00Z',
      report_id: 'report-ingest-test-2',
    });

    const result = await ingestReport({
      localPath: projectDir,
      origin: 'ui_agent_sdk',
      reportJsonPath: join(reportDir, 'report.json'),
      reportMarkdownPath: join(reportDir, 'report.md'),
      runId,
      scannerId: 'linter',
      scopeType: 'repo',
      scopeValue: '.',
    });

    expect(result.runId).toBe(runId);
    expect(result.projectId).toBe(projectId);
  });
});
