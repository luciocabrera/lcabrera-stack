# Review threads: address, then resolve

**Scope:** every pull request in this repository, whoever opened it and whichever
workflow produced it. This is the one statement of the rule; `commit-and-pr`,
[`merge-checklist.md`](merge-checklist.md), [`epic-orchestration.md`](epic-orchestration.md)
and [`.claude/pr-queue-policy.md`](../../.claude/pr-queue-policy.md) link here
rather than restating it.

## The rule

Every review thread — a human's, Copilot's, another agent's — ends one of two
ways:

- **the code changed**, and the reply says which commit; or
- **the finding is wrong**, and the reply says why, with a probe someone else can
  re-run.

Then, and only then, resolve the thread. There is **no third option**: a thread
is never resolved silently, and never resolved because it went `outdated`.

A pull request is not finished when the checks are green. It is finished when
nothing is holding it, and an open thread holds it.

## Why this is a rule and not a habit

The `main` ruleset sets `required_review_thread_resolution: true`, so one open
thread blocks the merge. It also sets `required_approving_review_count: 0` — so
if a pull request will not merge, an approval is almost never what it is waiting
for. Check the threads first.

The block is real but silent. GitHub reports it in the merge box, which nobody
reopens once the checks go green, and the agent that pushed the last commit has
already stopped. Two ways that has gone wrong here:

- **#646** merged with three unresolved Copilot threads, all `outdated=true`, all
  in fact fixed in code. The fixes happened; the record does not show it.
- **#780** had every finding fixed by 08:31 and still sat blocked until 09:36,
  because one thread — a false positive about a coordination claim file — was
  never answered. Seventy minutes, ended by a human noticing.

Neither was a disagreement about the findings. Both were the same missing last
step.

**`outdated` is not resolved.** GitHub marks a thread `outdated` when the line it
points at moves, which a fix usually does — so the marker that looks most like
"done" is emitted by the same event that leaves the thread open. Nothing in CI
distinguishes them. `summarizeThreads` counts an outdated thread as unresolved
for exactly this reason.

## Doing it

```bash
vp run pr:threads                             # the PR for the current branch
vp run pr:threads -- --pr 780                 # one PR, with each thread's node id
vp run pr:threads -- --resolve PRRT_kwDO…     # after you have fixed or answered it
```

`pr:threads` exits non-zero while any thread is open, so it is meant to be the
last thing you run — after the quality gate, not instead of it. It never resolves
anything by itself: which of the two endings applies is a judgement only the
agent that made it can report.

Reply in the thread before resolving. `gh pr review --comment` posts a top-level
comment, not a thread reply — use the thread's own reply endpoint, or the web UI.

For the underlying GraphQL — listing threads, or the `resolveReviewThread`
mutation — read [`scripts/pr-threads.mjs`](../../scripts/pr-threads.mjs); it is
the same two queries, and copying them out of here is how the copies drift.

## Disagreeing with a finding

**A developer who disagrees with a finding should say so with evidence.** That is
correct behaviour and has been right in this repo more than once. A reply that
refutes a finding, with a probe that could have gone the other way, discharges
the thread as completely as a fix does — Non-Negotiable Rule 14 applies to the
reply as much as to the finding.

What does not discharge it is silence, or a reply that asserts the finding is
wrong without saying how anyone could check. Route a live disagreement back to
the reviewer; if it survives **two** rounds, escalate rather than looping.

## What reports on it

`Review threads resolved` is an advisory commit status published by
[`scripts/verify-review-threads.mjs`](../../scripts/verify-review-threads.mjs)
and republished for every open pull request by the reconcile sweep
([`review-gate-reconcile.md`](../tooling/review-gate-reconcile.md)). It exists so
a blocked pull request shows a red check next to the others instead of waiting
to be noticed.

It is deliberately **not** a required context. The ruleset is the enforcement;
this is the report, so a stale status can never be the thing that stops a merge.
Promoting the review gates is #698.

A draft never fails the status. Draft is the author's own "not yet" — policy E1
and A9 — so open threads on work in progress are expected; the count still shows
in the description.
