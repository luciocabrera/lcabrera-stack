---
id: copilot-review-complete-check
title: Gate merge on Copilot having reviewed the head commit
owner: agent:claude
status: active
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

- Current step: workflow, script, pure comparison + unit tests and docs written;
  running the quality gate.
- Blockers: none
- Next: push, ready the PR, then confirm the status reports on this PR itself.
