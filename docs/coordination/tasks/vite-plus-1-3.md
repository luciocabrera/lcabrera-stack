---
id: vite-plus-1-3
title: Take the Vite+ 1.3 upgrade now that declaration emit keeps private types private
owner: agent:grok
status: review
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
  - packages/devkit/assets/**
  - packages/repo-standards/scripts/verify-lint-plugins.mjs
  - .github/skills/lint-toolchain/**
  - .github/skills/health-swarm/**
  - .changeset/pin-the-created-repo-toolchain-at-vite-plus-1-3.md
  - docs/decisions/ADR-042-oxlint-config-at-the-root.md
  - .gitignore
started: 2026-10-17
updated: 2026-10-17
plan: (none)
pr: https://github.com/luciocabrera/lcabrera-stack/pull/1386
issue: https://github.com/luciocabrera/lcabrera-stack/issues/1308
---

## What

Move the catalog pin, the Vite core alias, and the Vitest the toolchain bundles from Vite+ 0.3.0 to 1.3.0. The 1.0 attempt was backed out because packed declarations leaked private types. 1.3.0 bundles the emit fix. The copies `@lcabrera/devkit` writes move with the pin, and `createReactRouterRunConfig` nests build-task cache settings where 1.3 reads them.

## Status / next

- Current step: Claude reviewed `617d29d42` and opened two more threads. ADR-042 now says the never-loaded claim is the Vite+ 0.3 observation, and states what 1.3 does from a package directory. The host gitignore gives `.vitest/` its own note.
- Blockers: none.
- Next: push, reply on the two new threads, and squash-merge #1386 once the required checks pass on that head.
