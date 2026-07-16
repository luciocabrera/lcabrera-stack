import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { writeTextFileWithin } from '@repo/scan-ingestion/fs/writeTextFileWithin.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { getUserByUsername } from '../queries/getUserByUsername.util.ts';
import { ingestReport } from './ingestReport.ts';

/**
 * Real integration tests against the live cqms_db — no mocked pg client.
 * Matches the manual smoke test already run against this schema (ADR-006);
 * this is that same path, now under the standalone quality gate. Since
 * ADR-028 the ad hoc path attaches to a pre-registered projectId instead
 * of upserting by path, and targetRootPath is only the relativization
 * root for the scanned tree.
 */
describe('ingestReport', () => {
  const createdProjectIds: string[] = [];
  let workDir: string;
  let systemUserId: string;

  const registerTestProject = async (name: string) => {
    const pool = getPool();
    const result = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, name],
    );
    const projectId = result.rows[0]?.fn_register_project ?? '';
    createdProjectIds.push(projectId);
    return projectId;
  };

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';
  });

  afterEach(() => {
    if (workDir) rmSync(workDir, { force: true, recursive: true });
  });

  afterAll(async () => {
    const pool = getPool();
    for (const projectId of createdProjectIds) {
      await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    }
    await closePool();
  });

  const writeReportFiles = (report: Record<string, unknown>) => {
    workDir = makeTempDirectory('scan-ingestion-report-');
    writeTextFileWithin({
      baseDirectory: workDir,
      content: JSON.stringify(report),
      targetPath: 'report.json',
    });
    writeTextFileWithin({
      baseDirectory: workDir,
      content: '# Test Report\n',
      targetPath: 'report.md',
    });
    return workDir;
  };

  it('creates a run/scan for an existing project and ingests findings on the ad hoc path (no runId)', async () => {
    const projectId = await registerTestProject('ingest-adhoc-project');
    const targetDir = makeTempDirectory('scan-ingestion-target-');

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

    try {
      const result = await ingestReport({
        origin: 'interactive_session',
        projectId,
        reportJsonPath: path.join(reportDir, 'report.json'),
        reportMarkdownPath: path.join(reportDir, 'report.md'),
        scannerId: 'code-smell-checker',
        scopeType: 'repo',
        scopeValue: '.',
        targetRootPath: targetDir,
        userId: systemUserId,
      });

      expect(result.findingsIngested).toBe(1);
      expect(result.reportId).toBe('report-ingest-test-1');
      expect(result.projectId).toBe(projectId);

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
    } finally {
      rmSync(targetDir, { force: true, recursive: true });
    }
  });

  it('rejects the ad hoc path without a projectId (path matching retired — ADR-028)', async () => {
    const reportDir = writeReportFiles({
      findings: [],
      generated_at: '2026-01-01T00:00:00Z',
      report_id: 'report-ingest-test-noid',
    });

    await expect(
      ingestReport({
        origin: 'interactive_session',
        reportJsonPath: path.join(reportDir, 'report.json'),
        reportMarkdownPath: path.join(reportDir, 'report.md'),
        scannerId: 'code-smell-checker',
        scopeType: 'repo',
        scopeValue: '.',
        targetRootPath: reportDir,
        userId: systemUserId,
      }),
    ).rejects.toThrow(/project-id/);
  });

  it('reuses an existing run/scan on the UI path (runId provided)', async () => {
    const projectId = await registerTestProject('ui-path-project');

    const pool = getPool();
    const runResult = await pool.query<{ fn_create_run: string }>(
      `SELECT cqms.fn_create_run($1, $2, 'ui_agent_sdk', '["linter"]'::jsonb, NULL, NULL, NULL) AS fn_create_run`,
      [systemUserId, projectId],
    );
    const runId = runResult.rows[0]?.fn_create_run;

    await pool.query(
      `SELECT cqms.fn_create_ad_hoc_scan($1, $2, $3, 'eslint', 'repo', '.')`,
      [systemUserId, runId, projectId],
    );

    const reportDir = writeReportFiles({
      findings: [],
      generated_at: '2026-01-01T00:00:00Z',
      report_id: 'report-ingest-test-2',
    });

    const result = await ingestReport({
      origin: 'ui_agent_sdk',
      reportJsonPath: path.join(reportDir, 'report.json'),
      reportMarkdownPath: path.join(reportDir, 'report.md'),
      runId,
      scannerId: 'eslint',
      scopeType: 'repo',
      scopeValue: '.',
      targetRootPath: reportDir,
      userId: systemUserId,
    });

    expect(result.runId).toBe(runId);
    expect(result.projectId).toBe(projectId);
  });

  it('does not dual-write into scan_findings for scanners with their own detail tables (ADR-028)', async () => {
    const projectId = await registerTestProject('detail-tables-project');

    const reportDir = writeReportFiles({
      findings: [
        {
          confidence: 'high',
          finding_id: 'eslint-f1',
          fix: 'Address per rule: no-unused-vars.',
          location_path: 'src/foo.ts',
          rule_id: 'no-unused-vars',
          severity: 'HIGH',
          why: "'x' is declared but never used.",
        },
      ],
      generated_at: '2026-01-01T00:00:00Z',
      high_count: 1,
      report_id: 'report-ingest-test-3',
      top_risk: 'no-unused-vars',
    });

    const result = await ingestReport({
      origin: 'interactive_session',
      projectId,
      reportJsonPath: path.join(reportDir, 'report.json'),
      reportMarkdownPath: path.join(reportDir, 'report.md'),
      scannerId: 'eslint',
      scopeType: 'repo',
      scopeValue: '.',
      targetRootPath: reportDir,
      userId: systemUserId,
    });

    // The report itself still claims the real finding count — only the
    // scan_findings row-insert is skipped, not the report metadata.
    expect(result.findingsIngested).toBe(1);

    const pool = getPool();
    const findingRows = await pool.query(
      'SELECT * FROM cqms.scan_findings WHERE scan_id = $1',
      [result.scanId],
    );
    expect(findingRows.rows).toHaveLength(0);

    const reportRow = await pool.query<{ high_count: number }>(
      'SELECT high_count FROM cqms.reports WHERE scan_id = $1',
      [result.scanId],
    );
    expect(reportRow.rows[0]?.high_count).toBe(1);
  });
});
