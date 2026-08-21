/**
 * The reconcile sweep's two decisions, kept pure: which pull requests a sweep
 * visits, and whether a freshly computed status is worth publishing over the one
 * already on the head.
 *
 * Why a sweep exists when the review gates are event-driven: the events they
 * depend on are not delivered reliably in this repository, and a status nobody
 * recomputed reads exactly like one that is honestly still waiting. Issue #737
 * carries the measurement and the two commands that reproduce it;
 * `docs/tooling/review-gate-reconcile.md` carries the reasoning, the interval,
 * and what the sweep does when it fails.
 *
 * The I/O shells are `scripts/reconcile-review-gates.mjs` and the gate scripts
 * it drives.
 *
 * Governed by .claude/rules/scripts.md.
 */

/**
 * States that mean the gate has already witnessed something terminal.
 *
 * `error` is included for completeness — no gate here publishes it today, and a
 * hand-posted one still must not be quietly downgraded.
 */
const TERMINAL_STATES = new Set(['error', 'failure']);

/** A usable pull request number, or `undefined` for anything that is not one. */
const pullNumber = (pull) =>
  Number.isInteger(pull?.number) && pull.number > 0 ? pull.number : undefined;

/**
 * Every open pull request's NUMBER, ascending, from what
 * `gh api --paginate --slurp` returns for the pulls endpoint.
 *
 * Numbers, deliberately — never the `head.sha` sitting next to them in the same
 * payload. A sweep that carried a SHA from this listing into the publish step
 * could post a verdict about a commit that stopped being the head while the
 * sweep was working through the list. Handing on only the number forces each
 * gate to read the head and the reviews itself, in one step, and to post against
 * the head it read.
 *
 * No filtering. A draft is included because the Copilot gate has a state that
 * only drafts produce, and a fork pull request is included because the sweep
 * runs in the base repository with a token that can publish — which the fork's
 * own event-driven run cannot.
 *
 * `--slurp` wraps each page in an outer array, so one page arrives as `[[…]]`;
 * flattening one level is correct there and leaves an already-flat list alone.
 */
export const openPullRequestNumbers = (pages) => {
  if (!Array.isArray(pages)) {
    return [];
  }
  const numbers = pages
    .flat()
    .map((pull) => pullNumber(pull))
    .filter((number) => number !== undefined);
  return [...new Set(numbers)].sort((left, right) => left - right);
};

/**
 * The status currently published under `context`, as `{ description, state }`,
 * or `undefined` when none is.
 *
 * Reads the COMBINED status payload (`GET /commits/{sha}/status`), which already
 * collapses to the newest status per context; the newest-wins reduction below is
 * belt and braces, so a payload that ever carries a context twice still resolves
 * to the entry a reader would see.
 */
export const publishedStatus = (combined, context) => {
  const newest = (Array.isArray(combined?.statuses) ? combined.statuses : [])
    .filter((status) => status?.context === context)
    .reduce(
      (latest, status) =>
        latest === undefined || postedMillis(status) >= postedMillis(latest)
          ? status
          : latest,
      undefined,
    );
  return newest === undefined
    ? undefined
    : {
        description: newest.description ?? '',
        state: (newest.state ?? '').toLowerCase(),
      };
};

/** When a status entry was posted; an unparsable timestamp sorts oldest. */
const postedMillis = (status) => Date.parse(status?.created_at ?? '') || 0;

/**
 * Whether the reconcile should post `next` over `current`.
 *
 * Both describe the SAME head commit — the caller reads the published status of
 * the head it read the reviews for, and the comparison is meaningless across
 * heads.
 *
 * Two rules, and both are load-bearing:
 *
 * - **Identical is a no-op.** This is what makes the sweep idempotent, and what
 *   makes a pull request nobody has reviewed genuinely unaffected: the event
 *   path already published the waiting state, the sweep computes the same one,
 *   and nothing is posted.
 * - **A terminal state is never downgraded to `pending`.** `failure` means a
 *   gate watched a review land against a superseded commit; the sweep cannot
 *   witness that — it sees only that the newest review names something other
 *   than the head, which is what produced the `failure` in the first place.
 *   Replacing it would turn a red check yellow and read as progress.
 * - **A `success` is never weakened, only re-described (#868).** The sweep runs
 *   from the DEFAULT BRANCH — GitHub always runs a `schedule` from there — so on
 *   a pull request that changes what a gate decides, it is judging that pull
 *   request with the code it is replacing. Measured on #866: one head, one review
 *   list, and the two copies computed opposite verdicts. The published `success`
 *   came from a run that had the pull request's own code; this one, by
 *   construction, does not, so it is not the better-informed opinion and must not
 *   win by landing last.
 *
 *   Scoped to the sweep without a flag, because `shouldPublishStatus` is only
 *   consulted under `--if-changed` and `gateArgs` is its only caller — the gate
 *   workflows invoke the scripts bare, so an event-driven run still publishes
 *   whatever it computes, including a downgrade. That is what keeps the two real
 *   downgrades working: a dismissed review (`copilot-review-gate.yml` subscribes
 *   to `pull_request_review.dismissed`) and a push, which moves the head so no
 *   status exists on it yet.
 *
 *   What it gives up is the sweep correcting a wrongly-green status. That is a
 *   smaller loss than it sounds: a hand-posted break-glass `success` (rung 6 of
 *   the ladder in `copilot-review-gate.md`) now survives until an event
 *   recomputes it, rather than being undone by a sweep minutes later.
 */
export const shouldPublishStatus = ({ current, next } = {}) => {
  if (next === undefined) {
    return false;
  }
  if (current === undefined) {
    return true;
  }
  if (
    current.state === next.state &&
    current.description === next.description
  ) {
    return false;
  }
  if (current.state === 'success' && next.state !== 'success') {
    return false;
  }
  return !(TERMINAL_STATES.has(current.state) && next.state === 'pending');
};

/**
 * The argv the sweep runs one gate script with.
 *
 * Here rather than inline at the spawn, because two of these entries are
 * load-bearing and neither is visible in the result of getting them wrong:
 *
 * - **`--if-changed` is the whole of the sweep's idempotence.** Without it every
 *   pass re-posts an identical status, so "the status moved" stops meaning
 *   anything and a pull request nobody reviewed is no longer left alone. Drop it
 *   and the sweep still looks like it works.
 * - **`--repo` is what stops the gate resolving a different repository** from
 *   the one the sweep listed. The sweep may take it from `--repo`, the
 *   environment, or `gh repo view`; passing the answer on means the parent and
 *   the child cannot disagree about which repository a pull request number
 *   belongs to, instead of agreeing by coincidence.
 *
 * `--pr` is stringified here rather than at the call site so a number and a
 * numeric string produce the same argv.
 */
export const gateArgs = ({ extraArgs = [], number, repository, script }) => [
  script,
  '--pr',
  String(number),
  '--repo',
  repository,
  '--if-changed',
  ...extraArgs,
];

/** The gate's own last line, when it said anything, as a trailing clause. */
const outcomeDetail = (output) => (output ? ` — ${output}` : '');

/** One line per gate run, for the log and the job summary alike. */
export const outcomeLine = ({ gate, number, ok, output }) =>
  `#${number} ${gate}: ${ok ? 'ok' : 'FAILED'}${outcomeDetail(output)}`;

/**
 * What the sweep reports at the end.
 *
 * The counts are printed even when nothing failed, because "swept 0 of 4" and
 * "swept 4 of 4" are the two readings a silent green run cannot be told apart
 * from — the same argument `deps:audit` makes about a check that could not run.
 */
export const sweepSummary = ({ pullRequests, results }) => {
  const failures = results.filter((result) => !result.ok);
  return {
    failures,
    text: `Reconciled ${pullRequests.length} pull request(s) over ${results.length} gate run(s); ${failures.length} failure(s).`,
  };
};
