---
id: static-table-header-reuse
title: fix(ui)!: one Table title — the virtual header row in both layouts, caption removed
owner: agent:claude
status: active
branch: fix/1653-static-table-header-reuse
area:
  - packages/ui/src/components/Table/**
  - packages/ui/README.md
  - packages/ui/src/benchmarks/tableLayouts.bench.tsx
  - packages/ui/src/PATTERNS.md
  - reports/api-surface/ui.txt
  - docs/product/requirements/render-a-small-read-only-table-that-sizes-to-its-rows.md
  - apps/showcase/src/routes/evals/cost/**
  - apps/showcase/src/routes/evals/quality/**
  - .changeset/static-table-header-row.md
  - apps/showcase/src/routes/evals/compare/**
  - apps/showcase/src/routes/evals/flaky/**
  - apps/showcase/src/routes/evals/health/**
  - apps/showcase/src/routes/evals/adjudications/**
  - apps/showcase/src/routes/evals/confusion/**
  - apps/showcase/src/routes/evals/constants/evalsDashboard.constants.ts
  - apps/showcase/e2e/evals/adjudications.spec.ts
  - apps/showcase/e2e/evals/evalsPage.ts
  - packages/ui/src/components/VirtualSelect/VirtualSelectTrigger/VirtualSelectTrigger.stylex.ts
started: 2026-11-20
updated: 2026-11-22
plan: (none)
pr: '#1654'
issue: #1653
---

## What

fix(ui): give the static Table the virtual header row and name it from its title

## Status / next

- Current step: caption removed, every evals table on title, gate and evals e2e green
- Blockers: none
- Next: merge TableStaticContent into TableContent (separate claim)
