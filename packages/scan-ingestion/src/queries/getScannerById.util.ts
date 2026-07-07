import { getPool } from '@repo/data-access/db/getPool.util';

export type ScannerRegistryRow = {
  readonly allowed_tools: null | readonly string[];
  readonly command_template: null | string;
  readonly config_detection: null | Record<string, unknown>;
  readonly description: null | string;
  readonly deterministic: boolean;
  readonly display_name: string;
  readonly is_active: boolean;
  readonly raw_artifact_file_name: null | string;
  readonly scanner_id: string;
  readonly skill_path: string;
  readonly steps_markdown: null | string;
  readonly supports_diff_scope: boolean;
  readonly version: number;
};

type GetScannerByIdArgs = {
  readonly scannerId: string;
};

/** One scanner's full registry row (ADR-023) — undefined when unknown. */
export const getScannerById = async ({
  scannerId,
}: GetScannerByIdArgs): Promise<ScannerRegistryRow | undefined> => {
  const pool = getPool();
  const result = await pool.query<ScannerRegistryRow>(
    `SELECT scanner_id, display_name, skill_path, deterministic,
            supports_diff_scope, is_active, description, command_template,
            raw_artifact_file_name, config_detection, allowed_tools,
            steps_markdown, version
     FROM cqms.v_scanners
     WHERE scanner_id = $1`,
    [scannerId],
  );
  return result.rows[0];
};
