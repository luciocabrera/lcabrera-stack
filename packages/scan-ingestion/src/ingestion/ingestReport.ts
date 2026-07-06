import { getPool } from '@repo/data-access/db/getPool.util';
import path from 'node:path';

import type {
  IngestReportArgs,
  IngestReportResult,
} from './ingestReport.types.ts';

// @repo/data-access (unlike this package's own self-referencing alias) is a
// genuine cross-package import — resolved via a real package.json `exports`
// map + workspace node_modules symlink, which plain `node`'s ESM resolver
// understands natively, same as any real npm dependency. That's what makes
// it safe to use here even though this module is transitively loaded by
// src/cli/ingest.cli.ts (plain `node --experimental-strip-types`).
import { readTextFileWithin } from '../fs/readTextFileWithin.util.ts';
import { buildFileInventory } from './buildFileInventory.util.ts';
import { ingestScanDetail } from './ingestScanDetail.ts';
import { reportSchema } from './report.schema.ts';
import { resolveScan } from './resolveScan.util.ts';

const SCOPES_WITH_FILE_INVENTORY = new Set(['folder', 'repo']);

/**
 * Thin validate-then-call wrapper (TECH_SPEC §2.3a/§2.4) — Zod-parses
 * report.json off disk, resolves/creates the run+scan, then delegates the
 * actual multi-table write to sp_ingest_scan_result. No hand-assembled
 * multi-INSERT transaction logic lives in TypeScript.
 */
export const ingestReport = async (
  args: IngestReportArgs,
): Promise<IngestReportResult> => {
  const pool = getPool();

  // All three report artifacts are produced into (and validated against) the
  // same run directory — the directory containing report.json.
  const reportDirectory = path.dirname(args.reportJsonPath);
  const rawReportJson: unknown = JSON.parse(
    readTextFileWithin({
      baseDirectory: reportDirectory,
      targetPath: args.reportJsonPath,
    }),
  );
  const report = reportSchema.parse(rawReportJson);
  const reportMarkdown = readTextFileWithin({
    baseDirectory: reportDirectory,
    targetPath: args.reportMarkdownPath,
  });
  const rawJson = args.rawJsonPath
    ? (JSON.parse(
        readTextFileWithin({
          baseDirectory: reportDirectory,
          targetPath: args.rawJsonPath,
        }),
      ) as unknown)
    : undefined;

  const { projectId, runId, scanId } = await resolveScan({
    ingestArgs: args,
    pool,
  });

  if (rawJson !== undefined || report.health_metrics) {
    // pg serializes undefined parameters as SQL NULL (pg prepareValue).
    await pool.query('SELECT cqms.fn_set_scan_raw_artifacts($1, $2, $3, $4)', [
      args.userId,
      scanId,
      rawJson,
      report.health_metrics,
    ]);
  }

  const fileInventory = SCOPES_WITH_FILE_INVENTORY.has(args.scopeType)
    ? buildFileInventory({ rootPath: args.localPath })
    : undefined;

  await pool.query(
    'CALL cqms.sp_ingest_scan_result($1, $2, $3, $4, $5, $6, $7, $8)',
    [
      args.userId,
      scanId,
      runId,
      reportMarkdown,
      JSON.stringify(rawReportJson),
      JSON.stringify({
        blocker_count: report.blocker_count,
        files_analyzed: report.files_analyzed,
        generated_at: report.generated_at,
        high_count: report.high_count,
        low_count: report.low_count,
        medium_count: report.medium_count,
        nit_count: report.nit_count,
        report_id: report.report_id,
        // Omitted when undefined — jsonb_to_record yields SQL NULL for
        // absent keys, same as an explicit JSON null.
        top_risk: report.top_risk,
      }),
      JSON.stringify(report.findings),
      // undefined is serialized as SQL NULL by pg (prepareValue).
      fileInventory ? JSON.stringify(fileInventory) : undefined,
    ],
  );

  try {
    // Unconditional since Step 5: the LLM scanners have no raw artifact —
    // their master rolls up the already-validated report; the dispatcher
    // skips raw-based extraction itself when rawJson is absent.
    await ingestScanDetail({
      localPath: args.localPath,
      rawJson,
      report,
      scanId,
      scannerId: args.scannerId,
      scopeValue: args.scopeValue,
      userId: args.userId,
    });
  } catch (error) {
    // Log-and-continue (ADR-019): the generic layer (report + findings)
    // is already committed and the scan already succeeded — a raw-shape
    // drift in a future tool version must not flip it to failed.
    console.warn(
      `⚠️  Detail extraction failed for ${args.scannerId} scan ${scanId} (generic ingestion already succeeded):`,
      error,
    );
  }

  return {
    findingsIngested: report.findings.length,
    projectId,
    reportId: report.report_id,
    runId,
    scanId,
  };
};
