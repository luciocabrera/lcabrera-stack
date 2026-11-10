---
id: evals-cost-health-confusion-ui
title: Move the cost, health and confusion pages onto @lcabrera/ui
owner: agent:claude
status: review
branch: refactor/1565-evals-cost-health-confusion-ui
area:
  - apps/showcase/src/routes/evals/cost/**
  - apps/showcase/src/routes/evals/health/**
  - apps/showcase/src/routes/evals/confusion/**
  - packages/ui/src/components/NavLink/**
  - packages/ui/src/components/Table/TableBody/utils/**
  - packages/ui/src/components/Table/TableBodyCell/**
  - packages/ui/src/components/Table/Table.staticLayout.test.tsx
  - packages/ui/src/components/TrendSparkline/**
  - apps/showcase/src/routes/evals/FiguresTable/**
  - apps/showcase/e2e/evals/figures.spec.ts
  - apps/showcase/e2e/evals/cost.spec.ts
  - apps/showcase/e2e/evals/health.spec.ts
started: 2026-11-09
updated: 2026-11-10
plan: (none)
pr: '#1608'
issue: #1565
---

## What

Move the cost, health and confusion pages onto @lcabrera/ui

## Status / next

- Current step: gate green, PR #1608 up for review
- Blockers: none
- Next: verifier
