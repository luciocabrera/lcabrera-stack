---
id: review-gate-reconcile
title: Reconcile both review-gate statuses on a schedule
owner: agent:claude
status: review
branch: ci/737-review-gate-reconcile
area:
  - .github/workflows/copilot-review-gate.yml
  - .github/workflows/agent-review-verdict.yml
  - .github/workflows/review-gate-reconcile.yml
  - scripts/copilot-review-status.mjs
  - scripts/verify-agent-review.mjs
  - scripts/reconcile-review-gates.mjs
  - scripts/lib/review-gate-*
  - scripts/lib/agent-review-workflow.test.mjs
  - scripts/lib/workflow-inspect.mjs
  - docs/tooling/copilot-review-gate.md
  - docs/tooling/review-gate-reconcile.md
  - docs/agents/agent-review-contract.md
  - docs/decisions/ADR-076-*
started: 2026-08-16
updated: 2026-08-16
plan: (none)
pr: 738
issue: #737
---

## What

Add the recompute path both review gates lack: a low-frequency scheduled sweep
over open pull requests that republishes `Copilot review complete` and
`Agent review verdict`, plus a `workflow_dispatch` break-glass on all three
workflows. ADR-076 records why a reconcile is not the polling the Copilot gate's
header rejects.

## Status / next

- Current step: PR #738 open and ready, round 4 applied, full gate green, the
  Copilot review thread resolved
- Blockers: none
- Next: blind verification. Readying was the caller's call and is done; merging
  is not mine.
- **Do not expect a stale status to be waiting.** #721, #725, #734 and #738's own
  head have each been one, and each was corrected by a run demonstrating the fix
  — so a checker who looks for them now finds `success` and would reasonably
  conclude the claim was false. Find a fresh one instead: the two commands in
  #737 §1 list the Copilot reviews and the runs on each head. They occur on
  their own, often.
- **Reading `conclusion` is not enough**, which #738's own head showed on
  2026-08-17: a `pull_request_review` run existed on it and had succeeded, so
  both of #737 §1's checks passed, and the status was stale anyway — that run
  finished at `08:56:15Z` and Copilot reviewed at `08:59:57Z`. Compare the
  review's `submitted_at` against the run times, not just the run's existence.
  Those two timestamps are immutable, so an instance stays re-derivable long
  after its status has been corrected.
