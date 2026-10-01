---
id: full-rung-orders-route
title: feat(devkit): the full rung serves the orders table from Postgres
owner: agent:claude
status: review
branch: feat/1079-full-rung-orders-route
area:
  - packages/devkit/assets/full/apps/web/src/**
  - packages/devkit/assets/full/apps/web/package.json
  - packages/devkit/scripts/config.mjs
  - packages/devkit/scripts/workspace-app.test.mjs
  - packages/devkit/scripts/workspace-full*.test.mjs
  - packages/devkit/README.md
  - packages/devkit/ARCHITECTURE.md
  - packages/server/src/table-page/create-table-loader-reads.util*
  - packages/server/package.json
  - packages/server/src/INVENTORY.md
  - packages/api/src/http/**
  - packages/ui/src/components/TableGroupDetailsView/**
  - packages/ui/src/components/Table/TableLayout/**
  - packages/ui/src/routing/loaders/createTableRouteLoader.util*
  - packages/ui/src/components/Table/contexts/TableConfig/columns/actions/hooks/usePersistTableStateAction.hook.ts
  - packages/ui/src/components/Table/contexts/TableConfig/meta/actions/usePersistTableUiFlagsAction.hook.ts
  - packages/ui/src/constants/globalSettings.constants.ts
  - packages/ui/src/public-api.ts
  - packages/ui/src/INVENTORY.md
  - packages/ui/src/stylex-module-paths.test.json
  - apps/showcase/src/routes/enterprise-orders/enterprise-orders.loader.ts
  - apps/showcase/src/routes/enterprise-orders/group-details/**
  - apps/showcase/src/routes/enterprise-orders/fetchOrderGroupPage.service.ts
  - reports/api-surface/**
  - docs/decisions/ADR-121*
  - docs/decisions/ADR-127*
  - .changeset/full-rung-orders-route*.md
started: 2026-10-01
updated: 2026-10-01
plan: (none)
pr: https://github.com/luciocabrera/lcabrera-stack/pull/1235
issue: #1079
---

## What

feat(devkit): the full rung serves the orders table from Postgres

## Status / next

- Current step: just claimed
- Blockers: none
- Next:
