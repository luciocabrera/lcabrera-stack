---
id: grouped-virtualization-a11y
title: Grouped virtualization invariant and tree accessibility sweep
owner: agent:claude
status: review
branch: chore/577-grouped-virtualization-a11y
area:
  # Narrowed to what the audit turned out to need. The five criteria covering
  # the Table tree were already met there, so nothing under it is being edited
  # — and a glob claimed but not used is a lock nobody benefits from.
  - packages/ui/src/components/Icons/**
started: 2026-08-20
updated: 2026-08-20
plan: (none)
pr: (none)
issue: #577
---

## What

Grouped virtualization invariant and tree accessibility sweep

## Status / next

- Current step: review
- Blockers: none

## The audit, criterion by criterion

Five of the six were already met, and the sixth was a real hole.

| Criterion                                         | Where it is met                                                                                                                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Height invariant with every group row kind        | `TableBody.grouping.test.tsx` — the 60-row harness emits subtotals every fourth row and a grand total last, so the `offsetY + rows + spacer === total` sum runs over all three kinds |
| Both expanded and collapsed                       | expanded above; collapsed in `Table.treeExpansion.test.tsx`, which asserts the same sum after two folds                                                                              |
| Tree roles, levels, expansion, position, set size | `Table.groupedGridSemantics.test.tsx`                                                                                                                                                |
| One focusable tab stop                            | `Table.treeExpansion.test.tsx` — asserts `<= 1`, which is the honest form: zero is correct before the grid is entered                                                                |
| **New icons in the render sweep**                 | **was false** — four icons were uncovered, two of them the fold-all pair added by #774                                                                                               |

The sweep is a hand-written list, which is what lets it assert each icon's own
default size — and what let it fall behind silently. It is now checked against
the directory, so a new icon fails on the day it lands.
