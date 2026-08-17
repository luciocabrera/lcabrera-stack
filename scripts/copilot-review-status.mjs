/**
 * Publishes the `Copilot review complete` commit status for one pull request.
 *
 * Why it exists: GitHub attaches a review to the commit it reviewed and then
 * shows it the same way forever, so a pull request whose head has moved past
 * Copilot's review looks fully reviewed and is not (#671). This turns "is the
 * head reviewed?" into a status anyone — and eventually the ruleset — can read.
 *
 * Head and reviews are both read from the API at call time and the status is
 * posted against the head that read returns, never against the SHA in the event
 * payload. Two runs racing therefore agree instead of overwriting each other
 * with verdicts about different commits, and a status is never left on a commit
 * that has already been superseded.
 *
 * It also reports the findings Copilot SUPPRESSED — the ones it puts in the
 * review body instead of filing as threads, which conversation resolution
 * therefore never sees (#750). Those never move the state: they are read from
 * the reviews this already fetched, and reported (ADR-078).
 *
 * The comparison itself is `./lib/copilot-review.mjs` and the suppressed-comment
 * reader is `./lib/copilot-suppressed.mjs` (both pure, unit-tested); the gate's
 * behaviour and its break-glass path are in
 * `docs/tooling/copilot-review-gate.md`. See `.claude/rules/scripts.md`.
 *
 * Usage (from the repo root):
 *   vp run copilot-review:status -- --pr <number> [--repo <owner/name>] [--dry-run]
 *   node scripts/copilot-review-status.mjs --pr 671 --dry-run
 *
 * `--if-changed` posts only when the head does not already carry this verdict,
 * which is how the reconcile sweep (`scripts/reconcile-review-gates.mjs`) stays
 * idempotent and leaves an unreviewed pull request untouched.
 *
 * Exit codes: 0 = a state was computed, and posted unless --dry-run or
 * --if-changed withheld it; 1 = the pull request could not be read, or the
 * status could not be posted.
 */
import { appendFileSync, readFileSync } from 'node:fs';
import process from 'node:process';

import {
  flagValue,
  parsePullNumber,
  parseRepository,
} from './lib/cli-input.mjs';
import {
  copilotReviews,
  decideReviewStatus,
  STATUS_CONTEXT,
} from './lib/copilot-review.mjs';
import { fetchPullRequestReviews } from './lib/copilot-reviews-api.mjs';
import {
  suppressedLines,
  suppressedMarkdown,
  suppressedStatusNote,
  withStatusNote,
} from './lib/copilot-suppressed-report.mjs';
import { collectSuppressedComments } from './lib/copilot-suppressed.mjs';
import { errorMessage } from './lib/error-message.mjs';
import { runGh } from './lib/gh-exec.mjs';
import {
  publishedStatus,
  shouldPublishStatus,
} from './lib/review-gate-reconcile.mjs';

const USAGE =
  'usage: node scripts/copilot-review-status.mjs --pr <number> ' +
  '[--repo <owner/name>] [--dry-run] [--if-changed]';

/** The Actions event payload, or `undefined` outside Actions. */
const readEventPayload = () => {
  const path = process.env.GITHUB_EVENT_PATH;
  if (path === undefined || path === '') {
    return undefined;
  }
  return JSON.parse(readFileSync(path, 'utf8'));
};

/**
 * The review that triggered this run, when one did.
 *
 * Only a `submitted` review counts: a `dismissed` one has stopped covering
 * anything, and treating it as a fresh verdict would report a terminal failure
 * for a review that was withdrawn rather than ignored.
 */
const triggeringReviewFrom = (payload) =>
  process.env.GITHUB_EVENT_NAME === 'pull_request_review' &&
  payload?.action === 'submitted'
    ? payload.review
    : undefined;

const resolveRepository = (payload) =>
  parseRepository(
    flagValue('--repo') ??
      process.env.GITHUB_REPOSITORY ??
      payload?.repository?.full_name ??
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
 * `undefined` when nothing named a pull request — the caller prints usage for
 * that. A value that is present but not a pull request number throws instead,
 * because `#738` would otherwise become `NaN` and reach the API path as
 * `pulls/NaN`, where a bare 404 is all anyone sees.
 */
const resolvePullNumber = (payload) => {
  const raw = flagValue('--pr') ?? payload?.pull_request?.number;
  return raw === undefined ? undefined : parsePullNumber(raw);
};

/** The pull request as it stands now — not as the event payload described it. */
const fetchPullRequest = (repository, number) =>
  JSON.parse(runGh(['api', `repos/${repository}/pulls/${number}`]));

/**
 * What is published under this context on `sha` right now, or `undefined`.
 *
 * Read against the head this run resolved, never against an event payload's
 * SHA, so the comparison it feeds is about one commit.
 */
const fetchPublishedStatus = (repository, sha) =>
  publishedStatus(
    JSON.parse(
      runGh(['api', `repos/${repository}/commits/${sha}/status?per_page=100`]),
    ),
    STATUS_CONTEXT,
  );

/** The run that decided this status, so the check links to its own reasoning. */
const runUrl = () => {
  const { GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_SERVER_URL } = process.env;
  return GITHUB_RUN_ID === undefined
    ? undefined
    : `${GITHUB_SERVER_URL ?? 'https://github.com'}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
};

const postStatus = ({ description, repository, sha, state }) => {
  const target = runUrl();
  runGh([
    'api',
    '--method',
    'POST',
    `repos/${repository}/statuses/${sha}`,
    '-f',
    `state=${state}`,
    '-f',
    `context=${STATUS_CONTEXT}`,
    '-f',
    `description=${description}`,
    ...(target === undefined ? [] : ['-f', `target_url=${target}`]),
  ]);
};

/** What was read, so a `pending` status is diagnosable from the run log alone. */
const describeReviews = (reviews) =>
  `${reviews.length} review(s) on the pull request, ${copilotReviews(reviews).length} counted from Copilot`;

/** Appends the suppressed-comment report where the runner shows it, if it can. */
const writeSummary = (markdown) => {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (path === undefined || path === '') {
    return;
  }
  appendFileSync(path, `${markdown}\n`, 'utf8');
};

/** The gate's own verdict. */
const verdictLine = ({ description, state }) =>
  `${STATUS_CONTEXT}: ${state} — ${description}`;

/**
 * The suppressed comments, reported alongside the verdict but never folded into
 * it: the state stays a statement about whether Copilot reviewed the head, and
 * the findings ride in the description and the job summary. ADR-078 has the
 * reason a suppressed comment does not move a merge bar.
 *
 * Printed above the verdict, and therefore above the line that says what became
 * of the status — which is the last one, and the one the reconcile sweep records
 * as this gate's outcome for the pull request. A finding printed below them
 * would take that line's place.
 */
const reportSuppressed = (report, number) => {
  for (const line of suppressedLines(report, { pr: number })) {
    console.log(line);
  }
  if (report.state === 'found' || report.state === 'unreadable') {
    writeSummary(suppressedMarkdown(report, { pr: number }));
  }
  if (report.state === 'unreadable') {
    console.log(
      '::warning::Copilot suppressed comments could not be read — see the lines above. This does not change the review status.',
    );
  }
};

const main = () => {
  const payload = readEventPayload();
  const number = resolvePullNumber(payload);
  if (number === undefined) {
    console.error(`${USAGE}\n\nGive --pr, or run inside a pull-request event.`);
    process.exitCode = 1;
    return;
  }

  const repository = resolveRepository(payload);
  const pullRequest = fetchPullRequest(repository, number);
  const headSha = pullRequest?.head?.sha;
  if (typeof headSha !== 'string' || headSha === '') {
    console.error(
      `Could not read the head commit of ${repository}#${number} — refusing to post a status against an unknown SHA.`,
    );
    process.exitCode = 1;
    return;
  }

  const reviews = fetchPullRequestReviews(repository, number);
  const verdict = decideReviewStatus({
    headSha,
    isDraft: pullRequest.draft === true,
    reviews,
    triggeringReview: triggeringReviewFrom(payload),
  });
  const suppressed = collectSuppressedComments(reviews);
  const description = withStatusNote(
    verdict.description,
    suppressedStatusNote(suppressed),
  );
  const { state } = verdict;

  console.log(`${repository}#${number} head ${headSha}`);
  console.log(describeReviews(reviews));
  reportSuppressed(suppressed, number);
  console.log(verdictLine({ description, state }));

  if (
    process.argv.includes('--if-changed') &&
    !shouldPublishStatus({
      current: fetchPublishedStatus(repository, headSha),
      next: { description, state },
    })
  ) {
    console.log(`Unchanged on ${headSha}: nothing was posted.`);
    return;
  }
  if (process.argv.includes('--dry-run')) {
    console.log('--dry-run: nothing was posted.');
    return;
  }
  postStatus({ description, repository, sha: headSha, state });
  console.log(`Posted to ${repository}/statuses/${headSha}.`);
};

try {
  main();
} catch (error) {
  console.error(`copilot-review-status: ${errorMessage(error)}`);
  process.exitCode = 1;
}
