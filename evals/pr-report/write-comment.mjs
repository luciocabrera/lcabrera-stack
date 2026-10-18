#!/usr/bin/env node
/**
 * Prints the body of a pull request's eval report comment: the PR's skill run
 * compared with main's, from the eval-history database when
 * EVALS_DATABASE_URL reaches one and from main's newest envelope artifact
 * otherwise, or the PR run alone when main has no complete run.
 * Usage (from the repo root): node evals/pr-report/write-comment.mjs
 *   --scope <none|some|all> [--skill <name> ...] [--pr-results <dir>] [--main-results <dir>]
 * Exit codes: 0 = printed, 1 = bad input.
 */
import { parseEnvelope } from '@repo/eval-history/envelope/parseEnvelope.util';
import { evalsReport } from '@repo/eval-history/report/evalsReport.service';
import { loadRegressionConfig } from '@repo/eval-history/stats/loadRegressionConfig.service';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { passRateLine } from '../run-envelope.mjs';
import { REGRESSION_CONFIG } from '../run-record.mjs';
import {
  commentBody,
  newestEnvelope,
  NO_ENVELOPE,
  NO_SUITE_RAN,
  selectionLine,
  selectionOf,
} from './comment-body.mjs';

const SUITE = 'skills';

const OPTIONS = {
  'main-results': { type: 'string' },
  'pr-results': { type: 'string' },
  scope: { type: 'string' },
  skill: { default: [], multiple: true, type: 'string' },
};

const readCandidate = (file) => {
  try {
    const parsed = parseEnvelope(JSON.parse(readFileSync(file, 'utf8')));
    return parsed.ok ? [{ envelope: parsed.envelope, file }] : [];
  } catch {
    return [];
  }
};

const envelopesIn = (directory) => {
  const suiteDirectory =
    directory === undefined ? undefined : join(directory, SUITE);
  return suiteDirectory === undefined || !existsSync(suiteDirectory)
    ? []
    : readdirSync(suiteDirectory)
        .filter((name) => name.endsWith('.json'))
        .flatMap((name) => readCandidate(join(suiteDirectory, name)));
};

const reportText = ({ exitCode, stderr, stdout }) =>
  [...stdout, ...stderr].join('\n\n') ||
  `evals:report exited ${String(exitCode)} with no output.`;

const databaseRunIds = async (args) => {
  const result = await evalsReport({ ...args, json: true });
  if (result.exitCode !== 0) {
    return [];
  }
  const { comparisons } = JSON.parse(result.stdout[0] ?? '{}');
  return (comparisons ?? []).map(({ b }) => b?.runId);
};

const fromDatabase = async ({ pr, report }) => {
  const args = {
    ...report,
    branch: pr.envelope.run.branch,
    compare: 'main',
    connectionString: process.env.EVALS_DATABASE_URL,
    suite: SUITE,
  };
  const runIds = await databaseRunIds(args);
  if (
    runIds.length === 0 ||
    runIds.some((id) => id !== pr.envelope.run.run_id)
  ) {
    return;
  }
  return [
    'Compared with the newest complete main run in the eval-history database.',
    reportText(await evalsReport({ ...args, json: false })),
  ];
};

const fromArtifact = async ({ base, pr, report }) => {
  if (base === undefined) {
    return [
      `No complete ${SUITE} run from main was found, in the database or as an \`eval-envelopes-${SUITE}\` artifact, so this is the pull request's run alone.`,
      passRateLine({
        regressionConfig: report.thresholds,
        totals: pr.envelope.run.totals,
      }),
    ];
  }
  return [
    `Compared with main's run \`${base.envelope.run.run_id}\`, from its newest \`eval-envelopes-${SUITE}\` artifact.`,
    reportText(await evalsReport({ ...report, a: base.file, b: pr.file })),
  ];
};

const storedReport = ({ pr, report }) =>
  process.env.EVALS_DATABASE_URL && pr.envelope.run.status === 'complete'
    ? fromDatabase({ pr, report })
    : undefined;

const artifactReport = ({ pr, report, values }) =>
  fromArtifact({
    base: newestEnvelope({
      candidates: envelopesIn(values['main-results']),
      completeOnly: true,
    }),
    pr,
    report,
  });

const reportSections = async ({ selection, values }) => {
  const pr = newestEnvelope({
    candidates: envelopesIn(values['pr-results']),
    completeOnly: false,
  });
  if (pr === undefined) {
    return [NO_ENVELOPE];
  }
  const report = {
    allowModelChange: false,
    json: false,
    subjects: selection.skills,
    thresholds: await loadRegressionConfig({ file: REGRESSION_CONFIG }),
  };
  return (
    (await storedReport({ pr, report })) ??
    artifactReport({ pr, report, values })
  );
};

const sectionsFor = async ({ selection, values }) =>
  selection.scope === 'none'
    ? [NO_SUITE_RAN]
    : [
        selectionLine(selection),
        ...(await reportSections({ selection, values })),
      ];

const main = async () => {
  const { values } = parseArgs({ options: OPTIONS });
  const selection = selectionOf(values);
  process.stdout.write(commentBody(await sectionsFor({ selection, values })));
};

try {
  await main();
} catch (error) {
  console.error(
    `write-comment: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
