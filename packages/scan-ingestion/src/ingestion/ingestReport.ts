import { readFileSync } from 'node:fs';

import { getPool } from '@repo/data-access/db/getPool.util';

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
import { buildFileInventory } from './buildFileInventory.util.ts';
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

  const rawReportJson: unknown = JSON.parse(
    readFileSync(args.reportJsonPath, 'utf8'),
  );
  const report = reportSchema.parse(rawReportJson);
  const reportMarkdown = readFileSync(args.reportMarkdownPath, 'utf8');
  const rawJson = args.rawJsonPath
    ? (JSON.parse(readFileSync(args.rawJsonPath, 'utf8')) as unknown)
    : undefined;

  const { projectId, runId, scanId } = await resolveScan(pool, args);

  if (rawJson !== undefined || report.health_metrics) {
    await pool.query(
      'UPDATE cqms.scans SET raw_json = $1, health_metrics = $2 WHERE id = $3',
      [rawJson ?? null, report.health_metrics ?? null, scanId],
    );
  }

  const fileInventory = SCOPES_WITH_FILE_INVENTORY.has(args.scopeType)
    ? buildFileInventory({ rootPath: args.localPath })
    : null;

  await pool.query(
    'CALL cqms.sp_ingest_scan_result($1, $2, $3, $4, $5, $6, $7)',
    [
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
        top_risk: report.top_risk ?? null,
      }),
      JSON.stringify(report.findings),
      fileInventory ? JSON.stringify(fileInventory) : null,
    ],
  );

  return {
    findingsIngested: report.findings.length,
    projectId,
    reportId: report.report_id,
    runId,
    scanId,
  };
};
