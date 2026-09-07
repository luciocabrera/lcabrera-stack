---
id: devkit-monorepo-rung
title: emit the workspace, catalog and configs for a monorepo
owner: agent:claude
status: active
branch: feat/1075-devkit-monorepo-rung
area:
  - packages/devkit/assets/workspace/**
  - packages/devkit/scripts/config.mjs
  - packages/devkit/scripts/config-profiles.test.mjs
  - packages/devkit/scripts/create.mjs
  - packages/devkit/scripts/create.test.mjs
  - packages/devkit/scripts/command-create.mjs
  - packages/devkit/scripts/workspace.mjs
  - packages/devkit/scripts/workspace.test.mjs
  - packages/devkit/scripts/closure.mjs
  - packages/devkit/scripts/closure-classify.mjs
  - packages/devkit/scripts/command-closure.mjs
  - packages/devkit/scripts/sync-executable.test.mjs
  - packages/devkit/scripts/command-create.test.mjs
  - packages/devkit/vite.config.ts
  - packages/devkit/package.json
  - packages/devkit/README.md
  - scripts/lib/devkit-seeds.mjs
  - scripts/lib/devkit-seeds.test.mjs
  - scripts/verify-devkit-seeds.mjs
  - scripts/lib/devkit-tarball.mjs
  - scripts/lib/devkit-tarball.test.mjs
  - reports/api-surface/devkit.txt
  - biome.jsonc
  - .changeset/devkit-monorepo-rung.md
started: 2026-09-07
updated: 2026-09-07
plan: (none)
pr: '#1106'
issue: #1075
---

## What

emit the workspace, catalog and configs for a monorepo

## Status / next

- Current step: round 2 review findings addressed; gate green
- Blockers: none
- Next: awaiting the coordinator to ready the PR
- Overlap: #1096 (`refactor/1096-gate-scripts-typescript`, in review) also claims
  `packages/devkit/package.json` and `scripts/lib/devkit-tarball*.mjs`. Both
  touches here are additive — one devDependency, and one prefix skip in the
  stray-file rule — so whichever lands second rebases onto the other.
