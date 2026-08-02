---
id: generic-table-route-data-path
title: Generic table-route data path — fetcher, page query, view
owner: agent:claude
status: review
branch: refactor/490-generic-table-route-data-path
area:
  - packages/api/src/http/**
  - packages/ui/src/routing/shared/**
  - packages/ui/src/components/TableRouteView/**
  - packages/ui/src/hooks/useTableRoutePage.hook.ts
  - apps/react-router/src/routes/enterprise-orders/**
  - apps/react-router/src/routes/car-sales-infinite/**
  - apps/react-router/src/routes/wide-alltypes-150/**
  - apps/react-router/src/services/**
started: 2026-08-02
updated: 2026-08-02
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/491
issue: https://github.com/luciocabrera/vite-react-compiler/issues/490
---

## What

Extract the client half of the paginated-table data path — today duplicated
across three routes — into three generics, one per layer:

| Layer      | New artifact                                   | Package                       |
| ---------- | ---------------------------------------------- | ----------------------------- |
| Fetch      | `createPaginatedFetcher`                       | `@lcabrera/api/http`          |
| Page query | `buildTablePageQuery` + `toKeysetCursorValues` | `@lcabrera/ui/routing/shared` |
| View       | `useTableRoutePage` + `TableRouteView`         | `@lcabrera/ui`                |

The loader half is already generic (`createTableRouteLoader`); these share its
"table route" vocabulary. `filter` and keyset `cursor` are opt-in, because only
the enterprise-orders endpoint understands them — the two simpler routes must
keep byte-identical request shapes.

## Status / next

- Current step: PR #491 open, full quality gate green
- Blockers: none
- Next: review → merge → delete this file
