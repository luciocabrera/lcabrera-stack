---
id: create-defaults-to-full
title: feat(devkit): create defaults to the full rung and finishes the setup itself
owner: agent:claude
status: review
branch: feat/1222-create-defaults-to-full
area:
  - packages/devkit/scripts/create*.mjs
  - packages/devkit/scripts/command-create*.mjs
  - packages/devkit/scripts/profile-flag*.mjs
  - packages/devkit/scripts/create-*.test.mjs
  - packages/devkit/scripts/command-router.mjs
  - packages/devkit/scripts/devkit.mjs
  - packages/devkit/scripts/hooks-path.test.mjs
  - packages/devkit/scripts/sync-consumer-region.test.mjs
  - packages/devkit/assets/full/COMMANDS.md
  - packages/devkit/assets/full/apps/web/package.json
  - packages/devkit/assets/full/apps/web/vite.config.ts
  - packages/devkit/README.md
  - packages/create-lcabrera-stack/**
  - scripts/verify-devkit-workspace.mjs
  - scripts/verify-devkit-registry.mjs
  - scripts/lib/devkit-workspace*.mjs
  - scripts/lib/devkit-tree-run*.mjs
  - scripts/lib/devkit-tarball-shim.mjs
  - .github/workflows/check-safe.yml
  - .github/workflows/created-tree-registry.yml
  - docs/decisions/ADR-*create-defaults*
  - docs/product/requirements/one-command-leaves-a-working-repository.md
  - .changeset/create-defaults-to-full*.md
started: 2026-10-01
updated: 2026-10-01
plan: (none)
pr: '#1237'
issue: #1222
---

## What

feat(devkit): create defaults to the full rung and finishes the setup itself

## Status / next

- Current step: implemented; gate green; PR #1237 open as draft
- Blockers: none
- Next:
