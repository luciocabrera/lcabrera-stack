---
id: lockfile-drift-from-hook-rules
title: build(deps): detect a stale lockfile after an edit to the TypeScript 6 hook rules
owner: agent:claude
status: review
branch: build/1496-lockfile-drift-from-hook-rules
area:
  - docs/decisions/ADR-139-*
  - package.json
  - .github/workflows/check-safe.yml
  - COMMANDS.md
  - packages/devkit/CLASSIFICATION.md
started: 2026-10-25
updated: 2026-10-25
plan: (none)
pr: '#1497'
issue: #1496
---

## What

build(deps): detect a stale lockfile after an edit to the TypeScript 6 hook rules

## Status / next

- Current step: `deps:lockfile` (`vp dedupe --check`) chained into CI's Quality Gate and `check:safe`, kept out of `check:push`; `deps:refresh` ends with `vp dedupe`; ADR-139 corrected
- Blockers: none
- Next: review
