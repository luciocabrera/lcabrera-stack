---
id: copilot-gate-break-glass
title: Correct the Copilot review gate break-glass ladder
owner: agent:claude
status: active
branch: docs/732-copilot-gate-break-glass
area:
  - docs/tooling/copilot-review-gate.md
  - .github/workflows/copilot-review-gate.yml
started: 2026-08-17
updated: 2026-08-17
plan: (none)
pr: '#740'
issue: #732
---

## What

Correct the Copilot review gate break-glass ladder: order it by what actually
recovers a stale `Copilot review complete` status, keep the rungs that only work
for the other failure (a head Copilot never reviewed) and say so, restate the
known limitation as the measured split rather than a universal, and fix the
`pull_request_review` ref claim in the workflow comment.

## Status / next

- Current step: implemented, full gate green, pushed to #740 (draft)
- Blockers: none
- Next: verification, then ready/merge by the caller
