---
id: server-boundary-lint
title: feat(tooling): lint-enforce the .server boundary for db access
owner: agent:claude
status: review
branch: feat/server-boundary-lint
area:
  - packages/vite-configs/eslint.custom-rules.shared.config.mjs
started: 2026-07-20
updated: 2026-07-20
plan: (none)
pr: '#119'
issue: #118
---

## What

Phase 2 of the `.server` adoption (Phase 1 merged: #117). Extend the existing
`enforceServerClientImportBoundary` eslint mechanism so direct database access
(`pg`, anything under `@repo/data-access/db`) is server-only, and exempt
`.server/` directories (not just the `.server.ts` file suffix).

## Status / next

- Rebased onto main after #117 merged; PR #119 retargeted to main.
- Path-based db ban (per review feedback) — no per-util enumeration; type-only
  imports stay allowed. Scoped to the two opted-in RR apps; both at 0 violations.
- Next: merge.
