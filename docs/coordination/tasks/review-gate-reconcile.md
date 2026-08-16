---
id: review-gate-reconcile
title: Reconcile both review-gate statuses on a schedule
owner: agent:claude
status: active
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

- Current step: implemented; quality gate and evidence gathering
- Blockers: none
- Next: hand to the blind verifier; leave the PR draft
