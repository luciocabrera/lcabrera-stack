---
id: document-the-grouping-surface
title: Document the grouping surface and its SQL-backed precondition
owner: agent:claude
status: review
branch: docs/579-document-the-grouping-surface
area:
  - packages/ui/src/components/Table/ARCHITECTURE.md
  - packages/ui/src/INVENTORY.md
  - packages/ui/src/PATTERNS.md
  - packages/server/src/db/group-query-builder/ARCHITECTURE.md
  - packages/server/src/INVENTORY.md
started: 2026-08-19
updated: 2026-08-19
plan: (none)
pr: 811
issue: #579
---

## What

Document the grouping surface (#579) and state its SQL-backed precondition
(#572). Adds the 19 grouping artifacts missing from the two package inventories,
records why no client-side grouping path is offered, and documents the
grouping/expansion store split.

## Status / next

- Current step: written, docs gates green, PR #811 open for review
- Blockers: none
- Next: address review, then merge
