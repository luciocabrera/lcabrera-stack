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
 * Exit codes: 0 = a state was computed, and posted unless --dry-run;
 * 1 = the pull request could not be read, or the status could not be posted.
 */
import { readFileSync } from 'node:fs';
import process from 'node:process';

import { flagValue } from './lib/cli-input.mjs';
import {
  copilotReviews,
  decideReviewStatus,
  STATUS_CONTEXT,
} from './lib/copilot-review.mjs';
import { errorMessage } from './lib/error-message.mjs';
import { runGh } from './lib/gh-exec.mjs';

const USAGE =
  'usage: node scripts/copilot-review-status.mjs --pr <number> ' +
  '[--repo <owner/name>] [--dry-run]';

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
  flagValue('--repo') ??
  process.env.GITHUB_REPOSITORY ??
  payload?.repository?.full_name ??
  runGh(['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);

const resolvePullNumber = (payload) =>
  flagValue('--pr') ?? payload?.pull_request?.number;

/** The pull request as it stands now — not as the event payload described it. */
const fetchPullRequest = (repository, number) =>
  JSON.parse(runGh(['api', `repos/${repository}/pulls/${number}`]));

/**
 * Every review on the pull request, oldest first.
 *
 * `per_page` goes in the path rather than through `-F`: any field argument makes
 * `gh api` issue a POST, and `POST /pulls/{n}/reviews` opens a review instead of
 * listing them — a read that silently writes.
 */
const fetchReviews = (repository, number) =>
  JSON.parse(
    runGh([
      'api',
      '--paginate',
      `repos/${repository}/pulls/${number}/reviews?per_page=100`,
    ]),
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
