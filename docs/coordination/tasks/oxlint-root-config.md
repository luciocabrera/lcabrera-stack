---
id: oxlint-root-config
title: Move Oxlint config to the root, per Vite+'s documented monorepo model
owner: agent:claude
status: review
branch: fix/318-oxlint-workspace-config-inert
area:
  - vite.config.ts
  - packages/vite-configs/**
  - apps/*/vite.config.ts
  - packages/*/vite.config.ts
  - scripts/verify-lint-plugins.mjs
  - scripts/lib/lint-plugins*
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: 324
issue: 318
---

Vite+ reads `lint` from the root config only; the per-workspace `lint` blocks
built from `@repo/vite-configs/*-lint` were never loaded. Consolidates them into
one root config with `overrides`, drops the `jsPlugins` bridge (the eslint pass
already runs those plugins), and adds `lint:plugins:verify` so a plugin family
cannot go dark silently again.

Also fixes a regression introduced while investigating this: naming
`lint.plugins` replaces Oxlint's default set, so an earlier partial fix disabled
the `typescript`, `unicorn` and `oxc` families repo-wide.

Follow-ups filed rather than folded in: #325 (jsx-a11y), #326 (vitest).
