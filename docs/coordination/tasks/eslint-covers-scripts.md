---
id: eslint-covers-scripts
title: Lint the workspace scripts directories
owner: agent:claude
status: review
branch: chore/1117-eslint-covers-scripts
area:
  - packages/vite-configs/src/eslint.base-custom-rules.shared.config.mjs
  - packages/repo-standards/scripts/**
  - packages/devkit/scripts/**
  - packages/create-lcabrera-stack/scripts/**
  - packages/ui/scripts/**
  - apps/showcase/scripts/**
started: 2026-09-08
updated: 2026-09-08
plan: (none)
pr: #1122
issue: #1117
---

## What

`GLOBAL_IGNORES` in the shared ESLint config carries `'scripts/**'`, and three
public packages keep all their source there — so the pass reads 2 of 228 files
in `@lcabrera/repo-standards`, 6 of 64 in `@lcabrera/devkit` (none its own
source) and 2 of 4 in `create-lcabrera-stack`. Remove the ignore and fix what
surfaces.

Both copies of `GLOBAL_IGNORES` carried it — the base factory and the React one
— so `packages/ui/scripts` and `apps/showcase/scripts` were hidden too. 1,398
findings across five workspaces, now zero.

Branched off `chore/1115-local-gate-parity` (#1116), whose new files live in
`packages/repo-standards/scripts/` and are linted by this change. Retarget to
`main` once that merges.

`coordination:verify` warns that this overlaps `local-gate-parity` on
`packages/repo-standards/scripts/**`. That is the stack, not a collision: same
owner, and this branch contains that one. Serialised in the git sense — #1116
merges first. The warning is accepted rather than silenced by narrowing a glob
that would then be untrue.

## Status / next

- Current step: zero findings; running the gate
- Blockers: none
- Next: PR body, then review
