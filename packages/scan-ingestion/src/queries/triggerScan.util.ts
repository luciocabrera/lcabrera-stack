import { getPool } from '@lcabrera/server/db/get-pool.util';

export type TriggerScanResult = {
  readonly runId: string;
};

type TriggerScanArgs = {
  readonly projectId: string;
  readonly scannerIds: readonly string[];
  readonly triggeredBy?: string;
  readonly userId: string;
  /** Project-root-relative workspace paths; empty/omitted = whole repo. */
  readonly workspacePaths?: readonly string[];
};

/**
 * Backs the `trigger-scan` action (TECH_SPEC §2.8). Only inserts the run +
 * 'queued' scan rows — the orchestrator picks them up via LISTEN/NOTIFY.
 * Since ADR-021 a run fans out as scanners × scopes through
 * fn_create_run_with_scoped_scans: each selected workspace becomes a
 * 'folder'-scoped scan per scanner; no selection means one 'repo'-scoped
 * scan per scanner (the pre-ADR-021 behavior, now expressed as a
 * single-entry scope list). fn_create_run asserts 'execute scan' with the
 * project as the grantable resource (ADR-018), so per-project instance
 * grants apply here.
 */
export const triggerScan = async ({
  projectId,
  scannerIds,
  triggeredBy,
  userId,
  workspacePaths = [],
}: TriggerScanArgs): Promise<TriggerScanResult> => {
  // Deduplicated: a duplicate selection would create two identical
  // (scanner, scope) scan rows and re-introduce the resolveScan ambiguity
  // the scope-qualified lookup exists to prevent.
  const uniqueWorkspacePaths = [...new Set(workspacePaths)];
  const scopes =
    uniqueWorkspacePaths.length > 0
      ? uniqueWorkspacePaths.map((workspacePath) => ({
          scope_type: 'folder',
          scope_value: workspacePath,
        }))
      : [{ scope_type: 'repo', scope_value: '.' }];

  const pool = getPool();
  const result = await pool.query<{ fn_create_run_with_scoped_scans: string }>(
    `SELECT cqms.fn_create_run_with_scoped_scans($1, $2, 'ui_agent_sdk', $3, $4, NULL, NULL, $5) AS fn_create_run_with_scoped_scans`,
    // undefined parameters are serialized as SQL NULL by pg (prepareValue).
    [
      userId,
      projectId,
      JSON.stringify(scannerIds),
      triggeredBy,
      JSON.stringify(scopes),
    ],
  );

  const runId = result.rows[0]?.fn_create_run_with_scoped_scans;
  if (!runId) {
    throw new Error('Failed to create run.');
  }

  return { runId };
};
