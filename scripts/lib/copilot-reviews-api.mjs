/**
 * The one reviews client the review-gate scripts share.
 *
 * Two scripts now read a pull request's reviews — the gate that compares the
 * newest one against the head, and the reader that pulls Copilot's suppressed
 * comments out of the bodies. Two clients would be two places to get pagination
 * wrong, and the wrong one is silent: page one alone reports a stale review and
 * an empty suppressed block, both of which read as an answer.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { reviewsFromPages } from './copilot-review.mjs';
import { runGh } from '../../packages/repo-standards/scripts/gh-exec.mjs';

export const fetchPullRequestReviews = (repository, number) =>
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
