---
id: deps-refresh-1540
title: Refresh the catalog, Vite+ 1.4, the action pins and Node 26.13.0
owner: agent:claude
status: review
branch: build/1540-deps-refresh
area:
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - package.json
  - .node-version
  - biome.jsonc
  - .github/workflows/**
  - .changeset/raise-the-shipped-dependency-floors-for-node-26-13.md
  - .changeset/raise-the-vite-config-peers-to-vite-plus-1-4.md
  - packages/devkit/assets/workspace/**
  - packages/devkit/scripts/workspace.mjs
  - packages/devkit/scripts/init.mjs
started: 2026-10-29
updated: 2026-10-29
plan: (none)
pr: #1543
issue: #1540
---

## What

Take over the `vp run deps:refresh` PR: in-range catalog bumps, Vite+ 1.4.0,
GitHub Action pins, Node 26.13.0 and pnpm 12.16.1,
the pins `devkit` emits, and the changesets for the published manifests those
moves reach.

## Status / next

- Current step: CI and review on #1543.
- Blockers: none.
- Next: delete this file when the PR merges.
