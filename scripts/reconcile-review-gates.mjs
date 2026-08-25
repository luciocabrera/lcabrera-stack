/**
 * Republishes every review-gate commit status for every open pull request.
 *
 * Why it exists: each gate recomputes from an event, and the events they need
 * are not delivered reliably here — a Copilot review usually creates no workflow
 * run at all, and the agent-review verdict arrives as a bot-authored comment,
 * the same class. A status nobody recomputed is indistinguishable from one that
 * is honestly still waiting (#737). This is the recompute path that does not
 * depend on the event that failed.
 *
 * It holds nothing open and carries no SHA across an I/O boundary: it hands each
 * gate a pull request NUMBER, and the gate reads the head and the reviews
 * together and posts against the head it read. The decisions are pure in
 * `./lib/review-gate-reconcile.mjs`; the interval, the failure behaviour and the
 * recovery are in `docs/tooling/review-gate-reconcile.md`.
 *
 * Usage (from the repo root):
 *   vp run review-gates:reconcile
 *   vp run review-gates:reconcile -- --pr 738 --dry-run
 *   vp run review-gates:reconcile -- --repo owner/name
 *
 * Exit codes: 0 = every gate run reported or deliberately withheld; 1 = the
 * pull requests could not be listed, or at least one gate run failed. It never
 * exits 0 on a sweep that could not do its work — a reconcile that goes quiet is
 * the one failure nobody would notice.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  flagValue,
  parsePullNumber,
  parseRepository,
} from '../packages/repo-standards/scripts/cli-input.mjs';
import { errorMessage } from '../packages/repo-standards/scripts/error-message.mjs';
import { runGh } from './lib/gh-exec.mjs';
import {
  completeFileList,
  gateArgs,
  gateClosure,
  openPullRequestNumbers,
  outcomeLine,
  sweepSummary,
  withheldResult,
} from './lib/review-gate-reconcile.mjs';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(SCRIPTS_DIR);

/**
 * This driver's own repo-relative path. Derived, not written down: it goes into
 * every gate's closure, and a literal would stop matching on a rename — which
 * looks exactly like a healthy sweep.
 */
const DRIVER_MODULE = relative(REPO_ROOT, fileURLToPath(import.meta.url));

/** One repo-relative module's source, or `undefined` when there is none. */
const readRepoModule = (path) => {
  try {
    return readFileSync(join(REPO_ROOT, path), 'utf8');
  } catch {
    return undefined;
  }
};

/**
 * The files one pull request changes, repo-relative, or `undefined` when they
 * could not be read — which the caller withholds on, rather than publishing as
 * though it had checked. Caught, not thrown: this runs per pull request, so one
 * transient error would otherwise abandon every pull request after it.
 */
const fetchChangedFiles = ({ number, repository }) => {
  try {
    // Read before the list, so a push landing between the two shows up as more
    // files than expected — the direction `completeFileList` does not alarm on.
    const expected = runGh([
      'api',
      `repos/${repository}/pulls/${number}`,
      '--jq',
      '.changed_files',
    ]);
    // `--jq`, not a payload parse: every entry carries its `patch`, and this is
    // the only call here whose size scales with diff content against `runGh`'s
    // 8 MB cap. Overflowing it reads as "could not tell".
    const filenames = runGh([
      'api',
      '--paginate',
      '--jq',
      '.[].filename',
      `repos/${repository}/pulls/${number}/files?per_page=100`,
    ])
      .split('\n')
      .map((filename) => filename.trim())
      .filter((filename) => filename !== '');
    return completeFileList({ expected, filenames });
  } catch (error) {
    console.error(
      `::warning::could not read the files changed by #${number}: ${errorMessage(error)}`,
    );
    return undefined;
  }
};

/**
 * The gates this sweep republishes, named by gate rather than by the status
 * context each one publishes. The context strings have exactly one definition
 * apiece, inside those scripts, and a second copy here would be free to drift
 * from the ruleset name that has to match it.
 */
const GATES = [
  // `protectSuccess` says this gate has ANOTHER publisher, so a `success` on the
  // head may have come from better-informed code than this sweep is running (#868).
  // Only true where a workflow also runs the gate: `copilot-review-gate.yml` runs
  // this one on events. `verify-review-threads.mjs` is invoked by nothing else, so
  // the sweep is its only publisher AND its verdict legitimately changes under a
  // fixed head — it must keep its downgrade.
  {
    name: 'copilot-review',
    protectSuccess: true,
    script: 'copilot-review-status.mjs',
  },
  { name: 'agent-review', script: 'verify-agent-review.mjs' },
  { name: 'review-threads', script: 'verify-review-threads.mjs' },
];

/**
 * Each gate paired with the modules it would execute, resolved from this
 * checkout — the default branch when the schedule runs it. That is the point:
 * the closure is the code THIS sweep runs, this file included.
 */
const gatesWithClosures = () =>
  GATES.map((gate) => ({
    ...gate,
    closure: gateClosure({
      driverEntry: DRIVER_MODULE,
      entry: `scripts/${gate.script}`,
      readFile: readRepoModule,
    }),
  }));

const resolveRepository = () =>
  flagValue('--repo') ??
  process.env.GITHUB_REPOSITORY ??
  runGh(['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);

/**
 * Every open pull request, oldest number first.
 *
 * An empty list is a legitimate answer and a failure to read is not: `runGh`
 * throws on a non-zero `gh`, so an unreachable API reaches the top-level catch
 * rather than passing through here as "nothing to do".
 */
const fetchOpenPullRequests = (repository) =>
  openPullRequestNumbers(
    JSON.parse(
      runGh([
        'api',
        '--paginate',
        '--slurp',
        `repos/${repository}/pulls?state=open&per_page=100`,
      ]),
    ),
  );

/**
 * Runs one gate script for one pull request, capturing whatever it printed.
 *
 * The argv is built by `gateArgs`, not here, because two of its entries are
 * load-bearing and neither is visible in the effect: `--if-changed` is the whole
 * of the sweep's idempotence, and `--repo` is what stops a gate resolving a
 * different repository from the one the sweep listed. Both are unit-tested there.
 */
const runGate = ({ extraArgs, gate, number, repository }) => {
  const args = gateArgs({
    extraArgs,
    number,
    protectSuccess: gate.protectSuccess === true,
    repository,
    script: join(SCRIPTS_DIR, gate.script),
  });
  try {
    const output = execFileSync(process.execPath, args, {
      encoding: 'utf8',
      // The gate scripts append their own job summary when they see this. The
      // sweep writes one report for the whole run instead, so it is withheld.
      env: { ...process.env, GITHUB_STEP_SUMMARY: '' },
      maxBuffer: 8 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { gate: gate.name, number, ok: true, output: lastLine(output) };
  } catch (error) {
    const detail = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.trim();
    return {
      gate: gate.name,
      number,
      ok: false,
      output: lastLine(detail) || errorMessage(error),
    };
  }
};

/** A gate's verdict is its last line; the lines above it are what it read. */
const lastLine = (text) => {
  const lines = String(text)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
  return lines.at(-1) ?? '';
};

/** Appends the report where the runner shows it, when there is one. */
const writeSummary = (markdown) => {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (path === undefined || path === '') {
    return;
  }
  appendFileSync(path, `${markdown}\n`, 'utf8');
};

/** The swept pull requests, named, or `none` — the count alone hides which. */
const sweptList = (pullRequests) =>
  pullRequests.length === 0
    ? 'none'
    : pullRequests.map((number) => `#${number}`).join(', ');

const summaryMarkdown = ({ pullRequests, repository, results, text }) =>
  [
    '### Review gate reconcile',
    '',
    `Repository: \`${repository}\``,
    `Pull requests swept: ${sweptList(pullRequests)}`,
    '',
    ...results.map((result) => `- ${outcomeLine(result)}`),
    '',
    text,
  ].join('\n');

const main = () => {
  const extraArgs = process.argv.includes('--dry-run') ? ['--dry-run'] : [];
  // Both parse before anything is read or published, so a bad argument costs one
  // message rather than a sweep's worth of 404s that never mention the input.
  const repository = parseRepository(resolveRepository());
  const only = flagValue('--pr');
  const pullRequests =
    only === undefined
      ? fetchOpenPullRequests(repository)
      : [parsePullNumber(only)];

  console.log(
    `Reconciling ${pullRequests.length} pull request(s) in ${repository}.`,
  );
  const gates = gatesWithClosures();
  const results = pullRequests.flatMap((number) => {
    const changedFiles = fetchChangedFiles({ number, repository });
    return gates.map((gate) => {
      const result =
        withheldResult({ changedFiles, gate, number }) ??
        runGate({
          extraArgs,
          gate,
          number,
          repository,
        });
      console.log(outcomeLine(result));
      return result;
    });
  });

  const { failures, text } = sweepSummary({ pullRequests, results });
  console.log(text);
  writeSummary(summaryMarkdown({ pullRequests, repository, results, text }));
  if (failures.length > 0) {
    console.error(
      `::error::${failures.length} review-gate reconcile run(s) failed; those statuses were not corrected.`,
    );
    process.exitCode = 1;
  }
};

try {
  main();
} catch (error) {
  console.error(
    `::error::review-gates:reconcile failed: ${errorMessage(error)}`,
  );
  process.exitCode = 1;
}
