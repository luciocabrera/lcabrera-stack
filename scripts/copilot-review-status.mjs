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
 * The comparison itself is `./lib/copilot-review.mjs` (pure, unit-tested); the
 * gate's behaviour and its break-glass path are in
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
import { readFileSync } from 'node:fs';
import process from 'node:process';

import {
  flagValue,
  parsePullNumber,
  parseRepository,
} from './lib/cli-input.mjs';
import {
  copilotReviews,
  decideReviewStatus,
  reviewsFromPages,
  STATUS_CONTEXT,
} from './lib/copilot-review.mjs';
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
 * Every review on the pull request, oldest first — all pages of them.
 *
 * Two flags earn their place. `--slurp` makes gh wrap the pages in one outer
 * array; without it gh documents each page as a separate JSON document, which
 * `JSON.parse` cannot read. `per_page` goes in the path rather than through
 * `-F`, because any field argument makes `gh api` issue a POST, and
 * `POST /pulls/{n}/reviews` opens a review instead of listing them — a read that
 * silently writes.
 */
const fetchReviews = (repository, number) =>
  reviewsFromPages(
    JSON.parse(
      runGh([
        'api',
        '--paginate',
        '--slurp',
        `repos/${repository}/pulls/${number}/reviews?per_page=100`,
      ]),
    ),
  );

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

  const reviews = fetchReviews(repository, number);
  const { description, state } = decideReviewStatus({
    headSha,
    isDraft: pullRequest.draft === true,
    reviews,
    triggeringReview: triggeringReviewFrom(payload),
  });

  console.log(`${repository}#${number} head ${headSha}`);
  console.log(describeReviews(reviews));
  console.log(`${STATUS_CONTEXT}: ${state} — ${description}`);

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
