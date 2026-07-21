import { getPool } from '@lcabrera/server/db/get-pool.util';

export type RunScanRow = {
  readonly blocker_count: null | number;
  readonly duration_ms: null | number;
  readonly high_count: null | number;
  readonly low_count: null | number;
  readonly medium_count: null | number;
  readonly nit_count: null | number;
  readonly progress_message: null | string;
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
