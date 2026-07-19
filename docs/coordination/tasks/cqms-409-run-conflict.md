---
id: cqms-409-run-conflict
title: 409 Conflict surface for concurrent run trigger (CQMS Phase 2, #63)
owner: agent:claude
status: active
branch: feat/cqms-409-run-conflict
area:
  - apps/admin_system/src/routes/cqms/trigger-scan/**
  - packages/scan-ingestion/src/queries/getProjectActiveRun.util.ts
started: 2026-07-19
updated: 2026-07-19
plan: (none)
pr: (none)
issue: '#63'
---

## What

Surface the per-project concurrent-run rejection (DB `ERRCODE 55000`, migration 0021) as a real `409 Conflict` carrying the active `run_id` + elapsed time, plus a
proper alert banner and the (already-present) live trigger-disable. STATUS §3.1,
PRD_V2 §8.

## Status / next

- Current step: query + util + banner + action/loader wiring.
- Next: tests, quality gate, PR (Closes #63).
