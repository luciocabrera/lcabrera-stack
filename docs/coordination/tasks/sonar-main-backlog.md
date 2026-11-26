---
id: sonar-main-backlog
title: Clear the open SonarCloud issues on main
owner: agent:claude
status: active
branch: fix/1663-sonar-main-backlog
area:
  - packages/ui/src/components/Table/**/*.types.ts
  - packages/ui/src/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/**/*.hook.ts
  - packages/ui/src/components/Table/shared/ColumnWidthPresetButtons/*.hook.ts
  - packages/ui/src/components/Table/TableBody/utils/buildTableBodyCellDescriptor.util.tsx
  - packages/ui/src/components/Table/contexts/TableData/data/actions/useFetchMoreData.hook.ts
  - packages/ui/src/components/Navbar/Navbar.types.ts
  - packages/ui/src/types/ui.types.ts
  - packages/server/src/table-page/create-table-loader-reads.util.ts
  - reports/api-surface/*.txt
  - apps/showcase/src/routes/evals/**/*.test.tsx
  - docs/workflow.html
  - docs/site.css
  - .github/workflows/check-safe.yml
  - evals/pr-report/select-skills.mjs
  - packages/repo-standards/scripts/verify-attw.mjs
  - scripts/lib/plan-issues-github*.mjs
  - scripts/lib/sonar-wait*.mjs
  - scripts/sync-project-status.mjs
  - scripts/coordination-claim.sh
started: 2026-11-26
updated: 2026-11-26
plan: (none)
pr: #1664
issue: #1663
---

## What

Clear the open SonarCloud issues on main

## Status / next

- Current step: just claimed
- Blockers: none
- Next:
