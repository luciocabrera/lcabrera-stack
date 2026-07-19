---
id: cqms-pin-run-snapshot
title: Pin runs to their snapshot (migration 0029 + collection) — ADR-034 / STATUS §3.4
owner: agent:claude
status: review
branch: worktree-cqms-pin-run-snapshot
area:
  - packages/scan-ingestion/src/db/migrations/0029_pin_run_to_snapshot.sql
  - packages/scan-ingestion/src/ingestion/snapshots/saveProjectSnapshot.ts
  - packages/scan-ingestion/src/queries/markScanFailed.util.ts
  - apps/scan-orchestrator/src/queue/runQueuedScan.ts
started: 2026-07-19
updated: 2026-07-19
plan: (none)
pr: '#73'
issue: '#62'
---

## What

Implement ADR-034: pin a run to the snapshot it was triggered on, retain that
snapshot until the run finishes, then collect it. Fixes STATUS §3.4 (a sync
mid-run re-resolved the scan target and could delete the tree under a running scan).

## Status / next

- Current step: migration 0029 + repro test.
- Blockers: none.
- Next: wire orchestrator collection (rmSync the path finalize returns); verify on DB.
