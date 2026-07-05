import { join } from 'node:path';

import { closePool } from '@repo/data-access/db/getPool.util';

// Relative imports for same-package modules, deliberately: this file runs
// directly via `node --experimental-strip-types` (see package.json),
// outside Vite/tsc's module graph entirely — the @repo/scan-ingestion/*
// self-referencing alias only resolves through tsconfig paths (tsc) and
// vite.config.ts's resolve.alias (Vite/Vitest), neither of which plain
// `node` execution goes through. @repo/data-access works here because it's
// a genuine cross-package import resolved via a real package.json
// `exports` map, not a self-referencing alias.
import { ingestReport } from '../ingestion/ingestReport.ts';
import type {
  IngestReportArgs,
  IngestReportOrigin,
} from '../ingestion/ingestReport.types.ts';
import {
  scannerIdSchema,
  scopeTypeSchema,
} from '../ingestion/report.schema.ts';

const REPORT_JSON_FILENAME = 'report.json';
const REPORT_MARKDOWN_FILENAME = 'report.md';

const parseArgs = (argv: readonly string[]): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match?.[1] && match[2] !== undefined) {
      result[match[1]] = match[2];
    }
  }

  return result;
};

const printUsage = (): void => {
  console.error(
    'Usage: ingest.cli.ts --skill=<scannerId> --run-dir=<dir> --local-path=<path>' +
      ' [--scope-type=repo] [--scope-value=.] [--run-id=<uuid>]' +
      ' [--origin=interactive_session] [--triggered-by=<id>] [--raw-json=<filename>]',
  );
};

const run = async (): Promise<void> => {
  const flags = parseArgs(process.argv.slice(2));
  const skill = flags.skill;
  const runDir = flags['run-dir'];
  const localPath = flags['local-path'];

  if (!skill || !runDir || !localPath) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const args: IngestReportArgs = {
    localPath,
    origin: (flags.origin ?? 'interactive_session') as IngestReportOrigin,
    rawJsonPath: flags['raw-json']
      ? join(runDir, flags['raw-json'])
      : undefined,
    reportJsonPath: join(runDir, REPORT_JSON_FILENAME),
    reportMarkdownPath: join(runDir, REPORT_MARKDOWN_FILENAME),
    runId: flags['run-id'],
    scannerId: scannerIdSchema.parse(skill),
    scopeType: scopeTypeSchema.parse(flags['scope-type'] ?? 'repo'),
    scopeValue: flags['scope-value'] ?? '.',
    triggeredBy: flags['triggered-by'],
  };

  const result = await ingestReport(args);

  console.warn(
    `✅ Ingested ${result.findingsIngested} findings — project=${result.projectId} run=${result.runId} scan=${result.scanId}`,
  );
};

try {
  await run();
} catch (error: unknown) {
  console.error('❌ Ingestion failed:', error);
  process.exitCode = 1;
} finally {
  await closePool();
}
