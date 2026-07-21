import { getPool } from '@repo/server/db/get-pool.util';

export type ScanLlmUsageOutcome = 'capped' | 'failed' | 'succeeded';

type RecordScanLlmUsageArgs = {
  readonly errorMessage?: string;
  readonly numTurns?: number;
  readonly outcome: ScanLlmUsageOutcome;
  readonly projectId: string;
  readonly runId: string;
  readonly scanId: string;
  readonly scannerId: string;
  readonly totalCostUsd?: number;
  readonly userId: string;
};

/**
 * Persists one LLM-usage attempt for a scan — a real runSkillAgent()
 * invocation (outcome 'succeeded'/'failed') or a budget-cap skip that never
 * called it at all (outcome 'capped'). Backs both the trailing-24h cap
 * check (getTrailingLlmCostUsd) and the llm-usage report queries.
 */
export const recordScanLlmUsage = async ({
  errorMessage,
  numTurns,
  outcome,
  projectId,
  runId,
  scanId,
  scannerId,
  totalCostUsd,
  userId,
}: RecordScanLlmUsageArgs): Promise<void> => {
  const pool = getPool();
  await pool.query(
    'SELECT llm_usage.fn_record_scan_llm_usage($1, $2, $3, $4, $5, $6, $7, $8, $9)',
    // Plain `undefined` array elements are serialized as SQL NULL by pg
    // (prepareValue) — no `?? null` coalescing needed for the optional
    // fields, matching triggerScan.util.ts's documented convention.
    [
      userId,
      scanId,
      runId,
      projectId,
      scannerId,
      outcome,
      totalCostUsd,
      numTurns,
      errorMessage,
    ],
  );
};
