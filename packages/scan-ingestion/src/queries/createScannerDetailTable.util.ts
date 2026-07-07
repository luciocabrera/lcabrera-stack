import { getPool } from '@repo/data-access/db/getPool.util';

export type CreateScannerDetailTableResult = {
  readonly tableName: string;
};

type CreateScannerDetailTableArgs = {
  readonly scannerId: string;
  readonly userId: string;
};

/**
 * Ensures a registered scanner's generic detail table exists via
 * cqms.fn_create_scanner_detail_table (ADR-023) — dynamic DDL with the
 * identifier sanitized to [a-z0-9_] inside the function; idempotent
 * (CREATE TABLE IF NOT EXISTS). Until a developer writes a bespoke
 * migration, sp_ingest_generic_detail lands the scanner's raw rows here.
 */
export const createScannerDetailTable = async ({
  scannerId,
  userId,
}: CreateScannerDetailTableArgs): Promise<CreateScannerDetailTableResult> => {
  const pool = getPool();
  const result = await pool.query<{ fn_create_scanner_detail_table: string }>(
    'SELECT cqms.fn_create_scanner_detail_table($1, $2) AS fn_create_scanner_detail_table',
    [userId, scannerId],
  );

  const tableName = result.rows[0]?.fn_create_scanner_detail_table;
  if (!tableName) {
    throw new Error('Failed to create the scanner detail table.');
  }
  return { tableName };
};
