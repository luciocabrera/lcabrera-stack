import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { getUserByUsername } from '@repo/scan-ingestion/queries/getUserByUsername.util';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { createRunStatusHub } from '../ws/runStatusHub.ts';
import { runQueuedScan } from './runQueuedScan.ts';

describe('runQueuedScan (deterministic linter branch)', () => {
  let projectDir: string;
  let projectId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    const temporaryDirectoryTemplate = path.join(
      tmpdir(),
      'run-queued-scan-test-',
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- canonicalizes the temp directory this test just created itself via mkdtempSync; no external input involved
    projectDir = realpathSync(mkdtempSync(temporaryDirectoryTemplate));

    const pool = getPool();
    const result = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'run-queued-scan-test-project'],
    );
    projectId = result.rows[0]?.fn_register_project ?? '';

    // The temp dir doubles as the project's snapshot storage (ADR-028) —
    // the scan target the orchestrator executes against.
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

  it('runs a real linter scan end to end and ingests a real report', async () => {
    const pool = getPool();
    const runResult = await pool.query<{ fn_create_run_with_scans: string }>(
      `SELECT cqms.fn_create_run_with_scans($1, $2, 'ui_agent_sdk', $3, NULL, NULL, NULL, 'repo', '.') AS fn_create_run_with_scans`,
      [systemUserId, projectId, JSON.stringify(['eslint'])],
    );
    const runId = runResult.rows[0]?.fn_create_run_with_scans ?? '';

    const scanRow = await pool.query<{ id: string }>(
      'SELECT id FROM cqms.scans WHERE run_id = $1',
      [runId],
    );
    const scanId = scanRow.rows[0]?.id ?? '';

    const hub = createRunStatusHub();
    const publishedStatuses: string[] = [];
    const originalPublish = hub.publish;
    hub.publish = (args) => {
      publishedStatuses.push(args.payload.status);
      originalPublish(args);
    };

    await runQueuedScan({
      dailyCapUsd: 1000,
      hub,
      scan: {
        deterministic: true,
        project_id: projectId,
        run_id: runId,
        scan_id: scanId,
        scanner_id: 'eslint',
        scope_type: 'repo',
        scope_value: '.',
        skill_path: '.github/skills/linter-checker',
        snapshot_path: projectDir,
      },
      userId: systemUserId,
    });

    expect(publishedStatuses).toEqual(['running', 'succeeded']);

    const finalScan = await pool.query<{ status: string }>(
      'SELECT status FROM cqms.scans WHERE id = $1',
      [scanId],
    );
    expect(finalScan.rows[0]?.status).toBe('succeeded');

    const report = await pool.query<{
      files_analyzed: number;
      top_risk: string;
    }>('SELECT files_analyzed, top_risk FROM cqms.reports WHERE scan_id = $1', [
      scanId,
    ]);
    expect(report.rows[0]?.top_risk).toContain(
      'No eslint configuration detected',
    );

    // A second pass over the same (no longer queued) scan must LOSE the
    // claim and do nothing (ADR-026) — no status published, no
    // re-execution, scan untouched.
    const statusesBeforeSecondPass = [...publishedStatuses];
    await runQueuedScan({
      dailyCapUsd: 1000,
      hub,
      scan: {
        deterministic: true,
        project_id: projectId,
        run_id: runId,
        scan_id: scanId,
        scanner_id: 'eslint',
        scope_type: 'repo',
        scope_value: '.',
        skill_path: '.github/skills/linter-checker',
        snapshot_path: projectDir,
      },
      userId: systemUserId,
    });
    expect(publishedStatuses).toEqual(statusesBeforeSecondPass);

    const scanAfterSecondPass = await pool.query<{ status: string }>(
      'SELECT status FROM cqms.scans WHERE id = $1',
      [scanId],
    );
    expect(scanAfterSecondPass.rows[0]?.status).toBe('succeeded');
  }, 20_000);
});

describe('runQueuedScan (agentic branch, org-wide daily cost cap)', () => {
  let projectDir: string;
  let projectId: string;
  let systemUserId: string;

  beforeAll(async () => {
    const systemUser = await getUserByUsername({ username: 'system' });
    systemUserId = systemUser?.id ?? '';

    const temporaryDirectoryTemplate = path.join(
      tmpdir(),
      'run-queued-scan-capped-test-',
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- canonicalizes the temp directory this test just created itself via mkdtempSync; no external input involved
    projectDir = realpathSync(mkdtempSync(temporaryDirectoryTemplate));

    const pool = getPool();
    const result = await pool.query<{ fn_register_project: string }>(
      'SELECT cqms.fn_register_project($1, $2) AS fn_register_project',
      [systemUserId, 'run-queued-scan-capped-test-project'],
    );
    projectId = result.rows[0]?.fn_register_project ?? '';
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query('DELETE FROM cqms.projects WHERE id = $1', [projectId]);
    await closePool();
    rmSync(projectDir, { force: true, recursive: true });
  });

  it('skips the agentic scan without ever calling the Agent SDK, marks it failed with the cap reason, and logs a capped attempt', async () => {
    const pool = getPool();
    const runResult = await pool.query<{ fn_create_run_with_scans: string }>(
      `SELECT cqms.fn_create_run_with_scans($1, $2, 'ui_agent_sdk', $3, NULL, NULL, NULL, 'repo', '.') AS fn_create_run_with_scans`,
      [systemUserId, projectId, JSON.stringify(['code-smell-checker'])],
    );
    const runId = runResult.rows[0]?.fn_create_run_with_scans ?? '';

    const scanRow = await pool.query<{ id: string }>(
      'SELECT id FROM cqms.scans WHERE run_id = $1',
      [runId],
    );
    const scanId = scanRow.rows[0]?.id ?? '';

    const hub = createRunStatusHub();
    const publishedStatuses: string[] = [];
    const originalPublish = hub.publish;
    hub.publish = (args) => {
      publishedStatuses.push(args.payload.status);
      originalPublish(args);
    };

    // A cap of 0 guarantees getTrailingLlmCostUsd() >= dailyCapUsd always
    // trips (any non-negative sum is >= 0), so runSkillAgent() — and a
    // real Claude API call — is never actually reached. Fast, free,
    // deterministic.
    await runQueuedScan({
      dailyCapUsd: 0,
      hub,
      scan: {
        deterministic: false,
        project_id: projectId,
        run_id: runId,
        scan_id: scanId,
        scanner_id: 'code-smell-checker',
        scope_type: 'repo',
        scope_value: '.',
        skill_path: '.github/skills/code-smell-checker',
        snapshot_path: projectDir,
      },
      userId: systemUserId,
    });

    expect(publishedStatuses).toEqual(['running', 'failed']);

    const finalScan = await pool.query<{
      error_message: null | string;
      status: string;
    }>('SELECT status, error_message FROM cqms.scans WHERE id = $1', [scanId]);
    expect(finalScan.rows[0]?.status).toBe('failed');
    expect(finalScan.rows[0]?.error_message).toContain('Scan skipped');
    expect(finalScan.rows[0]?.error_message).toContain('cap');

    const usageRow = await pool.query<{ error_message: null | string }>(
      `SELECT error_message FROM llm_usage.scan_llm_usage
       WHERE scan_id = $1 AND outcome = 'capped'`,
      [scanId],
    );
    expect(usageRow.rows).toHaveLength(1);
    expect(usageRow.rows[0]?.error_message).toContain('cap');
  }, 20_000);
});
