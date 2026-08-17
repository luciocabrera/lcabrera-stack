# ADR-078 — Surface the suppressed Copilot comments, and never block on them

**Status:** Accepted

**Date:** 2026-08-17
**Issue:** [#750](https://github.com/luciocabrera/vite-react-compiler/issues/750)
**Relates to:** [ADR-055](./ADR-055-react-doctor-as-a-gate.md),
[ADR-077](./ADR-077-audit-every-published-version-and-report-rather-than-block.md),
[ADR-076](./ADR-076-reconcile-the-review-gate-statuses-on-a-schedule.md)

## Context

`required_review_thread_resolution` is on for this repository, and it is the only
mechanism that forces a Copilot finding to be answered before a merge. It sees
**review threads**.

Copilot does not file every finding as a thread. The ones it judges low-confidence
go into the review **body**, inside a collapsed `Suppressed comments` block. Those
never become threads, so the merge bar cannot see them, and a pull request reads
clean while carrying unanswered review findings. #750 measures that on #740, where
several of the suppressed comments were real defects — found only because that
pull request's author happened to read the review bodies by hand.

Two properties of the subject shaped every decision below.

**Low confidence is not low severity.** It is Copilot's judgement of its own
certainty, applied per comment rather than per finding class, so a suppressed
block mixes real defects with noise in no particular order. Nothing in the block
distinguishes them, and nothing this repository can compute does either.

**The whole thing is read out of someone else's markup.** The block's shape is
GitHub's, it can change without notice, and every way of failing to read it
produces the same output: zero. A wrong reviewer-login spelling produces zero. A
renamed section produces zero. An API shape shift produces zero. And zero is the
one answer nobody investigates.

## Decision

**1. It reports; it never blocks.** The findings are surfaced next to the
`Copilot review complete` gate — in its log, its job summary and its status
description — and the commit-status **state** is untouched by them. A pull request
with suppressed comments is exactly as mergeable as it was before.

The reason is the one ADR-055 records for what earns a blocking gate, applied to a
signal that cannot be triaged automatically: a gate that failed on every suppressed
comment would fail on the noise as often as on the defects, and a gate that is
usually wrong is one people learn to bypass. ADR-077 reached the same place from
the other side — an audit whose findings no pull request can fix reports rather
than blocks. Here the finding _is_ actionable, but only by a human reading it,
which is precisely what was missing.

**No rule promotes a suppressed comment to a blocker**, and none is proposed.
Severity, path and rule-family filters were all considered and all need
information the block does not carry (see Alternatives). If one is ever wanted,
#698 is where gate promotion is decided in this repository, deliberately as its
own step.

**2. Zero is a state, not a number.** `scripts/lib/copilot-suppressed.mjs` returns
one of four answers — `no-reviews`, `none`, `found`, `unreadable` — and every
renderer names which it is. `unreadable` outranks the others, so a partial read
can never report a clean count. Three checks produce it, and each covers a
different way the read can go wrong without erroring:

- **The count GitHub declares.** The block's own summary carries `(N)`. The parser
  reports what it parsed and what it was told, separately, and disagreeing is a
  problem — so inner markup moving turns into an alarm rather than a smaller
  number. This is the check that keeps working after the format changes, which a
  frozen test fixture by construction cannot.
- **The body's shape.** A Copilot review body is either the review template or the
  refusal ("Copilot wasn't able to review this pull request…"). Anything else is
  reported as unread rather than as read-and-empty.
- **A suppression label that did not parse.** A collapsed section whose summary is
  about suppression and does not match the known shape is a problem, not a section
  to skip.

An empty body is not a problem: it cannot be hiding anything.

**3. It lives in the gate that already reads the reviews.** The
`Copilot review complete` gate fetches every page of a pull request's reviews on
every push and on every reconcile sweep. Reading the bodies it already has costs
one more parse and no new API call, no new workflow, and no second reviews client
— `scripts/lib/copilot-reviews-api.mjs` is now the one fetch both readers share.
`vp run copilot-review:suppressed -- --pr <n>` is the same report on demand, and
it is the form the status description points at.

The gate's own verdict stays the last line it prints, because the reconcile sweep
reads a gate's last line as its outcome.

**4. A finding is a location, and the instance count is printed beside it.**
Copilot re-emits a still-open suppressed comment on every re-review, in fresh
wording, so the number of comments runs ahead of the number of things a merger has
to answer. The report groups by file and line and prints both numbers, because
neither one alone is the truth: the finding count is the checklist, and the
comment count is what GitHub's own blocks add up to.

**5. Both reviewer-login spellings, always.** `.user.login` is
`copilot-pull-request-reviewer[bot]` over REST and `copilot-pull-request-reviewer`
over GraphQL. One shared predicate (`isCopilotReviewer`) accepts both, and the
tests assert the two payload shapes produce identical reports — a filter written
for one spelling matches nothing on the other and reports a confident zero.

## Consequences

- A merger sees suppressed findings without opening review bodies, and can tell
  them apart from "there were none" and from "they could not be read".
- **Nothing forces anyone to act on one.** This closes the invisibility, not the
  possibility of ignoring a finding, and it should not be read as making Copilot's
  suppressed comments answered.
- **A markup change becomes a visible alarm rather than a silent zero**, and the
  cost is that a benign change to Copilot's block also raises it. That is the
  trade this decision takes deliberately; the alarm never blocks a merge, so its
  cost is a warning line and a status clause until the parser is updated.
- The commit-status description gains a clause when there is something to say,
  which means a pull request that gains or loses a suppressed finding gets a fresh
  status from the reconcile sweep where it would previously have been unchanged.
- Suppressed comments are read from **every** Copilot review whatever its state,
  which is the opposite of the whitelist `decideReviewStatus` applies to the same
  list. The asymmetry is deliberate and each direction is fail-safe for its own
  question: there an unfamiliar state must not count as a review, because an
  absent verdict has to block; here it must not hide a finding, because nothing
  blocks.
- The fixtures are review bodies captured verbatim from this repository, so they
  document a real format rather than one we invented — and they are frozen, so
  they cannot notice it moving. The live check is the gate itself, which runs the
  same parser against real bodies on every pull request.

## Alternatives considered

- **Fail the gate on any suppressed comment.** Rejected on the sample this issue
  is measured against: most of the suppressed comments on #740 were noise, and a
  gate that is mostly noise is one people learn to click past — after which it
  also stops catching the real ones. This is ADR-055's "what earns a blocking
  gate" applied to a signal nothing can triage.
- **Promote only the "severe" ones.** Rejected because the block carries no
  severity, no rule id and no category — only a file, a line and prose. Any rule
  would have to be a keyword match over Copilot's wording, which is a filter that
  looks principled and is not.
- **Open a review thread per suppressed comment**, so conversation resolution
  covers them. Rejected: it converts Copilot's own confidence judgement into a
  hard merge blocker by the back door, and it writes to the pull request from a
  gate that currently only reads. The blocking decision above applies unchanged,
  and this form is worse, because the thread would then be indistinguishable from
  a finding Copilot itself considered worth raising.
- **A separate workflow and status context.** Rejected: it would fetch the same
  reviews a second time, on its own schedule, and add a second thing that can be
  stale about one subject. The gate already runs on every push and every sweep.
- **Report the raw comment count only.** Rejected on the data: on #740 that count
  is one higher than the number of distinct findings, because a finding restated
  in a later review is counted twice. Both numbers are printed instead, since each
  answers a different question.
- **Treat "no suppressed block found" as the answer.** Rejected — it is the
  failure mode this whole design is against. It is what a wrong login spelling, a
  renamed section and a shape shift all produce.

## References

- Issue [#750](https://github.com/luciocabrera/vite-react-compiler/issues/750) —
  the gap, its measurement on #740, and the acceptance criteria.
- [`docs/tooling/copilot-review-gate.md`](../tooling/copilot-review-gate.md) —
  how to run the report and how to read each state.
- [ADR-055](./ADR-055-react-doctor-as-a-gate.md) — what earns a blocking gate
  here, and the silent-pass class this parser is guarded against.
- [ADR-077](./ADR-077-audit-every-published-version-and-report-rather-than-block.md)
  — the sibling report-don't-block decision, and the "a check that goes green
  because it could not run is worse than none" argument.
- Issue [#698](https://github.com/luciocabrera/vite-react-compiler/issues/698) —
  where gate promotion is decided, kept separate from gate construction.
