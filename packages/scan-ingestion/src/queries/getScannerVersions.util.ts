import { getPool } from '@repo/server/db/get-pool.util';

export type ScannerVersionRow = {
  readonly created_at: string;
  readonly snapshot: Record<string, unknown>;
  readonly version: number;
};

type GetScannerVersionsArgs = {
  readonly scannerId: string;
};

/** A scanner's version history, newest first (ADR-023). */
export const getScannerVersions = async ({
  scannerId,
}: GetScannerVersionsArgs): Promise<readonly ScannerVersionRow[]> => {
  const pool = getPool();
  const result = await pool.query<ScannerVersionRow>(
    `SELECT version, snapshot, created_at
     FROM cqms.v_scanner_versions
     WHERE scanner_id = $1
     ORDER BY version DESC`,
    [scannerId],
  );
  return result.rows;
};
