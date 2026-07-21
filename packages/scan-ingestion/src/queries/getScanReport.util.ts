import { getPool } from '@lcabrera/server/db/get-pool.util';

export type ScanReportRow = {
  readonly blocker_count: number;
  readonly generated_at: string;
  readonly high_count: number;
  readonly low_count: number;
  readonly medium_count: number;
  readonly nit_count: number;
  readonly report_id: string;
  readonly report_json: Record<string, unknown>;
  readonly report_markdown: string;
  readonly scan_id: string;
  readonly top_risk: null | string;
};

type GetScanReportArgs = {
  readonly scanId: string;
};

export const getScanReport = async ({
  scanId,
}: GetScanReportArgs): Promise<ScanReportRow | undefined> => {
  const pool = getPool();
  const result = await pool.query<ScanReportRow>(
    'SELECT * FROM cqms.v_reports WHERE scan_id = $1',
    [scanId],
  );
  return result.rows[0];
};
