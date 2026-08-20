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
 * unchanged: it is green only while the newest accepted review names the current
 * head. It has never meant that a reviewer APPROVED, and it does not mean that
 * now; it means a reviewer ran against this head.
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
 */

/** REST spells the reviewer `…[bot]`, GraphQL drops the suffix. Both appear. */
const COPILOT_LOGIN = 'copilot-pull-request-reviewer';
const CLAUDE_REVIEW_LOGIN = 'github-actions';
const BOT_SUFFIX = /\[bot\]$/;

/**
 * The reviewers this gate accepts, and why each one is on the list.
 *
 * Named in full, matched by equality. Not a regex over bot logins, not a
 * `[bot]` suffix test, not a substring: each of those would admit reviewers
 * nobody chose, and the point of this list is that adding a reviewer is an edit
 * someone makes on purpose. (`BOT_SUFFIX` below is not membership — it
 * normalises ONE login's two spellings, because REST returns
 * `copilot-pull-request-reviewer[bot]` where GraphQL returns the same name
 * without the suffix, and a filter written for one silently matches nothing on
 * the other.)
 *
 * The list is OR, deliberately: the gate is green when EITHER named reviewer has
 * reviewed the head. AND would block every pull request today, because Copilot
 * cannot review at all while its credits are exhausted, and it would make a merge
 * depend on two vendors at once — a worse availability posture than the one this
 * exists to fix. The cost is that "Copilot specifically reviewed this" stops being
 * enforceable; if that is wanted back it belongs in a second, informational,
 * non-required context. Rulesets AND their required contexts together, so OR
 * cannot be expressed at the ruleset level and has to live inside this one status.
 *
 * `github-actions` IS A KNOWN HOLE, and it is here with its eyes open. It is the
 * default `GITHUB_TOKEN` identity, so it names the RUNNER rather than the
 * reviewer: any workflow in this repository that posts a review would satisfy this
 * gate, not only `.github/workflows/claude-review.yml`. Nothing else posts one
 * today, so the hole is latent rather than open, and this context is advisory —
 * nothing merges or fails on it. **#699 must land before #698 promotes it**, at
 * which point the Claude GitHub App gives the reviewer an identity of its own and
 * this entry is replaced rather than extended.
 */
const ACCEPTED_REVIEWERS = [
  {
    login: COPILOT_LOGIN,
    // The Copilot code review bot ruleset 19141543 requests on every push
    // (`review_on_push: true`). Dormant while credits are exhausted, not removed:
    // the config is untouched, so this path resumes on its own when they return.
    why: 'the Copilot code review bot requested by ruleset 19141543',
  },
  {
    login: CLAUDE_REVIEW_LOGIN,
    // `.github/workflows/claude-review.yml`, which submits through the reviews
    // API from a workflow step. It authenticates with `github.token`, which is
    // why this entry reads `github-actions` rather than something that names
    // Claude — see the hole described above.
    why: 'the in-workflow Claude reviewer (.github/workflows/claude-review.yml)',
  },
];

/** One login's two API spellings reduced to the form the list is written in. */
const normalisedLogin = (login) =>
  typeof login === 'string' ? login.toLowerCase().replace(BOT_SUFFIX, '') : '';

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

/**
 * Copilot specifically — NOT the accepted set.
 *
 * Kept narrow because `./copilot-suppressed.mjs` reads Copilot's own review
 * markup, which no other reviewer emits. Widening this would have it hunt for a
 * `Suppressed comments` block in reviews that never contain one.
 */
export const isCopilotReviewer = (login) =>
  normalisedLogin(login) === COPILOT_LOGIN;

/** Whether this gate counts a review by `login` at all. */
export const isAcceptedReviewer = (login) =>
  ACCEPTED_REVIEWERS.some(
    (reviewer) => reviewer.login === normalisedLogin(login),
  );

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

/**
 * Submitted reviews by an accepted reviewer — dismissed and still-pending ones
 * dropped.
 */
export const acceptedReviews = (reviews = []) =>
  reviews.filter(
    (review) =>
      isAcceptedReviewer(reviewerLogin(review)) &&
      COUNTED_REVIEW_STATES.has(reviewState(review)),
  );

/**
 * The newest counted review by ANY accepted reviewer, or `undefined`.
 *
 * Newest across the whole accepted set rather than newest per reviewer, and that
 * is the behaviour to be deliberate about: when the newest review is stale and an
 * OLDER review by the other reviewer names the head, this gate is NOT green. The
 * older review covers a commit that has since been superseded and reviewed again
 * — the newer verdict is the one that saw the head last, and taking the best of
 * the two would let a stale-then-fixed sequence pass on the strength of a review
 * that predates it. #671 is that shape.
 *
 * Ties resolve to the later array position, which is REST's chronological order —
 * so reviews submitted within the same second still order correctly.
 */
export const latestAcceptedReview = (reviews = []) =>
  acceptedReviews(reviews).reduce(
    (latest, review) =>
      latest === undefined || submittedMillis(review) >= submittedMillis(latest)
        ? review
        : latest,
    undefined,
  );

const pendingDescription = ({ headSha, isDraft, latest }) => {
  if (latest !== undefined) {
    return `${reviewerLogin(latest)} last reviewed ${shortSha(reviewedCommit(latest))}; waiting for a review of ${shortSha(headSha)}.`;
  }
  return isDraft
    ? `Draft — reviewed once the pull request is marked ready.`
    : `Waiting for a review of ${shortSha(headSha)}.`;
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
  const latest = latestAcceptedReview(reviews);
  if (sameCommit(reviewedCommit(latest), headSha)) {
    return {
      description: `Reviewed by ${reviewerLogin(latest)} at ${shortSha(headSha)}, the current head.`,
      reviewer: reviewerLogin(latest),
      state: 'success',
    };
  }
  if (
    triggeringReview !== undefined &&
    isAcceptedReviewer(reviewerLogin(triggeringReview))
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
