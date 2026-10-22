---
id: devkit-filter-fail-if-no-match
title: fix(devkit): make generated and published vp run --filter calls fail on no match
owner: agent:claude
status: active
branch: fix/1463-devkit-filter-fail-if-no-match
area:
  - packages/devkit/scripts/workspace*
  - packages/repo-standards/scripts/changed-runner*
  - packages/repo-standards/scripts/merge-coverage*
  - packages/repo-standards/scripts/coverage-report*
  - packages/repo-standards/scripts/ci-commands*
  - packages/repo-standards/scripts/commands-doc*
  - packages/repo-standards/scripts/verify-commands-doc*
  - packages/repo-standards/scripts/doc-register-read.mjs
  - packages/repo-standards/README.md
  - packages/repo-standards/ARCHITECTURE.md
  - packages/devkit/assets/root/COMMANDS.md
  - packages/devkit/assets/full/COMMANDS.md
  - COMMANDS.md
  - AGENTS.md
  - docs/README.md
  - .changeset/devkit-filter-fail-if-no-match*
started: 2026-10-22
updated: 2026-10-22
plan: (none)
pr: '#1483'
issue: #1463
---

## What

fix(devkit): make generated and published vp run --filter calls fail on no match

## Status / next

- Current step: implementing
- Blockers: none
- Next:
