---
id: audit-api-shared
title: Audit api-shared before it leaves the repo
owner: agent:claude
status: review
branch: refactor/688-audit-api-shared
area:
  - apps/shared/**
  - packages/server/src/filters/**
  - packages/server/src/INVENTORY.md
  - packages/server/src/db/ARCHITECTURE.md
  - packages/server/package.json
  - reports/api-surface/server.txt
  - apps/react-router/src/routes/api/filter-options/.server/distinct.service.ts
started: 2026-08-14
updated: 2026-08-14
plan: (none)
pr: '#703'
issue: #688
---

## What

Classify every module in `apps/shared/src` before the package leaves with the
API servers (#691): each one either leaves with them, or is promoted into
`@lcabrera/server` / `@lcabrera/api`. Verdicts recorded in
`apps/shared/EXTRACTION-AUDIT.md`.

## Status / next

- Current step: implemented; gate green; PR #703 open
- Blockers: none
- Overlap: `self-host-showcase-table-routes` (#687) claims
  `apps/react-router/src/routes/api/**`. This task touches exactly one file
  under it — `filter-options/.server/distinct.service.ts`, which now calls
  `resolveFilterOptionsSource` and types its registry as
  `FilterOptionsSources`. A route added there by #687 does not collide; a new
  distinct source does, in the registry literal only.
- Next: review, then close on merge
