import { closePool } from '@repo/data-access/db/getPool.util';
import path from 'node:path';

import type {
  IngestReportArgs,
  IngestReportOrigin,
} from '../ingestion/ingestReport.types.ts';

// Relative imports for same-package modules, deliberately: this file runs
// directly via `node --experimental-strip-types` (see package.json),
// outside Vite/tsc's module graph entirely — the @repo/scan-ingestion/*
// self-referencing alias only resolves through tsconfig paths (tsc) and
// vite.config.ts's resolve.alias (Vite/Vitest), neither of which plain
// `node` execution goes through. @repo/data-access works here because it's
// a genuine cross-package import resolved via a real package.json
// `exports` map, not a self-referencing alias.
import { ingestReport } from '../ingestion/ingestReport.ts';
import {
  scannerIdSchema,
  scopeTypeSchema,
} from '../ingestion/report.schema.ts';
import { getUserByUsername } from '../queries/getUserByUsername.util.ts';
import { parseCliFlags } from './parseCliFlags.util.ts';

const SYSTEM_USERNAME = 'system';

const REPORT_JSON_FILENAME = 'report.json';
const REPORT_MARKDOWN_FILENAME = 'report.md';

const printUsage = (): void => {
  console.error(
    'Usage: ingest.cli.ts --skill=<scannerId> --run-dir=<dir> --project-id=<uuid>' +
      ' [--target-root=<path>] [--scope-type=repo] [--scope-value=.] [--run-id=<uuid>]' +
      ' [--origin=interactive_session] [--triggered-by=<id>] [--raw-json=<filename>]',
  );
};

const run = async (): Promise<void> => {
  const flags = parseCliFlags(process.argv.slice(2));
  const skill = flags.skill;
  const runDir = flags['run-dir'];
  // Path-based project matching retired with ADR-028 — ad hoc ingestion
  // attaches to an existing project by id. --target-root is the directory
  // the scan ran against (lint-path relativization + git stamping only).
  const projectId = flags['project-id'];

  if (!skill || !runDir || !projectId) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  // Non-interactive actor identity (ADR-018): the CLI acts as the seeded
  // 'system' user for audit fields and permission checks.
  const systemUser = await getUserByUsername({ username: SYSTEM_USERNAME });
  if (systemUser === undefined) {
    throw new Error(
      "The seeded 'system' user was not found — run migrations first (vp run migrate).",
    );
  }

  const args: IngestReportArgs = {
    origin: (flags.origin ?? 'interactive_session') as IngestReportOrigin,
    projectId,
    rawJsonPath: flags['raw-json']
      ? path.join(runDir, flags['raw-json'])
      : undefined,
    reportJsonPath: path.join(runDir, REPORT_JSON_FILENAME),
    reportMarkdownPath: path.join(runDir, REPORT_MARKDOWN_FILENAME),
    runId: flags['run-id'],
    scannerId: scannerIdSchema.parse(skill),
    scopeType: scopeTypeSchema.parse(flags['scope-type'] ?? 'repo'),
    scopeValue: flags['scope-value'] ?? '.',
    targetRootPath: flags['target-root'] ?? process.cwd(),
    triggeredBy: flags['triggered-by'],
    userId: systemUser.id,
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
