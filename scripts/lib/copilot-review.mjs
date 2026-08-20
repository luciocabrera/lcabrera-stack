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
const ACCEPTED_REVIEWERS = new Set([
  // The Copilot code review bot ruleset 19141543 requests on every push
  // (`review_on_push: true`). Dormant while credits are exhausted, not removed:
  // the config is untouched, so this path resumes on its own when they return.
  COPILOT_LOGIN,
  // `.github/workflows/claude-review.yml`, which submits through the reviews API
  // from a workflow step. It authenticates with `github.token`, which is why this
  // entry reads `github-actions` rather than anything naming Claude — see the hole
  // described above.
  CLAUDE_REVIEW_LOGIN,
]);

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
  ACCEPTED_REVIEWERS.has(normalisedLogin(login));

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
 * Used to SAY what is being waited on, never to decide — the decision is
 * `coveringReview` below, which asks the question per reviewer.
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

/**
 * Each accepted reviewer's newest counted review, keyed by normalised login.
 *
 * `for...of` because this builds a Map — the case the array-operation rule in
 * `.claude/rules/typescript.md` names explicitly.
 */
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

/**
 * The review that makes this gate green, or `undefined` — ANY accepted reviewer
 * whose OWN newest review names the head.
 *
 * Per reviewer, not newest-across-the-set, and the difference is not academic. It
 * was written across the set first, on the reasoning that an older review "covers
 * a commit that has since been superseded" — which cannot be true of a review that
 * names the CURRENT head, because by definition nothing superseded it. What that
 * rule actually punished was one reviewer being slower than another:
 *
 *   1. push B; the in-workflow reviewer reviews B and posts     → head covered
 *   2. Copilot, whose re-review was requested before that push, submits its
 *      review of A half an hour later
 *   3. across-the-set, the newest accepted review is now Copilot's, of A, so the
 *      gate reports failure or pending on a head that HAS been reviewed
 *
 * That fires the day Copilot's credits return, on an ordinary sequence, and it
 * contradicts what the status claims to assert — that a reviewer ran against this
 * head. Per reviewer still blocks #671: there Copilot's own newest review names an
 * earlier commit, so nothing covers the head and the gate stays pending, which is
 * the whole point of it.
 *
 * A rewind needs no special case either: a force-push back to an already-reviewed
 * commit leaves each reviewer's NEWEST review naming the commit that was rewound
 * away, so the gate is pending until the rewound head is reviewed again.
 *
 * When BOTH have covered the head, the most recent of them is named. The state is
 * the same either way, so this is about the description: it is what makes a
 * reviewer monoculture visible, and a name that depends on the order the API
 * happened to return reviews in is a signal nobody can act on.
 */
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

/**
 * Whether every accepted reviewer has a counted review on this pull request.
 *
 * The precondition for `failure`, and it is a real narrowing rather than caution.
 * `failure` asserts something strong — waiting will not help — and with a single
 * reviewer that held: Copilot had spoken and nothing further was coming on its
 * own. A second reviewer that runs on every push breaks it, in the ordering the
 * per-reviewer comparison does not already cover:
 *
 *   1. push C; the in-workflow reviewer starts, and may take minutes
 *   2. Copilot, re-requested before that push, submits its review of B, which
 *      fires this gate
 *   3. nothing covers C yet, so `failure` is published — on a head that is being
 *      reviewed right now
 *   4. the review of C lands and creates no workflow run at all, so the status
 *      stays `failure` until the next push or the reconcile sweep
 *
 * Waiting was exactly what would have helped. Requiring every accepted reviewer
 * to have spoken makes `failure` mean what it says; the cases it gives up are
 * reported `pending`, which also blocks and is honest about why.
 */
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

/**
 * The commit status for one pull request, as `{ description, reviewer, state }`.
 * `reviewer` is the login that satisfied it, or `undefined` when none did.
 *
 * `success` requires SOME accepted reviewer's OWN newest review to name the head
 * commit — see `coveringReview` for why it is per reviewer rather than newest
 * across the set. Anything else is `pending`, because a review may still be on
 * its way, except the one case where waiting provably will not help: every
 * accepted reviewer has spoken, none of them covers the head, and one of them has
 * just submitted (`triggeringReview`). `everyReviewerHasSpoken` is what keeps that
 * promise true now that a second reviewer runs on every push.
 *
 * #671's LITERAL trace does not reach it, and that is not an oversight: only
 * Copilot had reviewed there, so not every accepted reviewer has spoken and the
 * status is `pending`. Both states block; `failure` is the one that also says
 * waiting cannot help, and with a second reviewer that is a claim it can rarely
 * make honestly.
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
