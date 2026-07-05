import type { Pool } from 'pg';

import type { IngestReportArgs } from './ingestReport.types.ts';

import { resolveProjectPath } from './matchProject.util.ts';

export type ResolvedScan = {
  readonly projectId: string;
  readonly runId: string;
  readonly scanId: string;
};

const resolveExistingScan = async (
  pool: Pool,
  args: IngestReportArgs,
  runId: string,
): Promise<ResolvedScan> => {
  const runResult = await pool.query<{ project_id: string }>(
    'SELECT project_id FROM cqms.runs WHERE id = $1',
    [runId],
  );
  const projectId = runResult.rows[0]?.project_id;
  if (!projectId) {
    throw new Error(`No run found for runId=${runId}`);
  }

  const scanResult = await pool.query<{ id: string }>(
    `SELECT id FROM cqms.scans
     WHERE run_id = $1 AND scanner_id = $2
     ORDER BY created_at DESC LIMIT 1`,
    [runId, args.scannerId],
  );
  const scanId = scanResult.rows[0]?.id;
  if (!scanId) {
    throw new Error(
      `No scan found for runId=${runId}, scannerId=${args.scannerId}`,
    );
  }

  return { projectId, runId, scanId };
};

const createAdHocScan = async (
  pool: Pool,
  args: IngestReportArgs,
): Promise<ResolvedScan> => {
  const { canonicalPath, gitBranch, gitCommitSha, projectName } =
    resolveProjectPath({ localPath: args.localPath });

  const upsertResult = await pool.query<{ fn_upsert_project: string }>(
    'SELECT cqms.fn_upsert_project($1, $2) AS fn_upsert_project',
    [projectName, canonicalPath],
  );
  const projectId = upsertResult.rows[0]?.fn_upsert_project;
  if (!projectId) throw new Error('fn_upsert_project returned no id');

  const createRunResult = await pool.query<{ fn_create_run: string }>(
    'SELECT cqms.fn_create_run($1, $2, $3, $4, $5, $6) AS fn_create_run',
    [
      projectId,
      args.origin,
      JSON.stringify([args.scannerId]),
      args.triggeredBy ?? null,
      gitCommitSha ?? null,
      gitBranch ?? null,
    ],
  );
  const runId = createRunResult.rows[0]?.fn_create_run;
  if (!runId) throw new Error('fn_create_run returned no id');

  const scanInsertResult = await pool.query<{ id: string }>(
    `INSERT INTO cqms.scans (run_id, project_id, scanner_id, status, scope_type, scope_value, started_at)
     VALUES ($1, $2, $3, 'running', $4, $5, now())
     RETURNING id`,
    [runId, projectId, args.scannerId, args.scopeType, args.scopeValue],
  );
  const scanId = scanInsertResult.rows[0]?.id;
  if (!scanId) throw new Error('scan insert returned no id');

  return { projectId, runId, scanId };
};

/**
 * UI path (args.runId present): run + scan already exist (created by the
 * trigger-scan action before the job started) — just locate them. Ad hoc
 * path (no runId): resolve the project's canonical git-root path, upsert
 * the project, and create both run and scan rows here.
 */
export const resolveScan = async (
  pool: Pool,
  args: IngestReportArgs,
): Promise<ResolvedScan> =>
  args.runId
    ? resolveExistingScan(pool, args, args.runId)
    : createAdHocScan(pool, args);
