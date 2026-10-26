---
id: server-joins-decision
title: Decide whether the read builder expresses joins and aggregate filters
owner: agent:claude
status: review
branch: docs/998-server-joins-decision
area:
  - docs/decisions/ADR-*-join*
  - packages/server/src/db/query-builder/ARCHITECTURE.md
  - packages/server/src/db/ARCHITECTURE.md
  - docs/product/requirements/express-a-join-and-an-aggregate-filter.md
started: 2026-10-26
updated: 2026-10-26
plan: (none)
pr: #1520
issue: #998
---

## What

Decide whether the read builder expresses joins and aggregate filters

## Status / next

- Current step: ADR-143 proposed; architecture exclusion lists corrected
- Blockers: the owner's approval of ADR-143 before any join is built
- Next: implement through `buildReadQuery` once approved
