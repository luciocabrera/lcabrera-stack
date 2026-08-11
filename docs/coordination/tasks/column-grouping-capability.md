---
id: column-grouping-capability
title: Resolve column grouping capability from the pg catalog
owner: agent:claude
status: active
branch: feat/563-column-grouping-capability
area:
  - packages/server/src/db/group-query-builder/**
  - packages/server/src/db/get-column-grouping-capabilities.util.ts
  - apps/react-router/src/.server/**
started: 2026-08-11
updated: 2026-08-11
plan: docs/agents/planning/table-row-grouping-plan.md
pr: (none)
issue: 563
---

## What

Implements ADR-058's two gates as a single bound-parameter catalogue query plus
the pure resolution rules over its rows: analytical role from the real Postgres
type, aggregate legality from `pg_aggregate`, and a distinguishable refusal
reason per group key.

Unblocks #568 (the walking skeleton) and #573 (the guard rails).

## Status / next

- Current step: docs + changeset
- Blockers: none
- Next: full quality gate, PR
