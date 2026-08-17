/**
 * Decides whether Copilot's review covers a pull request's current head commit.
 *
 * Why this exists: a review is attached to the commit it reviewed, and GitHub's
 * UI renders a completed review identically whether or not that commit is still
 * the head. On #671 a review of `ff868c68` stood while two further pushes landed,
 * and only a human re-requesting it corrected the display. This module is the
 * comparison behind the `Copilot review complete` commit status, kept pure so the
 * stale-review case is testable without an API call.
 *
 * The I/O shell is `scripts/copilot-review-status.mjs`; the gate's behaviour, the
 * never-reviewed case and the break-glass path are in
 * `docs/tooling/copilot-review-gate.md`.
 *
 * Governed by .claude/rules/scripts.md.
 */

/** REST spells the reviewer `…[bot]`, GraphQL drops the suffix. Both appear. */
const COPILOT_LOGIN = 'copilot-pull-request-reviewer';
const BOT_SUFFIX = /\[bot\]$/;

/**
 * States a submitted review can carry. Whitelisted rather than blacklisted so an
 * unrecognised or missing state leaves the gate pending instead of counting a
 * review nobody has read — an absent verdict must block, not pass.
 */
const COUNTED_REVIEW_STATES = new Set([
  'APPROVED',
  'CHANGES_REQUESTED',
  'COMMENTED',
]);

/** The commit-status context, and the ruleset name a promotion would require. */
export const STATUS_CONTEXT = 'Copilot review complete';

export const isCopilotReviewer = (login) =>
  typeof login === 'string' &&
  login.toLowerCase().replace(BOT_SUFFIX, '') === COPILOT_LOGIN;

// Field readers accept both payload shapes: REST (`/pulls/{n}/reviews`, what the
// workflow fetches) and GraphQL (`gh pr view --json reviews`, what the issue's
// reproduction command prints). One shape would make the documented repro
// disagree with the gate it is meant to explain.
//
// The login reader is exported because `./copilot-suppressed.mjs` filters the
// same list: two readers of the reviewer would be two places to forget that the
// spelling differs by API.
export const reviewerLogin = (review) =>
  review?.user?.login ?? review?.author?.login;
const reviewedCommit = (review) => review?.commit_id ?? review?.commit?.oid;
const submittedAt = (review) => review?.submitted_at ?? review?.submittedAt;
const reviewState = (review) => (review?.state ?? '').toUpperCase();

const submittedMillis = (review) => {
  const parsed = Date.parse(submittedAt(review) ?? '');
  return Number.isNaN(parsed) ? 0 : parsed;
};

/** Commit SHAs compare case-insensitively; an empty side never matches. */
const sameCommit = (left, right) =>
  typeof left === 'string' &&
  typeof right === 'string' &&
  left.length > 0 &&
  left.toLowerCase() === right.toLowerCase();

const shortSha = (sha) =>
  typeof sha === 'string' && sha.length > 0 ? sha.slice(0, 7) : '(unknown)';

/**
 * One review list from what `gh api --paginate --slurp` returns.
 *
 * `--slurp` wraps every page in an outer array, so one page arrives as `[[…]]`
 * and three as `[[…],[…],[…]]`. It is asked for rather than relying on
 * `--paginate` alone because gh documents each page as **a separate JSON
 * document** — a contract under which concatenated pages do not parse at all —
 * even though today it happens to merge array responses into one. Flattening
 * one level is correct under both, and leaves an already-flat list untouched.
 */
export const reviewsFromPages = (pages) =>
  Array.isArray(pages) ? pages.flat() : [];

/** Copilot's submitted reviews — dismissed and still-pending ones dropped. */
export const copilotReviews = (reviews = []) =>
  reviews.filter(
    (review) =>
      isCopilotReviewer(reviewerLogin(review)) &&
      COUNTED_REVIEW_STATES.has(reviewState(review)),
  );

/**
 * The newest counted Copilot review, or `undefined`. Ties resolve to the later
 * array position, which is REST's chronological order — so reviews submitted
 * within the same second still order correctly.
 */
export const latestCopilotReview = (reviews = []) =>
  copilotReviews(reviews).reduce(
    (latest, review) =>
      latest === undefined || submittedMillis(review) >= submittedMillis(latest)
        ? review
        : latest,
    undefined,
  );

const pendingDescription = ({ headSha, isDraft, latest }) => {
  if (latest !== undefined) {
    return `Copilot's latest review is of ${shortSha(reviewedCommit(latest))}; waiting for one of ${shortSha(headSha)}.`;
  }
  return isDraft
    ? `Draft — Copilot reviews ${shortSha(headSha)} once the pull request is marked ready.`
    : `Waiting for Copilot's review of ${shortSha(headSha)}.`;
};

/**
 * The commit status for one pull request, as `{ description, state }`.
 *
 * `success` requires the newest counted Copilot review to name the head commit.
 * Anything else is `pending` — a review may still be on its way — except the one
 * case where waiting provably will not help: Copilot has just submitted a review
 * (`triggeringReview`) and it is against something other than the head. That is
 * #671's shape exactly, it is terminal until someone acts, and `failure` says so
 * where `pending` would imply patience is enough.
 *
 * `headSha` is a precondition, not an input to validate: the caller resolves it
 * from the API and cannot post a status without it.
 */
export const decideReviewStatus = ({
  headSha,
  isDraft = false,
  reviews = [],
  triggeringReview,
} = {}) => {
  const latest = latestCopilotReview(reviews);
  if (sameCommit(reviewedCommit(latest), headSha)) {
    return {
      description: `Copilot reviewed ${shortSha(headSha)}, the current head.`,
      state: 'success',
    };
  }
  if (
    triggeringReview !== undefined &&
    isCopilotReviewer(reviewerLogin(triggeringReview))
  ) {
    return {
      description: `Copilot reviewed ${shortSha(reviewedCommit(triggeringReview))}, which is no longer the head (${shortSha(headSha)}).`,
      state: 'failure',
    };
  }
  return {
    description: pendingDescription({ headSha, isDraft, latest }),
    state: 'pending',
  };
};
