/**
 * Validates the agent-review verdict posted for a pull request's current head.
 *
 * Nothing in this repository can tell a reviewed pull request from an unreviewed
 * one: the repo-aware review runs locally under `/epic` and `/refactor-verified`
 * and leaves prose no check reads. This gate reads the verdict that review
 * emits, validates it against `docs/agents/agent-review-contract.md` §2.4 —
 * including §2.5's binding to the current head — and reports one of `pass`,
 * `fail`, `error` or `absent`. It runs no model: the producer emits a document,
 * and the conclusion is decided by this deterministic step, which is what makes
 * the gate testable.
 *
 * It never repairs a verdict (§2.4) and, while the check is advisory, it never
 * blocks: the commit status is always `success` and the state lives in the
 * description. Promotion is issue #698. `--strict` maps the state to §2.3's exit
 * codes instead, for a local run.
 *
 * Usage (from the repo root):
 *   vp run agent-review:verify -- --pr 727
 *   vp run agent-review:verify -- --pr 727 --dry-run --strict
 *
 * Exit codes: 0 = the check reported (advisory); 1 = this script could not read
 * the pull request. Under `--strict`, §2.3's codes: 0 pass/absent, 1 fail,
 * 2 error.
 */
import process from 'node:process';

import { flagValue } from './lib/cli-input.mjs';
import { errorMessage } from './lib/error-message.mjs';
import { runGh } from './lib/gh-exec.mjs';
import {
  exitCodeFor,
  statusDescription,
  summaryMarkdown,
} from './lib/agent-review-report.mjs';
import { validatePullRequestVerdict } from './lib/agent-review-validate.mjs';

const STATUS_CONTEXT = 'Agent review verdict';

/** Runs `gh api --paginate --jq`, whose output is one JSON value per line. */
const ghJsonLines = (path, jq) =>
  runGh(['api', '--paginate', path, '--jq', jq])
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line));

const readPullRequest = (repo, pr) =>
  JSON.parse(
    runGh([
      'api',
      `repos/${repo}/pulls/${pr}`,
      '--jq',
      '{headSha: .head.sha, draft: .draft}',
    ]),
  );

const readComments = (repo, pr) =>
  ghJsonLines(
    `repos/${repo}/issues/${pr}/comments`,
    '.[] | {body: .body, html_url: .html_url}',
  );

const readFiles = (repo, pr) =>
  ghJsonLines(
    `repos/${repo}/pulls/${pr}/files`,
    '.[] | {filename: .filename, patch: .patch, changes: .changes}',
  );

/**
 * Publishes the state as a commit status.
 *
 * The state is pinned to `success` during the advisory period — this check
 * cannot be the reason a merge is refused, and #698 is where that changes. A
 * token without `statuses: write` (a fork's pull request) is a warning, not a
 * failure: the state is already in the log and the job summary.
 */
const postStatus = (repo, headSha, description) => {
  const target = process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL ?? 'https://github.com'}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : undefined;
  try {
    runGh([
      'api',
      '-X',
      'POST',
      `repos/${repo}/statuses/${headSha}`,
      '-f',
      'state=success',
      '-f',
      `context=${STATUS_CONTEXT}`,
      '-f',
      `description=${description}`,
      ...(target ? ['-f', `target_url=${target}`] : []),
    ]);
  } catch (error) {
    console.error(
      `::warning::could not post the commit status: ${errorMessage(error)}`,
    );
  }
};

/** Appends the summary where the runner shows it, when there is one. */
const writeSummary = async (markdown) => {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (path === undefined || path === '') {
    return;
  }
  const { appendFile } = await import('node:fs/promises');
  await appendFile(path, `${markdown}\n`, 'utf8');
};

const resolveRepo = () =>
  process.env.GITHUB_REPOSITORY ??
  runGh(['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);

const resolvePrNumber = () => {
  const raw = flagValue('--pr') ?? process.env.PR_NUMBER;
  const pr = Number(raw);
  if (!Number.isInteger(pr) || pr < 1) {
    throw new Error(
      'no pull request to check — pass `--pr <n>` or set PR_NUMBER',
    );
  }
  return pr;
};

const main = async () => {
  const strict = process.argv.includes('--strict');
  const dryRun = process.argv.includes('--dry-run');
  const repo = resolveRepo();
  const pr = resolvePrNumber();
  const { headSha } = readPullRequest(repo, pr);

  const result = validatePullRequestVerdict({
    comments: readComments(repo, pr),
    files: readFiles(repo, pr),
    headSha,
    pr,
  });

  const description = statusDescription(result);
  console.log(`${STATUS_CONTEXT}: ${description}`);
  for (const error of result.errors) {
    console.log(`  - ${error}`);
  }
  await writeSummary(summaryMarkdown(result, { headSha, pr }));
  if (!dryRun) {
    postStatus(repo, headSha, description);
  }
  process.exitCode = strict ? exitCodeFor(result.state) : 0;
};

try {
  await main();
} catch (error) {
  console.error(`agent-review:verify failed: ${errorMessage(error)}`);
  process.exitCode = 1;
}
