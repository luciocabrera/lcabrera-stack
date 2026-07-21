import { getPool } from '@repo/server/db/get-pool.util';

export type ScannerUpdateInput = {
  readonly allowed_tools?: readonly string[];
  readonly command_template?: string;
  readonly config_detection?: Record<string, unknown>;
  readonly description?: string;
  readonly deterministic?: boolean;
  readonly display_name?: string;
  readonly is_active?: boolean;
  readonly raw_artifact_file_name?: string;
  readonly steps_markdown?: string;
  readonly supports_diff_scope?: boolean;
};

export type UpdateScannerResult = {
  readonly version: number;
};

type UpdateScannerArgs = {
  readonly scanner: ScannerUpdateInput;
  readonly scannerId: string;
  readonly userId: string;
};

/**
 * Updates a scanner's registry row through cqms.fn_update_scanner
 * (ADR-023): asserts 'update' on 'scanner', bumps version and snapshots
 * the new state into scanner_versions. scanner_id and skill_path are
 * immutable by design (natural key + code-owned artifact location).
 */
export const updateScanner = async ({
  scanner,
  scannerId,
  userId,
}: UpdateScannerArgs): Promise<UpdateScannerResult> => {
  const pool = getPool();
  const result = await pool.query<{ fn_update_scanner: number }>(
    'SELECT cqms.fn_update_scanner($1, $2, $3) AS fn_update_scanner',
    [userId, scannerId, JSON.stringify(scanner)],
  );

  const version = result.rows[0]?.fn_update_scanner;
  if (!version) {
    throw new Error('Failed to update scanner.');
  }
  return { version };
};
