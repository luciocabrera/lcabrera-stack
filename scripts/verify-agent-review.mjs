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
 *   vp run agent-review:verify -- --pr 727 [--repo owner/name]
 *   vp run agent-review:verify -- --pr 727 --dry-run --strict
 *
 * `--if-changed` posts only when the head does not already carry this
 * description, which is how the reconcile sweep
 * (`scripts/reconcile-review-gates.mjs`) stays idempotent.
 *
 * Exit codes: 0 = the check reported (advisory); 1 = this script could not read
 * the pull request. Under `--strict`, §2.3's codes: 0 pass/absent, 1 fail,
 * 2 error.
 */
import process from 'node:process';

import {
  flagValue,
  parsePullNumber,
  parseRepository,
} from '@repo/repo-standards/cli-input';
import { errorMessage } from './lib/error-message.mjs';
import { runGh } from './lib/gh-exec.mjs';
import {
  exitCodeFor,
  oneLine,
  statusDescription,
  summaryMarkdown,
} from './lib/agent-review-report.mjs';
import { validatePullRequestVerdict } from './lib/agent-review-validate.mjs';
import {
  publishedStatus,
  shouldPublishStatus,
} from './lib/review-gate-reconcile.mjs';

const STATUS_CONTEXT = 'Agent review verdict';

/**
 * Every line this gate prints goes through one of these two.
 *
 * A runner reads a `::` directive at the **start of a log line**, so any value
 * that can introduce a newline can introduce a directive — and every value
 * printed below is untrusted: the validator's messages quote the verdict
 * document, and a caught error carries `gh`'s stderr.
 *
 * Routing the writes through one pair is the point. Flattening was added to the
 * success path first and the `catch` was missed, because the fix chased the
 * reported instance instead of enumerating the sinks; a new `console.` call is
 * now the thing to notice, and
 * `scripts/lib/agent-review-workflow.test.mjs` fails on one that does not use
 * these.
 */
const printLine = (text) => {
  console.log(oneLine(text));
};

const printProblem = (text) => {
  console.error(oneLine(text));
};

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
    printProblem(
      `::warning::could not post the commit status: ${errorMessage(error)}`,
    );
  }
};

/**
 * Whether this description is worth posting over what the head already carries.
 *
 * Only consulted under `--if-changed`, which the reconcile sweep passes: a sweep
 * that re-posted an identical status every half hour would fill the timeline
 * with noise and make "the status moved" stop meaning anything.
 */
const changedOnHead = (repo, headSha, description) =>
  shouldPublishStatus({
    current: publishedStatus(
      JSON.parse(
        runGh(['api', `repos/${repo}/commits/${headSha}/status?per_page=100`]),
      ),
      STATUS_CONTEXT,
    ),
    next: { description, state: 'success' },
  });

/** Appends the summary where the runner shows it, when there is one. */
const writeSummary = async (markdown) => {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (path === undefined || path === '') {
    return;
  }
  const { appendFile } = await import('node:fs/promises');
  await appendFile(path, `${markdown}\n`, 'utf8');
};

/**
 * `--repo` first, matching `copilot-review-status.mjs`, so the reconcile sweep
 * can tell both gates which repository it listed instead of each one resolving
 * its own and agreeing by coincidence.
 */
const resolveRepo = () =>
  parseRepository(
    flagValue('--repo') ??
      process.env.GITHUB_REPOSITORY ??
      runGh([
        'repo',
        'view',
        '--json',
        'nameWithOwner',
        '--jq',
        '.nameWithOwner',
      ]),
  );

/**
 * Absent and malformed are different failures and now say different things.
 * "Pass `--pr <n>`" is the wrong advice for someone who passed `--pr '#738'` —
 * they did exactly that, and the old message sent them round the same loop.
 */
const resolvePrNumber = () => {
  const raw = flagValue('--pr') ?? process.env.PR_NUMBER;
  if (raw === undefined || String(raw).trim() === '') {
    throw new Error(
      'no pull request to check — pass `--pr <n>` or set PR_NUMBER',
    );
  }
  return parsePullNumber(raw);
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
  printLine(`${STATUS_CONTEXT}: ${description}`);
  for (const error of result.errors) {
    printLine(`  - ${error}`);
  }
  await writeSummary(summaryMarkdown(result, { headSha, pr }));
  const unchanged =
    process.argv.includes('--if-changed') &&
    !changedOnHead(repo, headSha, description);
  if (unchanged) {
    printLine(`Unchanged on ${headSha}: nothing was posted.`);
  } else if (!dryRun) {
    postStatus(repo, headSha, description);
  }
  process.exitCode = strict ? exitCodeFor(result.state) : 0;
};

try {
  await main();
} catch (error) {
  printProblem(`agent-review:verify failed: ${errorMessage(error)}`);
  process.exitCode = 1;
}
