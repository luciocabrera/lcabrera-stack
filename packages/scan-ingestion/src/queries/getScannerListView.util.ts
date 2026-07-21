import { getPool } from '@lcabrera/server/db/get-pool.util';

export type ScannerListViewRow = {
  readonly deterministic: boolean;
  readonly display_name: string;
  readonly edited_at: null | string;
  readonly is_active: boolean;
  readonly scanner_id: string;
  readonly supports_diff_scope: boolean;
  readonly version: number;
};

/** Backs the `/cqms/scanners` registry list (ADR-023). */
export const getScannerListView = async (): Promise<
  readonly ScannerListViewRow[]
> => {
  const pool = getPool();
  const result = await pool.query<ScannerListViewRow>(
    `SELECT scanner_id, display_name, deterministic, supports_diff_scope,
            is_active, version, edited_at
     FROM cqms.v_scanners
     ORDER BY display_name`,
  );
  return result.rows;
};
