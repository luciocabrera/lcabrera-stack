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
import { runGh } from './gh-exec.mjs';

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
