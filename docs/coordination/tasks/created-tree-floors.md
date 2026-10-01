---
id: created-tree-floors
title: fix(devkit): a created tree resolves the release that wrote it
owner: agent:claude
status: review
branch: fix/1219-created-tree-floors
area:
  - scripts/verify-devkit-registry.mjs
  - scripts/lib/devkit-tree-run.mjs
  - .github/workflows/created-tree-registry.yml
  - scripts/sync-devkit-pins.mjs
  - scripts/verify-shipped-ranges.mjs
  - scripts/lib/shipped-ranges.mjs
  - packages/devkit/scripts/create.mjs
  - packages/devkit/assets/workspace/pnpm-workspace.yaml
  - packages/devkit/assets/workspace/apps/web/package.json
  - packages/create-lcabrera-stack/README.md
  - .changeset/created-tree-floors*.md
  - scripts/lib/shipped-range-sources.mjs
  - scripts/lib/shipped-floors.mjs
  - scripts/lib/shipped-floors.test.mjs
  - scripts/lib/devkit-tree-run.test.mjs
  - packages/devkit/scripts/create-toolchain-floor.test.mjs
  - docs/decisions/ADR-117-ship-a-version-band-and-gate-it-against-what-this-repository-publishes.md
  - COMMANDS.md
  - package.json
  - scripts/raise-shipped-floors.mjs
  - scripts/release-version.mjs
  - scripts/lib/release-version.test.mjs
started: 2026-10-01
updated: 2026-10-01
plan: (none)
pr: "#1224"
issue: #1219
---

## What

fix(devkit): a created tree resolves the release that wrote it

## Status / next

- Current step: round 2 review fixes (#1226 folded in)
- Blockers: none
- Next:
