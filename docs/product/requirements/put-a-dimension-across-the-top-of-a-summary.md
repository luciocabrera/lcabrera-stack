---
id: put-a-dimension-across-the-top-of-a-summary
lines:
  - application
persona: data-user
state: met
packages:
  - server
  - ui
requires:
  - browse-and-edit-a-table-without-writing-sql
issues:
  - 1170
  - 1164
  - 660
evidence:
  - type: command
    ref: vp run test:ci
  - type: test
    ref: packages/ui/src/components/Table/Table.columnAxis.test.tsx
  - type: test
    ref: packages/server/src/db/group-query-builder/build-group-query.util.test.ts
  - type: code
    ref: packages/server/src/db/group-query-builder/expand-column-axis-aggregates.util.ts
  - type: doc
    ref: docs/decisions/ADR-123-a-grouped-read-can-put-a-dimension-on-the-column-axis.md
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
- The grid paints a successful result rather than refusing it for width.
  Decided by `Table.columnAxis.test.tsx` → "paints unique axis values as
  headers with the measure in the cells". Column virtualization is a later
  child of #660.

## Notes

The SQL half landed with #1164. The paint half is `Table.columnAxis.test.tsx`.
Breaking the header assertion in that file fails `vp run test:ci`.
