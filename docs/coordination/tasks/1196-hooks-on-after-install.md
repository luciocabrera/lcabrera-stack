---
id: 1196-hooks-on-after-install
title: fix(devkit): the hooks a created repository ships run without a manual git config
owner: agent:claude
status: review
branch: fix/1196-1196-hooks-on-after-install
area:
  - packages/devkit/scripts/create*.mjs
  - packages/devkit/scripts/command-create*.mjs
  - packages/devkit/scripts/command-init.mjs
  - packages/devkit/scripts/hooks-path*.mjs
  - packages/devkit/scripts/git-exec.mjs
  - packages/devkit/scripts/closure-shipped-plant.test.mjs
  - packages/devkit/scripts/workspace.mjs
  - packages/devkit/assets/workspace/scripts/**
  - packages/devkit/assets/root/COMMANDS.md
  - packages/devkit/README.md
  - scripts/verify-devkit-workspace.mjs
  - scripts/lib/devkit-workspace*.mjs
  - COMMANDS.md
  - .changeset/**
started: 2026-09-30
updated: 2026-09-30
plan: (none)
pr: '#1209'
issue: #1196
---

## What

fix(devkit): the hooks a created repository ships run without a manual git config

## Status / next

- Current step: built, gate green, PR ready for review
- Blockers: none
- Next: review and merge
