import { closePool, getPool } from '@repo/data-access/db/getPool.util';
import { getUserByUsername } from '@repo/scan-ingestion/queries/getUserByUsername.util';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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
    const result = await pool.query<{ fn_upsert_project: string }>(
      'SELECT cqms.fn_upsert_project($1, $2, $3) AS fn_upsert_project',
      [systemUserId, 'run-queued-scan-test-project', projectDir],
    );
    projectId = result.rows[0]?.fn_upsert_project ?? '';
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
      hub,
      scan: {
        deterministic: true,
        local_path: projectDir,
        project_id: projectId,
        run_id: runId,
        scan_id: scanId,
        scanner_id: 'eslint',
        scope_type: 'repo',
        scope_value: '.',
        skill_path: '.github/skills/linter-checker',
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
  }, 20_000);
});
