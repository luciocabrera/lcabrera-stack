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

- Current step: PR #738 open (draft), full gate green, every CI check passing
- Blockers: none
- Next: blind verification. The PR stays draft until the caller says otherwise.
  #725's `Copilot review complete` is deliberately left stale — head `498dd02a`,
  reviewed by Copilot with no run on that head — as the reproducible instance
  for whoever checks that the sweep corrects a real one.
