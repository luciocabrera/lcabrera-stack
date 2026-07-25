---
id: server-persistence-hardening
title: Harden @lcabrera/server persistence: typed DB errors, transactions, pool tuning
owner: agent:claude
status: review
branch: feat/389-server-persistence-hardening
area:
  - packages/server/**
  - packages/scan-ingestion/src/db/**
  - apps/admin_system/src/routes/cqms/trigger-scan/**
  - docs/decisions/**
  - docs/agents/planning/**
started: 2026-07-25
updated: 2026-07-25
plan: (none)
pr: '#421'
issue: #389
---

## What

Epic #389 in one PR — every child issue (#394 #395 #396 #397 #398 #406):

- ADR-050 (error translation) and ADR-051 (transactions + the `tx` seam),
  promoting two drafts; the pool-tuning draft lands as configuration, no ADR.
- `@lcabrera/server/errors/*` — `mapDbError` + typed errors, applied by every
  executor through one `runQuery` helper.
- `withTransaction` / `runInTransaction` + an optional `tx` on every executor.
- Four pool-tuning env keys wired into `getPool`.
- `admin_system`'s duplicated `hasPostgresErrorCode` and `runMigrations`'
  hand-rolled BEGIN/ROLLBACK both replaced by the package versions.

## Status / next

- Current step: gate green, PR open.
- Blockers: none.
- Next: delete this file when the PR merges.
