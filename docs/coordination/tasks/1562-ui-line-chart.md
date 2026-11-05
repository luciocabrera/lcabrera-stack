---
id: 1562-ui-line-chart
title: Add LineChart to @lcabrera/ui
owner: agent:claude
status: review
branch: feat/1562-1562-ui-line-chart
area:
  - packages/ui/src/components/LineChart/**
  - packages/ui/src/public-api.ts
  - packages/ui/src/public-api.test.ts
  - packages/ui/src/stylex-module-paths.test.json
  - reports/api-surface/ui.txt
  - packages/ui/package.json
  - packages/ui/README.md
  - packages/ui/src/INVENTORY.md
  - packages/ui/src/PATTERNS.md
  - .changeset/**
started: 2026-11-02
updated: 2026-11-05
plan: (none)
pr: '#1592'
issue: #1562
---

## What

Add LineChart to @lcabrera/ui

## Status / next

- Current step: round 3 review findings are fixed. A domain narrower than the data clips the line and band and drops the dots and links outside it, and PATTERNS no longer names `TrendSparkline` as following the chart shape.
- Blockers: none
- Next: bot review of this head, then the blind verifier
