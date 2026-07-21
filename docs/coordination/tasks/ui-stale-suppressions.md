---
id: ui-stale-suppressions
title: Clear the stale lint directives in packages/ui and stop new ones accumulating
owner: agent:claude
status: active
branch: fix/ui-stale-suppressions
area:
  - packages/ui/src/components/Tooltip/**
  - packages/ui/src/utils/logger/**
  - packages/ui/src/utils/tests/**
  - packages/vite-configs/eslint.base-custom-rules.shared.config.mjs
  - packages/vite-configs/eslint.custom-rules.shared.config.mjs
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #211
---

## What

`packages/ui` carried 22 inline suppressions in a package Rule 11 says is never
suppressed. 12 suppressed nothing in either engine, 5 were Oxlint directives
spelled as ESLint ones, and only 7 sites were real — covered by two file-level
disables that blinded both files.

`reportUnusedDisableDirectives` was off (for a real reason: Oxlint reads
`eslint-disable` too), which is why the dead ones were invisible. Respelling the
Oxlint five removes that ambiguity, so the option can go on.

## Status / next

- Current step: 22 -> 15, all remaining verified live; ratchet enabled and clean
  across all 17 workspaces; ui suite 2231 tests green.
- Blockers: none.
- Next: PR.
