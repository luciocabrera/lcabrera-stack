---
id: table-render-from-descriptor
title: Extract renderFromDescriptor to its own util
owner: agent:claude
status: review
branch: refactor/244-extract-render-from-descriptor
area:
  - packages/ui/src/components/Table/TableBody/utils/**
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: (none)
issue: #244
---

## What

`renderFromDescriptor` was a second module-level helper inside
`createRenderTableBodyCell.util.ts`, which the one-util-per-file rule forbids
even for private helpers. Extracted to its own `.util.ts` with a colocated test.

## Status / next

- Current step: gate green — ui lint/eslint/typecheck (incl. check:public-api),
  522 test files / 2238 tests
- Blockers: none
- Next: merge
