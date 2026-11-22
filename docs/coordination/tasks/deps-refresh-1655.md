---
id: deps-refresh-1655
title: 'build(deps): refresh the catalog and Vite+ 1.7'
owner: agent:claude
status: active
branch: build/1655-deps-refresh
area:
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - package.json
  - packages/devkit/assets/workspace/**
  - packages/devkit/scripts/workspace.mjs
  - .github/workflows/claude-review.yml
  - .github/workflows/grok-review.yml
  - .changeset/devkit-pnpm-12-21-vite-plus-1-7.md
  - .changeset/raise-the-vite-config-peers-to-vite-plus-1-7.md
  - .changeset/eslint-plugin-typescript-eslint-utils-8-73.md
started: 2026-11-22
updated: 2026-11-22
plan: (none)
pr: '#1656'
issue: #1655
---

## What

The in-range catalog refresh from `vp run deps:refresh`, plus Vite+ 1.6.0 → 1.7.0 by hand, with changesets for the published ranges that moved.

## Next

Majors held for their own PRs: Babel 8 (`@babel/core`, `@babel/preset-typescript`) and `eslint-plugin-unicorn` 80.
