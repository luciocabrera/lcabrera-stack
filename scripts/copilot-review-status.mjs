/**
 * Publishes the `Copilot review complete` commit status for one pull request.
 *
 * Why it exists: GitHub attaches a review to the commit it reviewed and then
 * shows it the same way forever, so a pull request whose head has moved past
 * Copilot's review looks fully reviewed and is not (#671). This turns "is the
 * head reviewed?" into a status anyone can read — and, since the first half of
 * #698, one the ruleset requires.
 *
 * Head and reviews are both read from the API at call time and the verdict is
 * about the head that read returns, never about the SHA in the event payload.
 * Two runs racing therefore agree instead of overwriting each other with
 * verdicts about different commits, and a status is never left on a commit that
 * has already been superseded.
 *
 * WHERE it is published moves in one case: a merge-queue build reads the
 * required contexts against the merge group, not against the pull request, so a
 * status posted only on the pull request head is one the queue never sees and
 * waits for forever. The queue run therefore publishes the same verdict about
 * the same head on the merge group's commit. See docs/tooling/merge-queue.md.
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
import { appendFileSync } from 'node:fs';
import process from 'node:process';

import {
  acceptedReviews,
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
import { errorMessage } from '../packages/repo-standards/scripts/error-message.mjs';
import { runGh } from './lib/gh-exec.mjs';
import {
  publishGateStatus,
  resolveGateTarget,
} from './lib/review-gate-status.mjs';

const USAGE =
  'usage: node scripts/copilot-review-status.mjs --pr <number> ' +
  '[--repo <owner/name>] [--dry-run] [--if-changed] [--protect-success]';

const triggeringReviewFrom = (payload) =>
  process.env.GITHUB_EVENT_NAME === 'pull_request_review' &&
  payload?.action === 'submitted'
    ? payload.review
    : undefined;

const fetchPullRequest = (repository, number) =>
  JSON.parse(runGh(['api', `repos/${repository}/pulls/${number}`]));

const describeReviews = (reviews, verdict) => {
  const counted = `${reviews.length} review(s) on the pull request, ${acceptedReviews(reviews).length} counted from an accepted reviewer`;
  return verdict.state === 'success'
    ? `${counted}; ${verdict.reviewer} covers the head`
    : counted;
};

const writeSummary = (markdown) => {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (path === undefined || path === '') {
    return;
  }
  appendFileSync(path, `${markdown}\n`, 'utf8');
};

const verdictLine = ({ description, state }) =>
  `${STATUS_CONTEXT}: ${state} — ${description}`;

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
  const target = resolveGateTarget(USAGE);
  if (target === undefined) {
    process.exitCode = 1;
    return;
  }

  const { number, payload, repository, statusSha } = target;
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
  if (statusSha !== undefined) {
    console.log(
      `Merge group build — publishing the verdict about that head on ${statusSha}.`,
    );
  }
  console.log(describeReviews(reviews, verdict));
  reportSuppressed(suppressed, number);
  console.log(verdictLine({ description, state }));
  console.log(
    publishGateStatus({
      context: STATUS_CONTEXT,
      description,
      repository,
      sha: statusSha ?? headSha,
      state,
    }),
  );
};

try {
  main();
} catch (error) {
  console.error(`copilot-review-status: ${errorMessage(error)}`);
  process.exitCode = 1;
}
