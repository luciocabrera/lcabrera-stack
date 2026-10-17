---
id: vite-plus-1-3
title: Take the Vite+ 1.3 upgrade now that declaration emit keeps private types private
owner: agent:grok
status: active
branch: build/1308-vite-plus-1.3
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

- Current step: `vp run check:safe` passed (92/92) on Node 26.7.0. `api-surface:verify` passes; the only snapshot change is `createReactRouterRunConfig` nesting `env` and `input` under `cache`. `vp run --filter @lcabrera/ui bench` printed comparison tables.
- Blockers: none on the emit. `origin/build/1381-deps-refresh` (PR #1382) is two commits ahead of this branch. Do not push onto that branch, and do not merge #1382 from here.
- Next: rebase onto `origin/build/1381-deps-refresh`, then open the PR against that branch so this diff is only the Vite+ upgrade.
