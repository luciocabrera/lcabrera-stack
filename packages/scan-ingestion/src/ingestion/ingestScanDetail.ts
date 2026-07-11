import { getPool } from '@repo/data-access/db/getPool.util';

import type { FallowDetailInput } from './fallow/fallowDetail.types.ts';
import type { Report } from './report.schema.ts';

import { appGraphRawSchema } from './appGraph/appGraphRaw.schema.ts';
import { extractAppGraphNodes } from './appGraph/extractAppGraphNodes.util.ts';
import { extractAppGraphRunSummary } from './appGraph/extractAppGraphRunSummary.util.ts';
import { extractCodeSmellRunSummary } from './codeSmell/extractCodeSmellRunSummary.util.ts';
import { extractGenericDetailRows } from './extractGenericDetailRows.util.ts';
import { extractFallowCircularDependencies } from './fallow/extractFallowCircularDependencies.util.ts';
import { extractFallowCloneGroups } from './fallow/extractFallowCloneGroups.util.ts';
import { extractFallowDeadCode } from './fallow/extractFallowDeadCode.util.ts';
import { extractFallowFileScores } from './fallow/extractFallowFileScores.util.ts';
import { extractFallowFunctionFindings } from './fallow/extractFallowFunctionFindings.util.ts';
import { extractFallowHotspots } from './fallow/extractFallowHotspots.util.ts';
import { extractFallowLargeFunctions } from './fallow/extractFallowLargeFunctions.util.ts';
import { extractFallowNextSteps } from './fallow/extractFallowNextSteps.util.ts';
import { extractFallowRunSummary } from './fallow/extractFallowRunSummary.util.ts';
import { extractFallowTargets } from './fallow/extractFallowTargets.util.ts';
import { fallowRawSchema } from './fallow/fallowRaw.schema.ts';
import { eslintRawSchema } from './lint/eslintRaw.schema.ts';
import { extractEslintRunSummary } from './lint/extractEslintRunSummary.util.ts';
import { extractEslintViolations } from './lint/extractEslintViolations.util.ts';
import { extractOxlintRunSummary } from './lint/extractOxlintRunSummary.util.ts';
import { extractOxlintViolations } from './lint/extractOxlintViolations.util.ts';
import { oxlintRawSchema } from './lint/oxlintRaw.schema.ts';

type IngestScanDetailArgs = {
  /** The verbatim tool artifact — absent for the LLM scanners (report-only). */
  readonly rawJson: unknown;
  readonly report: Report;
  readonly scanId: string;
  readonly scannerId: string;
  readonly scopeValue: string;
  /** The directory the scan ran against — lint file paths are stored relative to it (ADR-028). */
  readonly targetRootPath: string;
  readonly userId: string;
};

/**
 * Per-scanner master/detail extraction dispatcher (ADR-019) — explodes a
 * scan's artifacts into the typed columnar tables AFTER
 * sp_ingest_scan_result has committed the generic layer. Internal to this
 * package: reached only through ingestReport, never exported via
 * package.json (the ARCHITECTURE.md exports footgun). The deterministic
 * scanners extract from their verbatim raw artifact (skipped when it is
 * absent); the LLM scanners (code-smell-*) have no raw artifact — their
 * master is a findings rollup from the already-validated report, and
 * their "detail" is a view over scan_findings (Step 5). ingestReport
 * wraps the call in log-and-continue: a shape drift in a future tool
 * version must never flip an already-succeeded scan to failed.
 */
export const ingestScanDetail = async ({
  rawJson,
  report,
  scanId,
  scannerId,
  scopeValue,
  targetRootPath,
  userId,
}: IngestScanDetailArgs): Promise<void> => {
  const pool = getPool();

  if (scannerId === 'code-smell-checker' || scannerId === 'code-smell-zen') {
    const master = extractCodeSmellRunSummary({ report });
    const procedure =
      scannerId === 'code-smell-checker'
        ? 'sp_ingest_code_smell_checker_detail'
        : 'sp_ingest_code_smell_zen_detail';
    await pool.query(`CALL cqms.${procedure}($1, $2, $3)`, [
      userId,
      scanId,
      JSON.stringify(master),
    ]);
    return;
  }

  if (rawJson === undefined) {
    return;
  }

  if (scannerId === 'eslint') {
    const raw = eslintRawSchema.parse(rawJson);
    const master = extractEslintRunSummary({ raw });
    const violations = extractEslintViolations({ raw, targetRootPath });
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
    const violations = extractOxlintViolations({
      raw,
      scopeValue,
      targetRootPath,
    });
    await pool.query('CALL cqms.sp_ingest_oxlint_detail($1, $2, $3, $4)', [
      userId,
      scanId,
      JSON.stringify(master),
      JSON.stringify(violations),
    ]);
    return;
  }

  if (scannerId === 'fallow') {
    const raw = fallowRawSchema.parse(rawJson);
    const master = extractFallowRunSummary({ raw });
    const detail: FallowDetailInput = {
      circular_dependencies: extractFallowCircularDependencies({ raw }),
      clone_groups: extractFallowCloneGroups({ raw }),
      dead_code: extractFallowDeadCode({ raw }),
      file_scores: extractFallowFileScores({ raw }),
      function_findings: extractFallowFunctionFindings({ raw }),
      hotspots: extractFallowHotspots({ raw }),
      large_functions: extractFallowLargeFunctions({ raw }),
      next_steps: extractFallowNextSteps({ raw }),
      targets: extractFallowTargets({ raw }),
    };
    await pool.query('CALL cqms.sp_ingest_fallow_detail($1, $2, $3, $4)', [
      userId,
      scanId,
      JSON.stringify(master),
      JSON.stringify(detail),
    ]);
    return;
  }

  if (scannerId === 'app-graph') {
    const raw = appGraphRawSchema.parse(rawJson);
    const master = extractAppGraphRunSummary({ raw });
    const nodes = extractAppGraphNodes({ raw });
    await pool.query('CALL cqms.sp_ingest_app_graph($1, $2, $3, $4)', [
      userId,
      scanId,
      JSON.stringify(master),
      JSON.stringify(nodes),
    ]);
    return;
  }

  // Registry-added scanner without a bespoke extractor (ADR-023): its raw
  // artifact's rows land in the auto-created cqms.scanner_detail_* table.
  // The procedure raises when that table does not exist (e.g. a backfill
  // over the retired 'linter') — caught by ingestReport's log-and-continue.
  const rows = extractGenericDetailRows({ rawJson });
  await pool.query('CALL cqms.sp_ingest_generic_detail($1, $2, $3)', [
    userId,
    scanId,
    JSON.stringify(rows),
  ]);
};
