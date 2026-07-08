import { getPool } from '@repo/data-access/db/getPool.util';

/**
 * Org-wide rolling-24h sum of real (non-capped) LLM spend — backs the
 * daily-cost cap check in apps/scan-orchestrator's runQueuedScan.ts.
 */
export const getTrailingLlmCostUsd = async (): Promise<number> => {
  const pool = getPool();
  const result = await pool.query<{ total_cost_usd: string }>(
    `SELECT coalesce(sum(total_cost_usd), 0) AS total_cost_usd
     FROM llm_usage.v_scan_llm_usage
     WHERE outcome <> 'capped' AND created_at >= now() - interval '24 hours'`,
  );

  // pg returns numeric columns as strings, not JS numbers.
  return Number(result.rows[0]?.total_cost_usd ?? 0);
};
