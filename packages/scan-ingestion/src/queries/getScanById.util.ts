import { getPool } from '@repo/data-access/db/getPool.util';

export type ScanRow = {
  readonly duration_ms: number | null;
  readonly error_message: string | null;
  readonly health_metrics: Record<string, unknown> | null;
  readonly id: string;
  readonly project_id: string;
  readonly raw_json: unknown;
  readonly run_id: string;
  readonly scanner_id: string;
  readonly scope_type: string;
  readonly scope_value: string;
  readonly status: string;
};

type GetScanByIdArgs = {
  readonly scanId: string;
};

export const getScanById = async ({
  scanId,
}: GetScanByIdArgs): Promise<ScanRow | undefined> => {
  const pool = getPool();
  const result = await pool.query<ScanRow>(
    'SELECT * FROM cqms.scans WHERE id = $1',
    [scanId],
  );
  return result.rows[0];
};
