import { getPool } from '@repo/data-access/db/getPool.util';

export type TriggerScanResult = {
  readonly runId: string;
};

type TriggerScanArgs = {
  readonly projectId: string;
  readonly scannerIds: readonly string[];
  readonly scopeValue: string;
  readonly triggeredBy?: string;
};

/**
 * Backs the `trigger-scan` action (TECH_SPEC §2.8). Only inserts the run +
 * 'queued' scan rows — it does NOT spawn the background job that actually
 * executes them (that's Implementation Plan step 9's orchestrator). A
 * triggered run intentionally sits at 'queued' until that step exists.
 */
export const triggerScan = async ({
  projectId,
  scannerIds,
  scopeValue,
  triggeredBy,
}: TriggerScanArgs): Promise<TriggerScanResult> => {
  const pool = getPool();
  const result = await pool.query<{ fn_create_run_with_scans: string }>(
    `SELECT cqms.fn_create_run_with_scans($1, 'ui_agent_sdk', $2, $3, NULL, NULL, 'repo', $4) AS fn_create_run_with_scans`,
    // undefined parameters are serialized as SQL NULL by pg (prepareValue).
    [projectId, JSON.stringify(scannerIds), triggeredBy, scopeValue],
  );

  const runId = result.rows[0]?.fn_create_run_with_scans;
  if (!runId) {
    throw new Error('Failed to create run.');
  }

  return { runId };
};
