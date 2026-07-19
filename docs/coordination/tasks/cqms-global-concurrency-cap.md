---
id: cqms-global-concurrency-cap
title: Global concurrency cap (env var) for scanner runs (CQMS Phase 2, #64)
owner: agent:claude
status: review
branch: feat/cqms-global-concurrency-cap
area:
  - apps/scan-orchestrator/src/config/env.schema.ts
  - apps/scan-orchestrator/src/queue/**
  - apps/scan-orchestrator/src/server.ts
started: 2026-07-19
updated: 2026-07-19
plan: (none)
pr: '#78'
issue: '#64'
---

## What

Bound how many scans the orchestrator executes on the host at once (PRD_V2 §9,
ADR-033 — host protection, not §8 admission control). Add a `MAX_CONCURRENT_SCANS`
env var (default 3) and turn the sequential drain into a bounded worker pool:
at most N `runQueuedScan` in flight, the rest wait for a slot.

## Status / next

- Current step: `runWithConcurrencyLimit` util + env var + drain rewire + tests.
- Next: quality gate, PR (Closes #64).
