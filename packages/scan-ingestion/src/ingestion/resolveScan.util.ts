import type { Pool } from 'pg';

import type { IngestReportArgs } from './ingestReport.types.ts';

import { readGitMetadata } from './git/readGitMetadata.util.ts';

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

  // Scope-qualified since ADR-021: a run fans out as scanners × scopes, so
  // (run_id, scanner_id) alone is ambiguous — two eslint scans of the same
  // run (different workspaces) share a created_at, and an unqualified
  // LIMIT 1 ingested one workspace's report into the other's scan row
  // (caught live: the second ingest then died on reports_scan_id_key).
  const scanResult = await pool.query<{ id: string }>(
    `SELECT id FROM cqms.v_scans
     WHERE run_id = $1 AND scanner_id = $2
       AND scope_type = $3 AND scope_value = $4
     ORDER BY created_at DESC LIMIT 1`,
    [runId, ingestArgs.scannerId, ingestArgs.scopeType, ingestArgs.scopeValue],
  );
  const scanId = scanResult.rows[0]?.id;
  if (!scanId) {
    throw new Error(
      `No scan found for runId=${runId}, scannerId=${ingestArgs.scannerId}, scope=${ingestArgs.scopeType}:${ingestArgs.scopeValue}`,
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
  // Path-based match-or-create retired with the local_path model (ADR-028):
  // ad hoc evidence imports attach to a project that already exists.
  const projectId = ingestArgs.projectId;
  if (!projectId) {
    throw new Error(
      'Ad hoc ingestion requires --project-id — path-based project matching was removed (ADR-028).',
    );
  }

  const projectResult = await pool.query<{ id: string }>(
    'SELECT id FROM cqms.v_projects WHERE id = $1',
    [projectId],
  );
  if (!projectResult.rows[0]) {
    throw new Error(`No project found for projectId=${projectId}`);
  }

  const { gitBranch, gitCommitSha } = readGitMetadata({
    cwd: ingestArgs.targetRootPath,
  });

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
 * path (no runId): attach to the pre-registered project named by
 * ingestArgs.projectId (ADR-028 — no more match-by-path upsert), stamp
 * git metadata from the target root when available, and create both run
 * and scan rows here.
 */
export const resolveScan = async ({
  ingestArgs,
  pool,
}: ResolveScanArgs): Promise<ResolvedScan> =>
  ingestArgs.runId
    ? resolveExistingScan({ ingestArgs, pool, runId: ingestArgs.runId })
    : createAdHocScan({ ingestArgs, pool });
