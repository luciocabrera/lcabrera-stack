---
id: chart-geometry-trend-sparkline
title: Add chart geometry to utils and redraw TrendSparkline on it
owner: agent:claude
status: review
branch: feat/1561-chart-geometry-trend-sparkline
area:
  - packages/utils/**
  - packages/ui/src/components/TrendSparkline/**
  - packages/ui/src/public-api.ts
  - .changeset/**
  - packages/ui/src/INVENTORY.md
  - packages/ui/README.md
  - reports/api-surface/ui.txt
  - reports/api-surface/utils.txt
  - scripts/inventory-drift-baseline.json
  - packages/ui/src/stylex-module-paths.test.json
started: 2026-10-30
updated: 2026-10-30
plan: (none)
pr: https://github.com/luciocabrera/lcabrera-stack/pull/1577
issue: #1561
---

## What

Add chart geometry to utils and redraw TrendSparkline on it

## Status / next

- Current step: round 2 review fixes pushed (Sonar findings in decimate,
  linear-time decimate, props union, lone-point segments, niceTicks count 0)
- Blockers: none
- Next: rebase on main after #1572 merges, then re-run the gate
