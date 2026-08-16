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

- Current step: PR #738 open (draft), round 2 applied, full gate green, every CI
  check passing
- Blockers: none
- Next: blind verification. The PR stays draft until the caller says otherwise.
- **Do not expect a stale status to be waiting.** #721, #725 and #734 each were
  one, and each has since been corrected by a run demonstrating the fix — so a
  checker who looks for them now finds `success` and would reasonably conclude
  the claim was false. Find a fresh one instead: the two commands in #737 §1
  list the Copilot reviews and the runs on each head, and a review with no
  executed run on the head it names is an instance. They occur on their own,
  often.
