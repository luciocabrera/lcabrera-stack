#!/usr/bin/env node
/**
 * Answers "did this change make things better or worse": compares two eval
 * runs and prints the tasks that flipped, the pass rates with n and their
 * Wilson interval, cost and duration, and which input hashes changed.
 * Usage (from the repo root):
 *   vp run evals:report -- --compare main [--suite <suite>] [--branch <name>]
 *   vp run evals:report -- --a <run id or envelope file> --b <run id or envelope file>
 *   [--json] prints the comparison as JSON instead of markdown
 *   [--allow-model-change] compares runs of two different models
 * Exit codes: 0 = compared, 1 = refused (a model change) or bad input.
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { evalsReport } from '@repo/eval-history/report/evalsReport.service';
import { loadRegressionConfig } from '@repo/eval-history/stats/loadRegressionConfig.service';

import { runGit } from '../packages/repo-standards/scripts/git-exec.mjs';

import { withoutSeparator } from './agent-sessions.mjs';
import { branchOf } from './run-envelope.mjs';
import { REGRESSION_CONFIG } from './run-record.mjs';
import { runSummaryCommand } from './summary-command.mjs';

const OPTIONS = {
  a: { type: 'string' },
  'allow-model-change': { default: false, type: 'boolean' },
  b: { type: 'string' },
  branch: { type: 'string' },
  compare: { type: 'string' },
  json: { default: false, type: 'boolean' },
  suite: { type: 'string' },
};

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const currentBranch = () =>
  branchOf({
    env: process.env,
    head: runGit({
      args: ['rev-parse', '--abbrev-ref', 'HEAD'],
      cwd: REPO_ROOT,
    }),
  });

const summarize = async () => {
  const { values } = parseArgs({
    args: withoutSeparator(process.argv.slice(2)),
    options: OPTIONS,
  });
  return evalsReport({
    a: values.a,
    allowModelChange: values['allow-model-change'],
    b: values.b,
    branch: values.branch ?? currentBranch(),
    compare: values.compare,
    connectionString: process.env.EVALS_DATABASE_URL,
    json: values.json,
    suite: values.suite,
    thresholds: await loadRegressionConfig({ file: REGRESSION_CONFIG }),
  });
};

await runSummaryCommand({ name: 'evals:report', summarize });
