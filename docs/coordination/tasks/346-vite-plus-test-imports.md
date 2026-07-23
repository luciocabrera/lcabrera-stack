---
id: 346-vite-plus-test-imports
title: Adopt vite-plus/test imports; retire the vitest-direct convention
owner: agent:claude
status: review
branch: refactor/346-vite-plus-test-imports
area:
  - apps/**/*.test.ts
  - apps/**/*.test.tsx
  - packages/**/*.test.ts
  - packages/**/*.test.tsx
  - packages/ui/src/utils/tests/**
  - docs/cqms/decisions/ADR-045-vite-plus-test-imports.md
started: 2026-07-23
updated: 2026-07-23
plan: (none)
pr: (none)
issue: #346
---

## What

Part B of the vite-plus leverage effort: rewrite every source `from 'vitest'` to
`from 'vite-plus/test'` (841 files), update the AGENTS.md convention line, and
record the re-evaluation in ADR-045. No behavioural change — `vite-plus/test` is
`export * from 'vitest'`. Enforcement (a `no-restricted-imports` ban) is a
separate follow-up.

## Status / next

- Current step: codemod + docs + ADR done; running the full gate.
- Blockers: none.
- Next: PR; then the enforcement follow-up (PR-3).
