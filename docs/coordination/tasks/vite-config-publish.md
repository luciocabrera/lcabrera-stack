---
id: vite-config-publish
title: Publish the Vite and lint config layer as @lcabrera/vite-config
owner: agent:claude
status: review
branch: chore/675-vite-config-publish
area:
  - packages/vite-configs/**
  - packages/ts-configs/**
  - packages/utils/eslint.config.mjs
  - packages/utils/vite.config.ts
  - eslint.restrictions.repo.mjs
  - vite.config.ts
  - scripts/lib/api-surface-config.mjs
  - scripts/lib/coverage-workspaces.mjs
  - scripts/lib/eslint-pass-probe.mjs
  - scripts/lib/publish-surface.mjs
  - scripts/verify-lint-plugins.mjs
started: 2026-08-14
updated: 2026-08-15
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/721
issue: #675
---

## What

`packages/vite-configs` becomes the published package `@lcabrera/vite-config`,
with the one-plugin workspace folded in and deleted (ADR-069). The repo data it
carried
— the Oxlint workspace roster, the `@lcabrera/ui`/`@lcabrera/server` import
boundaries, the StyleX source alias, the local env path — becomes configuration
passed in from this repo's own configs.

## Status / next

- Current step: implemented, full gate green, awaiting review
- Blockers: none
- Next: verification

## Known overlaps

- `scripts/lib/publish-surface.mjs` and `scripts/verify-lint-plugins.mjs` are
  also claimed by `publishing-gate-artifact.md` (#715 / PR #719). The overlap
  here is small and additive: `toBuiltPaths` now strips a `.mjs` source
  extension as well as `.ts`/`.tsx`, because this is the first published package
  with a JavaScript entry. #719 rewrites the same file's gate logic; whichever
  lands second rebases.
- `scripts/lib/api-surface-config.mjs` — one line, the new package's directory
  joining `PUBLIC_PACKAGE_DIRS`. Same overlap #676 recorded.
