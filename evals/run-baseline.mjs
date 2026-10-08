#!/usr/bin/env node
/**
 * Records an A/A noise floor: runs one suite several times on the current
 * commit and model, tags each run with one baseline id, and stores the mean
 * and standard deviation per suite and subject in evals.eval_baseline, so a
 * later comparison can tell a regression from ordinary run-to-run spread.
 * Usage (from the repo root):
 *   vp run evals:baseline -- --suite <suite> [--runs <n>] [--model <id>]
 *   --runs defaults to baseline.defaultRuns in regression.config.json
 * Refuses a dirty tree, and needs EVALS_DATABASE_URL and a Claude login.
 * Exit codes: 0 = baseline written, 1 = refused or not written,
 *   130/143 = interrupted.
 */
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { probeDatabase } from '@repo/eval-history/baseline/probeDatabase.service';
import { recordBaseline } from '@repo/eval-history/baseline/recordBaseline.service';
import { loadRegressionConfig } from '@repo/eval-history/stats/loadRegressionConfig.service';

import { runGit } from '../packages/repo-standards/scripts/git-exec.mjs';

import { withoutSeparator } from './agent-sessions.mjs';
import {
  BASELINE_RUNNERS,
  runBaseline,
  runEnvironment,
  runnerArgs,
} from './baseline-command.mjs';
import { printSummary } from './run-ingest.mjs';
import { RESULTS_DIR } from './run-record.mjs';

const EVALS_DIR = dirname(fileURLToPath(import.meta.url));

const runOnce = ({ baselineId, model, suite }) =>
  spawnSync(
    process.execPath,
    [join(EVALS_DIR, BASELINE_RUNNERS[suite]), ...runnerArgs({ model })],
    { env: runEnvironment({ baselineId, env: process.env }), stdio: 'inherit' },
  );

const record = async ({ baselineId, suite }) => {
  const summary = await recordBaseline({
    baselineId,
    connectionString: process.env.EVALS_DATABASE_URL,
    paths: [join(RESULTS_DIR, suite)],
  });
  printSummary({ summary });
  return summary.exitCode;
};

const main = async () => {
  const config = await loadRegressionConfig({
    file: join(EVALS_DIR, 'regression.config.json'),
  });
  return runBaseline({
    argv: withoutSeparator(process.argv.slice(2)),
    defaultRuns: config.baseline.defaultRuns,
    effects: {
      error: (line) => console.error(line),
      gitStatus: () =>
        runGit({ args: ['status', '--porcelain'], cwd: dirname(EVALS_DIR) }),
      log: (line) => console.log(line),
      mintId: randomUUID,
      probeDatabase: () =>
        probeDatabase({ connectionString: process.env.EVALS_DATABASE_URL }),
      record,
      runOnce,
    },
  });
};

try {
  process.exitCode = await main();
} catch (error) {
  console.error(
    `evals:baseline: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
