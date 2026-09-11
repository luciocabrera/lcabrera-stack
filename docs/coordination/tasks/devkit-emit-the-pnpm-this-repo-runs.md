---
id: devkit-emit-the-pnpm-this-repo-runs
title: devkit emits a pnpm pin a major behind the one this repo runs
owner: agent:claude
status: review
branch: fix/1179-devkit-emit-the-pnpm-this-repo-runs
area:
  - packages/devkit/scripts/workspace.mjs
  - packages/devkit/scripts/workspace.test.mjs
  - scripts/deps-refresh.sh
  - scripts/sync-devkit-pins.mjs
  - scripts/lib/devkit-pins.mjs
  - scripts/lib/devkit-pins.test.mjs
  - scripts/lib/devkit-emitted-pins.test.mjs
  - .fallowrc.json
  - .changeset/**
started: 2026-09-11
updated: 2026-09-11
plan: (none)
pr: #1180
issue: #1179
---

## What

devkit emits a pnpm pin a major behind the one this repo runs

## Status / next

- Current step: fix committed, gate green, PR ready for review
- Blockers: none
- Next: merge, then delete this file
