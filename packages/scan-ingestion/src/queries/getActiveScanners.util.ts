import { getPool } from '@repo/server/db/get-pool.util';

export type ScannerRow = {
  readonly display_name: string;
  readonly scanner_id: string;
};

/** Backs the `trigger-scan` form's scanner checklist. */
export const getActiveScanners = async (): Promise<readonly ScannerRow[]> => {
  const pool = getPool();
  const result = await pool.query<ScannerRow>(
    'SELECT scanner_id, display_name FROM cqms.v_scanners WHERE is_active = true ORDER BY display_name',
  );
  return result.rows;
};
