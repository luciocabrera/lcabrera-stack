---
id: deps-refresh-1381
title: Refresh the catalog, the action pins and the Node and pnpm pins
owner: agent:claude
status: review
branch: build/1381-deps-refresh
area:
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - package.json
  - .node-version
  - .github/workflows/**
  - .changeset/raise-the-shipped-dependency-floors-once-more.md
  - .changeset/raise-the-vite-config-peer-floors-once-more.md
  - packages/devkit/assets/workspace/.node-version
  - packages/devkit/scripts/workspace.mjs
  - packages/devkit/scripts/init.mjs
started: 2026-10-17
updated: 2026-10-17
plan: (none)
pr: #1382
issue: #1381
---

## What

Take over the `vp run deps:refresh` PR: in-range catalog bumps, GitHub Action
pins, Node 26.12.0 and pnpm 12.14.0, the pins `devkit` emits, and the
changesets for the published manifests those moves reach.

## Status / next

- Current step: full `vp run check:safe`, then CI.
- Blockers: none.
- Next: delete this file when the PR merges.
