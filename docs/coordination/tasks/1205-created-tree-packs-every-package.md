---
id: 1205-created-tree-packs-every-package
title: ci(tooling): the created-tree gate installs every @lcabrera package from this checkout
owner: agent:claude
status: review
branch: ci/1205-1205-created-tree-packs-every-package
area:
  - scripts/verify-devkit-workspace.mjs
  - scripts/verify-devkit-registry.mjs
  - scripts/lib/devkit-workspace*
  - scripts/lib/devkit-pack.mjs
  - COMMANDS.md
  - .github/workflows/check-safe.yml
  - .github/workflows/release.yml
  - .github/workflows/created-tree-registry.yml
  - package.json
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - scripts/lib/devkit-tree-run*
  - packages/devkit/CLASSIFICATION.md
  - docs/decisions/ADR-125-*
started: 2026-09-30
updated: 2026-09-30
plan: (none)
pr: https://github.com/luciocabrera/lcabrera-stack/pull/1207
issue: #1205
---

## What

ci(tooling): the created-tree gate installs every @lcabrera package from this checkout

## Status / next

- Current step: in review (round 2 fixes pushed)
- Blockers: none
- Next:
