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
 * Three rules, and all three are load-bearing:
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
 * - **A `success` is never weakened, only re-described — but only for a gate that
 *   asks (`protectSuccess`, #868).** A `schedule` always runs from the default
 *   branch, so on a pull request that changes what a gate decides the sweep is
 *   judging it with the code it is replacing; that verdict is not the
 *   better-informed one and must not win by landing last.
 *
 *   **Opt-in rather than universal, because the argument is not true of every gate
 *   this sweep drives.** It holds where some OTHER publisher may have posted the
 *   `success` from better-informed code — `copilot-review-status.mjs`, which
 *   `copilot-review-gate.yml` also runs on events. It is false for
 *   `verify-review-threads.mjs`: nothing in `.github/workflows/` invokes that
 *   script, so the sweep is its ONLY publisher and therefore always the
 *   best-informed one. Worse, `decideThreadStatus` legitimately moves
 *   `success` → `failure` on an UNCHANGED head — a reviewer opens a thread, or a
 *   draft is marked ready, neither of which moves the SHA. Applying this rule there
 *   would freeze `Review threads resolved` green for the life of a head while
 *   threads sat open.
 *
 *   What it gives up, and the residual false-green cases, are in
 *   `docs/tooling/review-gate-reconcile.md` — read that before relaxing this.
 */
export const shouldPublishStatus = ({
  current,
  next,
  protectSuccess = false,
} = {}) => {
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
  if (
    protectSuccess &&
    current.state === 'success' &&
    next.state !== 'success'
  ) {
    return false;
  }
  return !(TERMINAL_STATES.has(current.state) && next.state === 'pending');
};

/**
 * Every local module a gate script loads, as repo-relative paths — the entry
 * itself included.
 *
 * This is derived rather than listed because a list is the thing that rots: a
 * gate that grows a new helper would keep passing a hand-written roster while
 * quietly falling outside it, and nothing would say so. Every non-builtin import
 * in these scripts is relative (`node:*` is the only bare specifier used), so
 * following the relative ones reaches exactly the code the gate runs.
 *
 * `readFile` is injected so this stays pure and testable; it takes a
 * repo-relative path and returns the source, or `undefined` when there is no
 * such file. **An unreadable module stays IN the closure and the walk stops
 * there** — it is added before it is read. Nothing downstream compensates for a
 * short closure, so the width is the safety margin: too wide costs a withheld
 * gate, too narrow lets the sweep publish on a self-edit, which is the defect
 * #884 closes. Do not "fix" this into dropping the module.
 */
export const localModuleClosure = ({ entry, readFile }) => {
  const seen = new Set();
  const pending = [normalizePath(entry)];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined || seen.has(current)) {
      continue;
    }
    seen.add(current);
    const source = readFile(current);
    if (source === undefined) {
      continue;
    }
    for (const specifier of relativeSpecifiers(source)) {
      pending.push(resolveFrom({ from: current, specifier }));
    }
  }
  return [...seen].toSorted((a, b) => a.localeCompare(b));
};

/** `a/./b/../c` as `a/c`, with no leading `./`. */
const normalizePath = (path) => {
  const parts = [];
  for (const segment of String(path).split('/')) {
    if (segment === '' || segment === '.') {
      continue;
    }
    if (segment === '..') {
      parts.pop();
      continue;
    }
    parts.push(segment);
  }
  return parts.join('/');
};

/** The relative import specifiers in one module's source. */
const relativeSpecifiers = (source) =>
  [...source.matchAll(/(?:from|import)\s*\(?\s*'(\.[^']*)'/gu)].map(
    (match) => match[1],
  );

/** One relative specifier, resolved against the module that imported it. */
const resolveFrom = ({ from, specifier }) =>
  normalizePath(`${from.split('/').slice(0, -1).join('/')}/${specifier}`);

/**
 * Whether this sweep's opinion about a pull request is worth publishing at all.
 *
 * The sweep runs from the default branch — GitHub gives a `schedule` no other
 * choice — so on a pull request that edits a gate it is judging the change with
 * the code the change is replacing. #866 is that disagreement having actually
 * happened, and #868 closed the half where the sweep took a `success` away. This
 * is the other half: the sweep must not hand one out either.
 *
 * Withholding, rather than publishing something weaker, is deliberate. The pull
 * request's own run already published a verdict from its own code, and that is
 * the better-informed one; replacing it with a sweep-flavoured `pending` would
 * be the same mistake in the opposite direction.
 */
export const gateJudgesItsOwnEdit = ({ changedFiles = [], closure = [] }) => {
  const touched = new Set(changedFiles.map((file) => normalizePath(file)));
  return closure.some((module) => touched.has(module));
};

/**
 * The result for a gate the sweep declines to run, or `undefined` to run it.
 *
 * The two reasons look alike and report differently, deliberately:
 *
 * - **A self-edit is a decision**, so it is `ok`. The sweep chose not to publish
 *   and left a better-informed verdict standing; nothing is wrong.
 * - **An unreadable file list is a failure**, so it is not. The sweep could not
 *   do its work for that pull request, and this component's whole promise is to
 *   be loud about that. Reporting it as `ok` would let a secondary rate limit
 *   part-way through a sweep withhold every remaining gate, summarise `0
 *   failure(s)`, exit 0, and file no tracking issue — statuses silently stopping
 *   while every pull request still looks normal.
 */
export const withheldResult = ({ changedFiles, gate, number }) => {
  if (changedFiles === undefined) {
    return {
      gate: gate.name,
      number,
      ok: false,
      output:
        'Withheld: could not read what this pull request changed, so whether it edits this gate is unknown (#884).',
    };
  }
  return gateJudgesItsOwnEdit({ changedFiles, closure: gate.closure })
    ? {
        gate: gate.name,
        number,
        ok: true,
        output:
          'Withheld: this pull request edits the code this gate runs, and the sweep runs the default branch (#884).',
      }
    : undefined;
};

/**
 * The one spelling of the opt-in flag. `gateArgs` writes it and
 * `publishGateStatus` reads it, and a run where only one of them was renamed is
 * invisible: the gate stays unprotected, every test still passes, and the log
 * says `Unchanged` either way. So the two sides share the string rather than
 * each carrying their own copy of it.
 */
export const PROTECT_SUCCESS_FLAG = '--protect-success';

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
export const gateArgs = ({
  extraArgs = [],
  number,
  protectSuccess = false,
  repository,
  script,
}) => [
  script,
  '--pr',
  String(number),
  '--repo',
  repository,
  '--if-changed',
  ...(protectSuccess ? [PROTECT_SUCCESS_FLAG] : []),
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
