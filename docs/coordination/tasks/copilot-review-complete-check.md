---
id: copilot-review-complete-check
title: Gate merge on Copilot having reviewed the head commit
owner: agent:claude
status: review
branch: ci/695-copilot-review-complete-check
area:
  - .github/workflows/copilot-review-gate.yml
  - scripts/copilot-review-status.mjs
  - scripts/lib/copilot-review*
started: 2026-08-14
updated: 2026-08-14
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/707
issue: #695
---

## What

Publish a `Copilot review complete` commit status that is green only while
Copilot's newest review names the pull request's current head commit (#695).

## Status / next

- Current step: PR #707 is ready and green; the gate has reported `pending`,
  `success` and the stale-review `pending` on this PR's own commits.
- Blockers: none
- Next: address review, then merge. A Copilot-triggered run needs approval under
  the repo's current Actions policy — recorded in the gate doc for #698.
