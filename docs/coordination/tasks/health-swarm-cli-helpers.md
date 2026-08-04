---
id: health-swarm-cli-helpers
title: Import the copy-pasted root-script CLI helpers from scripts/lib
owner: agent:claude
status: review
branch: refactor/519-share-root-script-cli-helpers
area:
  - scripts/lib/cli-input.mjs
  - scripts/lib/cli-input.test.mjs
  - scripts/verify-pr.mjs
  - scripts/verify-issue-body.mjs
  - scripts/verify-branch-name.mjs
  - scripts/generate-changelog.mjs
  - scripts/plan-issues.mjs
  - scripts/housekeeping-prune.mjs
  - scripts/coordination-board-live.mjs
started: 2026-08-04
updated: 2026-08-04
plan: (none)
pr: (none)
issue: https://github.com/luciocabrera/vite-react-compiler/issues/519
---

## What

Replaces five byte-identical `flagValue` definitions and two byte-identical
`readStdin` definitions with one shared `scripts/lib/cli-input.mjs`.

## Status / next

- Current step: quality gate
- Blockers: none
- Next: open PR against main
