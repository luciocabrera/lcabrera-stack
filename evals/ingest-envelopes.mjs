#!/usr/bin/env node
/**
 * Loads run envelopes into the eval-history database, one transaction per run
 * keyed on run_id, so ingesting a file twice changes nothing. This is how a
 * run that could not reach the database, or a CI artifact, reaches history.
 * Usage (from the repo root): vp run evals:ingest [-- <file or directory> ...]
 *   with no path it reads .tmp/eval-results/
 *   [--quiet-unreachable]  an unset or unreachable database warns and exits 0
 * Exit codes: 0 = every envelope stored or already present, 1 = otherwise.
 */
import { existsSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { ingestPaths } from '@repo/eval-history/ingest/ingestPaths.service';

import { withoutSeparator } from './agent-sessions.mjs';
import { printSummary } from './run-ingest.mjs';
import { RESULTS_DIR } from './run-record.mjs';

const defaultPaths = () => (existsSync(RESULTS_DIR) ? [RESULTS_DIR] : []);

const { positionals, values } = parseArgs({
  allowPositionals: true,
  args: withoutSeparator(process.argv.slice(2)),
  options: { 'quiet-unreachable': { default: false, type: 'boolean' } },
});

try {
  const summary = await ingestPaths({
    connectionString: process.env.EVALS_DATABASE_URL,
    paths: positionals.length === 0 ? defaultPaths() : positionals,
    quietUnreachable: values['quiet-unreachable'],
  });
  printSummary({ summary });
  process.exitCode = summary.exitCode;
} catch (error) {
  console.error(
    `evals:ingest: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
