---
id: server-read-query-facade
title: Build every read through one entry point
owner: agent:claude
status: review
branch: refactor/997-server-read-query-facade
area:
  - packages/server/src/db/query-builder/**
  - packages/server/src/db/group-query-builder/**
  - packages/server/src/db/*.util.ts
  - packages/server/src/INVENTORY.md
  - packages/server/src/db/ARCHITECTURE.md
  - packages/server/README.md
  - packages/server/package.json
  - reports/api-surface/server*
  - docs/product/requirements/express-a-read-through-one-entry-point.md
  - .changeset/server-read-query-facade.md
  - docs/decisions/ADR-140-build-every-read-through-one-entry-point.md
  - docs/product/requirements/put-a-dimension-across-the-top-of-a-summary.md
started: 2026-10-26
updated: 2026-10-26
plan: (none)
pr: '#1503'
issue: #997
---

## What

Build every read through one entry point

## Status / next

- Current step: built and gated; PR #1503 ready for review
- Blockers: none
- Next:
