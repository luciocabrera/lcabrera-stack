---
id: mutation-skip-stylex
title: Leave StyleX modules out of the mutation gate
owner: agent:claude
status: review
branch: fix/1581-mutation-skip-stylex
area:
  - packages/repo-standards/scripts/fallow-gate*.mjs
  - packages/repo-standards/scripts/*.test.mjs
  - .changeset/**
  - COMMANDS.md
  - packages/devkit/CLASSIFICATION.md
started: 2026-10-30
updated: 2026-10-30
plan: (none)
pr: '#1582'
issue: #1581
---

## What

Leave StyleX modules out of the mutation gate

## Status / next

- Current step: style-module check uses endsWith, waiting on CI for the new head
- Blockers: the previous head failed Claude review and the Grok subscription review. Strict Sonar failed on S6557; this commit is that fix.
- Next: CI on the new head, then review
