import { getPool } from '@repo/data-access/db/getPool.util';

import { eslintRawSchema } from './lint/eslintRaw.schema.ts';
import { extractEslintRunSummary } from './lint/extractEslintRunSummary.util.ts';
import { extractEslintViolations } from './lint/extractEslintViolations.util.ts';
import { extractOxlintRunSummary } from './lint/extractOxlintRunSummary.util.ts';
import { extractOxlintViolations } from './lint/extractOxlintViolations.util.ts';
import { oxlintRawSchema } from './lint/oxlintRaw.schema.ts';

type IngestScanDetailArgs = {
  readonly localPath: string;
  readonly rawJson: unknown;
  readonly scanId: string;
  readonly scannerId: string;
  readonly scopeValue: string;
  readonly userId: string;
};

/**
 * Per-scanner master/detail extraction dispatcher (ADR-019) — explodes a
 * scan's verbatim raw artifact into the typed columnar tables AFTER
 * sp_ingest_scan_result has committed the generic layer. Internal to this
 * package: reached only through ingestReport, never exported via
 * package.json (the ARCHITECTURE.md exports footgun). Scanners without a
 * detail pipeline (code-smell-*) are a silent no-op here. ingestReport
 * wraps the call in log-and-continue: a raw-shape drift in a future tool
 * version must never flip an already-succeeded scan to failed.
 */
export const ingestScanDetail = async ({
  localPath,
  rawJson,
  scanId,
  scannerId,
  scopeValue,
  userId,
}: IngestScanDetailArgs): Promise<void> => {
  const pool = getPool();

  if (scannerId === 'eslint') {
    const raw = eslintRawSchema.parse(rawJson);
    const master = extractEslintRunSummary({ raw });
    const violations = extractEslintViolations({ localPath, raw });
    await pool.query('CALL cqms.sp_ingest_eslint_detail($1, $2, $3, $4)', [
      userId,
      scanId,
      JSON.stringify(master),
      JSON.stringify(violations),
    ]);
    return;
  }

  if (scannerId === 'oxlint') {
    const raw = oxlintRawSchema.parse(rawJson);
    const master = extractOxlintRunSummary({ raw });
    const violations = extractOxlintViolations({ localPath, raw, scopeValue });
    await pool.query('CALL cqms.sp_ingest_oxlint_detail($1, $2, $3, $4)', [
      userId,
      scanId,
      JSON.stringify(master),
      JSON.stringify(violations),
    ]);
  }
};
