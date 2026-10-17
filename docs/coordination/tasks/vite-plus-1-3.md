---
id: vite-plus-1-3
title: Take the Vite+ 1.3 upgrade now that declaration emit keeps private types private
owner: agent:grok
status: active
branch: build/1308-vite-plus-1-3
area:
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - vite.config.ts
  - packages/vite-configs/**
  - packages/devkit/assets/workspace/pnpm-workspace.yaml
  - packages/devkit/assets/workspace/packages/typescript-config/package.json
  - packages/ui/src/benchmarks/**
  - packages/eslint-local-rules/vite.config.ts
  - 'packages/*/vite.config.ts'
  - 'apps/*/vite.config.ts'
started: 2026-10-17
updated: 2026-10-17
plan: (none)
pr: (none)
issue: https://github.com/luciocabrera/lcabrera-stack/issues/1308
---

## What

Move the catalog pin, the Vite core alias, and the Vitest the toolchain bundles from Vite+ 0.3.0 to 1.3.0. The 1.0 attempt was backed out because packed declarations leaked private types. 1.3.0 bundles the emit fix. The copies `@lcabrera/devkit` writes move with the pin, and `createReactRouterRunConfig` nests build-task cache settings where 1.3 reads them.

## Status / next

- Current step: rebased onto `origin/main` after #1382 merged. The upgrade commit applied with no conflicts. `vp run check:safe` passed (92/92) on Node 26.7.0 before the earlier rebase onto the refresh branch.
- Blockers: none.
- Next: open the PR against `main`.
