import type { Pool } from 'pg';

import type { IngestReportArgs } from './ingestReport.types.ts';

import { resolveProjectPath } from './matchProject.util.ts';

export type ResolvedScan = {
  readonly projectId: string;
  readonly runId: string;
  readonly scanId: string;
};

type ResolveExistingScanArgs = {
  readonly ingestArgs: IngestReportArgs;
  readonly pool: Pool;
  readonly runId: string;
};

const resolveExistingScan = async ({
  ingestArgs,
  pool,
  runId,
}: ResolveExistingScanArgs): Promise<ResolvedScan> => {
  const runResult = await pool.query<{ project_id: string }>(
    'SELECT project_id FROM cqms.v_runs WHERE id = $1',
    [runId],
  );
  const projectId = runResult.rows[0]?.project_id;
  if (!projectId) {
    throw new Error(`No run found for runId=${runId}`);
  }

  const scanResult = await pool.query<{ id: string }>(
    `SELECT id FROM cqms.v_scans
     WHERE run_id = $1 AND scanner_id = $2
     ORDER BY created_at DESC LIMIT 1`,
    [runId, ingestArgs.scannerId],
  );
  const scanId = scanResult.rows[0]?.id;
  if (!scanId) {
    throw new Error(
      `No scan found for runId=${runId}, scannerId=${ingestArgs.scannerId}`,
    );
  }

  return { projectId, runId, scanId };
};

type CreateAdHocScanArgs = {
  readonly ingestArgs: IngestReportArgs;
  readonly pool: Pool;
};

const createAdHocScan = async ({
  ingestArgs,
  pool,
}: CreateAdHocScanArgs): Promise<ResolvedScan> => {
  const { canonicalPath, gitBranch, gitCommitSha, projectName } =
    resolveProjectPath({ localPath: ingestArgs.localPath });

  const upsertResult = await pool.query<{ fn_upsert_project: string }>(
    'SELECT cqms.fn_upsert_project($1, $2, $3) AS fn_upsert_project',
    [ingestArgs.userId, projectName, canonicalPath],
  );
  const projectId = upsertResult.rows[0]?.fn_upsert_project;
  if (!projectId) throw new Error('fn_upsert_project returned no id');

  const createRunResult = await pool.query<{ fn_create_run: string }>(
    'SELECT cqms.fn_create_run($1, $2, $3, $4, $5, $6, $7) AS fn_create_run',
    [
      ingestArgs.userId,
      projectId,
      ingestArgs.origin,
      JSON.stringify([ingestArgs.scannerId]),
      // undefined parameters are serialized as SQL NULL by pg (prepareValue).
      ingestArgs.triggeredBy,
      gitCommitSha,
      gitBranch,
    ],
  );
  const runId = createRunResult.rows[0]?.fn_create_run;
  if (!runId) throw new Error('fn_create_run returned no id');

  const scanInsertResult = await pool.query<{ fn_create_ad_hoc_scan: string }>(
    'SELECT cqms.fn_create_ad_hoc_scan($1, $2, $3, $4, $5, $6) AS fn_create_ad_hoc_scan',
    [
      ingestArgs.userId,
      runId,
      projectId,
      ingestArgs.scannerId,
      ingestArgs.scopeType,
      ingestArgs.scopeValue,
    ],
  );
  const scanId = scanInsertResult.rows[0]?.fn_create_ad_hoc_scan;
  if (!scanId) throw new Error('fn_create_ad_hoc_scan returned no id');

  return { projectId, runId, scanId };
};

type ResolveScanArgs = {
  readonly ingestArgs: IngestReportArgs;
  readonly pool: Pool;
};

/**
 * UI path (ingestArgs.runId present): run + scan already exist (created by
 * the trigger-scan action before the job started) — just locate them. Ad hoc
 * path (no runId): resolve the project's canonical git-root path, upsert
 * the project, and create both run and scan rows here.
 */
export const resolveScan = async ({
  ingestArgs,
  pool,
}: ResolveScanArgs): Promise<ResolvedScan> =>
  ingestArgs.runId
    ? resolveExistingScan({ ingestArgs, pool, runId: ingestArgs.runId })
    : createAdHocScan({ ingestArgs, pool });
