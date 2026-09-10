---
id: put-a-dimension-across-the-top-of-a-summary
lines:
  - application
persona: data-user
state: unmet
packages:
  - server
  - ui
requires:
  - browse-and-edit-a-table-without-writing-sql
issues:
  - 1164
  - 660
evidence:
  - type: test
    ref: packages/server/src/db/group-query-builder/build-group-query.util.test.ts
  - type: code
    ref: packages/server/src/db/group-query-builder/expand-column-axis-aggregates.util.ts
  - type: doc
    ref: docs/decisions/ADR-122-a-grouped-read-can-put-a-dimension-on-the-column-axis.md
---

# I can put a dimension across the top of a summary

## Statement

When I summarise a table I sometimes want a category spread across the top
rather than down the side — years as column headers, regions as rows, a total
in each cell — the way a spreadsheet pivot is read. I should get that from the
same summary I already run, without writing SQL and without losing the row
grouping I already use.

## Acceptance

- A grouped read can name a column axis and returns one measure column per
  distinct value of that axis. Decided by
  `build-group-query.util.test.ts` → "a column axis".
- The ceiling on those columns is supplied by the caller, not invented by the
  package. Decided by `columnAxis.maxDistinct` being required, and by
  `readPivotMaxDistinct` reading `DB_PIVOT_MAX_DISTINCT`.
- The grid paints a successful result rather than refusing it for width. Not
  decided yet — column virtualization is a later child of #660.

## Notes

The SQL half lands with #1164. The requirement stays `unmet` until a reader can
see the matrix in the grid, because that is the persona's test, not whether the
builder emits `FILTER`.
