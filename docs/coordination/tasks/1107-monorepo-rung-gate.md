---
id: 1107-monorepo-rung-gate
title: Build a monorepo-rung tree in a gate and run its own tasks
owner: agent:claude
status: review
branch: ci/1107-1107-monorepo-rung-gate
area:
  - scripts/verify-devkit-workspace.mjs
  - scripts/verify-devkit-tarball.mjs
  - scripts/lib/devkit-workspace*
  - scripts/lib/devkit-pack.mjs
  - package.json
  - COMMANDS.md
  - packages/devkit/CLASSIFICATION.md
  - .github/workflows/check-safe.yml
  - docs/product/requirements/one-command-leaves-a-working-repository.md
started: 2026-09-30
updated: 2026-09-30
plan: (none)
pr: https://github.com/luciocabrera/lcabrera-stack/pull/1200
issue: #1107
---

## What

Build a monorepo-rung tree in a gate and run its own tasks

## Status / next

- Current step: gate built and wired into CI; PR #1200 in review
- Blockers: none
- Next: address review threads, then merge
