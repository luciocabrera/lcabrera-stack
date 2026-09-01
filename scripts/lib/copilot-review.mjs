/**
 * Decides whether an accepted reviewer has reviewed a pull request's current head.
 *
 * Why this exists: a review is attached to the commit it reviewed, and GitHub's
 * UI renders a completed review identically whether or not that commit is still
 * the head. On #671 a review of `ff868c68` stood while two further pushes landed,
 * and only a human re-requesting it corrected the display. This module is the
 * comparison behind the `Copilot review complete` commit status, kept pure so the
 * stale-review case is testable without an API call.
 *
 * TWO REVIEWERS ARE ACCEPTED, not one — `ACCEPTED_REVIEWERS` below names them and
 * says why each is there. What the status asserts is unchanged and must stay
 * unchanged: it is green only while some accepted reviewer's newest review names
 * the current head. It has never meant that a reviewer APPROVED, and it does not
 * mean that now; it means a reviewer ran against this head.
 *
 * The context is still called `Copilot review complete` while accepting two
 * reviewers. That mismatch is known and deliberately not fixed here: the name is
 * the whole interface — ruleset contexts match by name — so renaming it is a
 * ruleset edit plus a docs edit, and it has no business riding along with a change
 * to what the status means.
 *
 * The I/O shell is `scripts/copilot-review-status.mjs`; the gate's behaviour, the
 * never-reviewed case and the break-glass path are in
 * `docs/tooling/copilot-review-gate.md`.
 *
 * Governed by .claude/rules/scripts.md.
 *
 * REST spells the reviewer `…[bot]` and GraphQL drops the suffix. Both appear.
 */

const COPILOT_LOGIN = 'copilot-pull-request-reviewer';
const CLAUDE_REVIEW_LOGIN = 'claude-general-reviewer';
const BOT_SUFFIX = /\[bot\]$/;

const ACCEPTED_REVIEWERS = new Set([
  // The Copilot code review bot ruleset 19141543 requests on every push
  // (`review_on_push: true`). Dormant while credits are exhausted, not removed:
  // the config is untouched, so this path resumes on its own when they return.
  COPILOT_LOGIN,
  // `.github/workflows/claude-review.yml`, which submits through the reviews API
  // from a workflow step using an installation token from the Claude General
  // Reviewer GitHub App. The login is the App's, looked up rather than derived
  // from its display name: `gh api "/users/claude-general-reviewer%5Bbot%5D"`.
  // A guess here fails silently — the gate simply never matches.
  CLAUDE_REVIEW_LOGIN,
]);

export const ACCEPTED_REVIEWER_LOGINS = Object.freeze([...ACCEPTED_REVIEWERS]);

const normalisedLogin = (login) =>
  typeof login === 'string' ? login.toLowerCase().replace(BOT_SUFFIX, '') : '';

const COUNTED_REVIEW_STATES = new Set([
  'APPROVED',
  'CHANGES_REQUESTED',
  'COMMENTED',
]);

export const STATUS_CONTEXT = 'Copilot review complete';

export const isCopilotReviewer = (login) =>
  normalisedLogin(login) === COPILOT_LOGIN;

export const isAcceptedReviewer = (login) =>
  ACCEPTED_REVIEWERS.has(normalisedLogin(login));

export const reviewerLogin = (review) =>
  review?.user?.login ?? review?.author?.login;
const reviewedCommit = (review) => review?.commit_id ?? review?.commit?.oid;
const submittedAt = (review) => review?.submitted_at ?? review?.submittedAt;
const reviewState = (review) => (review?.state ?? '').toUpperCase();

const submittedMillis = (review) => {
  const parsed = Date.parse(submittedAt(review) ?? '');
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sameCommit = (left, right) =>
  typeof left === 'string' &&
  typeof right === 'string' &&
  left.length > 0 &&
  left.toLowerCase() === right.toLowerCase();

const shortSha = (sha) =>
  typeof sha === 'string' && sha.length > 0 ? sha.slice(0, 7) : '(unknown)';

export const reviewsFromPages = (pages) =>
  Array.isArray(pages) ? pages.flat() : [];

export const acceptedReviews = (reviews = []) =>
  reviews.filter(
    (review) =>
      isAcceptedReviewer(reviewerLogin(review)) &&
      COUNTED_REVIEW_STATES.has(reviewState(review)),
  );

export const latestAcceptedReview = (reviews = []) =>
  acceptedReviews(reviews).reduce(
    (latest, review) =>
      latest === undefined || submittedMillis(review) >= submittedMillis(latest)
        ? review
        : latest,
    undefined,
  );

const latestReviewPerReviewer = (reviews = []) => {
  const newest = new Map();
  for (const review of acceptedReviews(reviews)) {
    const login = normalisedLogin(reviewerLogin(review));
    const current = newest.get(login);
    if (
      current === undefined ||
      submittedMillis(review) >= submittedMillis(current)
    ) {
      newest.set(login, review);
    }
  }
  return newest;
};

const coveringReview = (reviews, headSha) =>
  [...latestReviewPerReviewer(reviews).values()]
    .filter((review) => sameCommit(reviewedCommit(review), headSha))
    .reduce(
      (latest, review) =>
        latest === undefined ||
        submittedMillis(review) >= submittedMillis(latest)
          ? review
          : latest,
      undefined,
    );

const everyReviewerHasSpoken = (reviews) =>
  latestReviewPerReviewer(reviews).size === ACCEPTED_REVIEWERS.size;

const pendingDescription = ({ headSha, isDraft, latest }) => {
  if (latest !== undefined) {
    return `${reviewerLogin(latest)} last reviewed ${shortSha(reviewedCommit(latest))}; waiting for a review of ${shortSha(headSha)}.`;
  }
  return isDraft
    ? `Draft — ${shortSha(headSha)} is reviewed once the pull request is marked ready.`
    : `Waiting for a review of ${shortSha(headSha)}.`;
};

export const decideReviewStatus = ({
  headSha,
  isDraft = false,
  reviews = [],
  triggeringReview,
} = {}) => {
  const covering = coveringReview(reviews, headSha);
  if (covering !== undefined) {
    return {
      description: `Reviewed by ${reviewerLogin(covering)} at ${shortSha(headSha)}, the current head.`,
      reviewer: reviewerLogin(covering),
      state: 'success',
    };
  }
  const latest = latestAcceptedReview(reviews);
  if (
    triggeringReview !== undefined &&
    isAcceptedReviewer(reviewerLogin(triggeringReview)) &&
    everyReviewerHasSpoken(reviews)
  ) {
    return {
      description: `${reviewerLogin(triggeringReview)} reviewed ${shortSha(reviewedCommit(triggeringReview))}, which is no longer the head (${shortSha(headSha)}).`,
      reviewer: reviewerLogin(triggeringReview),
      state: 'failure',
    };
  }
  return {
    description: pendingDescription({ headSha, isDraft, latest }),
    reviewer: undefined,
    state: 'pending',
  };
};
