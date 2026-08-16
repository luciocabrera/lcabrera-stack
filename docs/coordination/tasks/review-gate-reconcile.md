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
  - docs/tooling/copilot-review-gate.md
  - docs/tooling/review-gate-reconcile.md
  - docs/agents/agent-review-contract.md
  - docs/decisions/ADR-076-*
started: 2026-08-16
updated: 2026-08-16
plan: (none)
pr: (none)
issue: #737
---

## What

Reconcile both review-gate statuses on a schedule

## Status / next

- Current step: just claimed
- Blockers: none
- Next:
