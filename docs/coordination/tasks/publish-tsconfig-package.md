---
id: publish-tsconfig-package
title: Publish the TypeScript config factory as @lcabrera/tsconfig
owner: agent:claude
status: review
branch: feat/674-publish-tsconfig-package
area:
  - packages/tsconfig/**
  - packages/ts-configs/**
  - packages/CLAUDE.md
  - packages/vite-configs/vite.lint.shared.config.ts
  - scripts/lib/api-surface-config.mjs
  - scripts/lib/affected-tests.mjs
  - scripts/lib/coverage-workspaces.mjs
  - docs/agents/public-package-suppressions.md
  - AGENTS.md
  - CLAUDE.md
  - COMMANDS.md
  - .changeset/**
  - reports/api-surface/**
started: 2026-08-14
updated: 2026-08-14
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/710
issue: #674
---

## What

Split `packages/ts-configs` per [ADR-069](../../decisions/ADR-069-publish-the-shared-toolchain.md):
the factories and the writer become the published `@lcabrera/tsconfig`
(`packages/tsconfig`), while `@repo/ts-configs` survives as the private host of
`tsconfig.entries.ts` and a one-line runner.

## Status / next

- Current step: implemented, gate green, PR open for review
- Blockers: none
- Next: merge

## Notes

`COMMANDS.md` is contended this wave (#689, #695). The edit here is only what the
change forces: the three workspace-count claims, the §5 row for
`packages/tsconfig`, and the `generate` note pointing at the new package.
