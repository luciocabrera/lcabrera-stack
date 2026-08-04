---
id: publish-eslint-plugin
title: Publish the custom lint rules as @lcabrera/eslint-plugin (stage 2 of #540)
owner: agent:claude
status: review
branch: feat/540-publish-eslint-plugin
area:
  - packages/eslint-local-rules/**
  - packages/vite-configs/eslint.base-custom-rules.shared.config.mjs
  - packages/vite-configs/eslint.custom-rules.shared.config.mjs
  - scripts/lib/api-surface-config.mjs
  - scripts/lib/suppressions.mjs
  - scripts/lib/coverage-workspaces.mjs
started: 2026-08-04
updated: 2026-08-04
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/542
issue: https://github.com/luciocabrera/vite-react-compiler/issues/540
---

## What

Stage 2 of #540 — the irreversible half. Stage 1 (#541) made the two
repo-coupled rules configurable; this one turns the package into a publishable
one: `src/`+`dist/` restructure behind `vp pack`, the manifest publishing
contract, its own LICENSE, and enrollment in the `publish`/`api-surface`/`attw`
gates.

The load-bearing part is not the rename. `packages/vite-configs` imported the
plugin by relative filesystem path, an undeclared cross-package edge (ADR-039)
that cannot survive publishing — an external consumer has no
`../eslint-local-rules/`. It is now a declared dependency imported by name,
which also removed the build-before-lint step every workspace carried.

## Status / next

- Current step: quality gate green; opening the PR.
- Blockers: none.
- Next: merge, then the first publish is manual (see the `releasing` skill).
