---
id: deps-refresh-1605
title: Refresh the catalog and the pins devkit emits
owner: agent:grok
status: review
branch: build/1605-deps-refresh
area:
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - package.json
  - .github/workflows/add-to-project.yml
  - .github/workflows/claude-review.yml
  - .changeset/raise-the-emitted-pnpm-pin.md
  - .changeset/raise-vite-config-peer-floors.md
  - packages/devkit/scripts/workspace.mjs
started: 2026-11-09
updated: 2026-11-09
plan: (none)
pr: #1606
issue: #1605
---

## What

The `vp run deps:refresh` run: in-range catalog bumps, the GitHub Action
pins taze moved, pnpm 12.18.0, and the pnpm pin devkit writes into a new
repository. TypeScript, Biome 2.5, eslint-plugin-unicorn 78, and the
exact Vite+ 1.4.0 pin stay where they are.

## Status / next

- Current step: CI and review on #1606.
- Blockers: none.
- Next: delete this file when the PR merges.
