# ADR-076 — Reconcile the review gate statuses on a schedule

**Status:** Accepted

**Date:** 2026-08-16
**Issue:** #737
**Relates to:** #695 / #697 (the two gates), #698 (promotion to required)

## Context

Two commit statuses judge the review rather than the code: `Copilot review
complete` asserts that Copilot's newest review names the head commit, and `Agent
review verdict` asserts that a valid agent-review verdict exists for it. Both are
published by an event-driven workflow —
[`copilot-review-gate.yml`](../../.github/workflows/copilot-review-gate.yml) on
`pull_request` and `pull_request_review`,
[`agent-review-verdict.yml`](../../.github/workflows/agent-review-verdict.yml) on
`pull_request` and `issue_comment`.

The `pull_request` half is healthy. The review/comment half is not: a review
submitted by Copilot usually creates no workflow run at all, and some of the runs
it does create are held for approval and never execute. #737 carries the
measurement and the two commands that reproduce it. The agent-review gate is
exposed the same way and for the same reason — its verdict is posted **as a
comment by an agent**, the same actor class.

What makes this worse than a clean failure is that the failure has no signal. A
status that was never recomputed reports the previous commit, which is identical
— on the pull request and in the API — to a status that is honestly still waiting
for a review that has not landed. There is nothing an author can look at that
separates the two, and nothing they can press.

The cause of the missing runs is undetermined. Trigger configuration, concurrency
cancellation, workflow-file availability and blanket suppression of bot-authored
events were each ruled out (#737 §3), and the Actions approval policy explains
only the minority of cases that were created-and-held. So the choice was never
"fix the trigger or work around it": nobody had a fix to make.

## Decision

A **scheduled reconcile** republishes both statuses for every open pull request.
[`review-gate-reconcile.yml`](../../.github/workflows/review-gate-reconcile.yml)
runs [`scripts/reconcile-review-gates.mjs`](../../scripts/reconcile-review-gates.mjs)
at `:07` and `:37` past every hour, and that script re-runs the two gate scripts
themselves rather than reimplementing their comparisons.

Four properties are the decision, not implementation detail:

1. **It carries no SHA across an I/O boundary.** The sweep selects pull request
   _numbers_ and hands each to a gate script, which reads the head and the
   reviews together and posts against the head it read. A push landing mid-sweep
   therefore cannot produce a verdict about the new head derived from the old
   head's reviews.
2. **It publishes only a change.** Identical state and identical description
   means nothing is posted, so the sweep is idempotent and a pull request nobody
   has reviewed is untouched.
3. **It never downgrades a terminal state to `pending`,** and never publishes
   `failure` of its own. `failure` requires having _witnessed_ a review
   submission, which a sweep cannot do.
4. **It fails loudly.** It exits non-zero when it could not list the pull
   requests or when any gate run failed, and the workflow files a tracking issue
   rather than leaving a red X on a schedule nobody watches — the same shape
   [`deps-audit.yml`](../../.github/workflows/deps-audit.yml) already uses, for
   the same reason.

`workflow_dispatch` with a pull request number goes on **all three** workflows,
so break-glass is a button rather than the trick of re-running an older run.

**One workflow serves both gates.** There is one mechanism here — recompute a
review-gate status without the event that normally would — and two copies would
mean two schedules to keep in step and two ways for one of them to stop running
unnoticed.

**Half-hourly, offset off the hour.** Low enough that a stale status corrects
itself inside a working session; high enough that its cost is bounded by the
number of open pull requests rather than by review latency. `:00` is where
scheduled runs queue longest across GitHub, and a tighter cron would not buy a
tighter bound anyway, because scheduled delivery is best-effort.

## Consequences

- **`copilot-review-gate.yml`'s header had to change.** It said "Event-driven,
  never polling", and a `schedule` added underneath that sentence would leave the
  repository holding two opposite positions in two files. The header now states
  the distinction it was actually making — nothing is held open, nothing sleeps —
  and points at the reconcile.
- **A status can now be corrected by something no event produced.** That is the
  point, and it is also a cost: the run behind a status is no longer necessarily
  the run of an event a reader can find. Every status the gates post carries a
  `target_url` to the run that decided it, which is what keeps it re-derivable.
- **Correction is bounded by the interval, not immediate.** An author who needs
  it sooner runs the sweep or dispatches a gate; both are in
  [`review-gate-reconcile.md`](../tooling/review-gate-reconcile.md).
- **Actions minutes go on runs that usually publish nothing.** That is the price
  of the property: the sweep cannot know in advance which pull request has a
  stale status, because the whole defect is that a stale one looks fine. The run
  does no install and no build to keep it cheap.
- **GitHub disables `schedule` triggers after 60 days of repository inactivity.**
  A repository that quiet has nothing to reconcile, but the workflow has to be
  re-enabled before it is relied on again.

## Alternatives considered

1. **Fix the trigger.** Preferred, and unavailable — the cause is undetermined
   and every candidate that could be tested was ruled out (#737 §3). Loosening
   the Actions approval policy addresses only the created-and-held minority, and
   a workflow that auto-approved its own gated runs would be a much worse thing
   to own.
2. **A job that waits for the review inside the run.** What
   `copilot-review-gate.yml` rejected, correctly: it bills for the length of the
   wait, it still races the push that supersedes what it waited for, and —
   decisively — it is another way of waiting for the same event that is not
   arriving.
3. **One reconcile per gate.** Rejected as a second way to do one thing.
4. **Dispatch alone, with no schedule.** Rejected because it requires a human to
   _notice_ a stale status, and the defect is precisely that a stale one is
   indistinguishable from an honest wait. Dispatch is kept as the impatient path,
   not as the mechanism.
5. **Let the sweep publish `failure` when the newest review names a superseded
   commit.** Rejected: that state means "a review has just landed and it is not
   of the head", which a sweep cannot witness. It would be inferring a submission
   event from its aftermath, and re-inferring it on every pass.

## References

- #737 — the measurement, the reproduction commands and the acceptance criteria
- #698 — promotion of both contexts to required, which this unblocks
- [`docs/tooling/review-gate-reconcile.md`](../tooling/review-gate-reconcile.md) — the sweep's behaviour, interval and recovery
- [`docs/tooling/copilot-review-gate.md`](../tooling/copilot-review-gate.md) — the Copilot gate's states and its break-glass ladder
- [`docs/agents/agent-review-contract.md`](../agents/agent-review-contract.md) — what the other gate validates
