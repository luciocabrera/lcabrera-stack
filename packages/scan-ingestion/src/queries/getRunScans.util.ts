import { getPool } from '@repo/data-access/db/getPool.util';

export type RunScanRow = {
  readonly blocker_count: number | null;
  readonly duration_ms: number | null;
  readonly high_count: number | null;
  readonly low_count: number | null;
  readonly medium_count: number | null;
  readonly nit_count: number | null;
  readonly progress_message: string | null;
  readonly run_id: string;
  readonly scan_id: string;
  readonly scanner_id: string;
  readonly status: string;
};

type GetRunScansArgs = {
  readonly runId: string;
};

/** Backs `run-detail`'s Table — one row per scanner, via `cqms.run_scan_summary`. */
export const getRunScans = async ({
  runId,
}: GetRunScansArgs): Promise<readonly RunScanRow[]> => {
  const pool = getPool();
  const result = await pool.query<RunScanRow>(
    'SELECT * FROM cqms.run_scan_summary WHERE run_id = $1 ORDER BY scanner_id',
    [runId],
  );
  return result.rows;
};
