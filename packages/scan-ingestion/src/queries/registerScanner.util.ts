import { getPool } from '@repo/server/db/get-pool.util';

export type RegisterScannerResult = {
  readonly scannerId: string;
};

export type ScannerRegistrationInput = {
  readonly allowed_tools?: readonly string[];
  readonly command_template?: string;
  readonly config_detection?: Record<string, unknown>;
  readonly description?: string;
  readonly deterministic: boolean;
  readonly display_name: string;
  readonly is_active?: boolean;
  readonly raw_artifact_file_name?: string;
  readonly scanner_id: string;
  readonly steps_markdown?: string;
  readonly supports_diff_scope?: boolean;
};

type RegisterScannerArgs = {
  readonly scanner: ScannerRegistrationInput;
  readonly userId: string;
};

/**
 * Registers a new scanner through cqms.fn_register_scanner (ADR-023):
 * asserts 'create' on 'scanner' (admin-only per the 0008 seeds), validates
 * the id format, inserts the registry row at version 1 and snapshots it
 * into scanner_versions. Typed rejections (duplicate id, bad format,
 * missing permission) surface as thrown errors for the action to render.
 */
export const registerScanner = async ({
  scanner,
  userId,
}: RegisterScannerArgs): Promise<RegisterScannerResult> => {
  const pool = getPool();
  const result = await pool.query<{ fn_register_scanner: string }>(
    'SELECT cqms.fn_register_scanner($1, $2) AS fn_register_scanner',
    [userId, JSON.stringify(scanner)],
  );

  const scannerId = result.rows[0]?.fn_register_scanner;
  if (!scannerId) {
    throw new Error('Failed to register scanner.');
  }
  return { scannerId };
};
