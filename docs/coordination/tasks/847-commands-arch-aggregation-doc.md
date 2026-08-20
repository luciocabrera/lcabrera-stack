---
id: 847-commands-arch-aggregation-doc
title: Correct the aggregation-command paragraphs in commands/ARCHITECTURE.md
owner: agent:claude
status: review
branch: docs/847-847-commands-arch-aggregation-doc
area:
  - packages/ui/src/components/Table/commands/ARCHITECTURE.md
started: 2026-08-20
updated: 2026-08-20
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/849
issue: #847
---

## What

Correct the aggregation-command paragraphs in `commands/ARCHITECTURE.md` that
#831 invalidated: the store holds an ordered list of `(columnKey, fn)` records
rather than one aggregate per column, and the aggregation commands derive their
state through `deriveAggregateCommandState`, not the shared toggle predicate.

## Status / next

- Current step: rewritten, full gate green, PR up for review
- Blockers: none
- Next: merge
