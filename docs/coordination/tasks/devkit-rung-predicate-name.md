---
id: devkit-rung-predicate-name
title: Rename the published includesRung predicate to doesProfileIncludeRung
owner: agent:claude
status: active
branch: refactor/1626-devkit-rung-predicate-name
area:
  - packages/devkit/scripts/**
  - reports/api-surface/devkit.txt
  - .changeset/devkit-rename-includes-rung.md
started: 2026-11-11
updated: 2026-11-11
plan: (none)
pr: #1627
issue: #1626
---

## What

Rename `includesRung` in `@lcabrera/devkit/config` to `doesProfileIncludeRung`, the remaining unicorn 79 `consistent-boolean-name` finding. A breaking minor release with no alias.

## Status / next

- Current step: rename committed; `check:safe`, then mark the PR ready
- Blockers: none
- Next: delete this file when the PR merges.
