---
id: a-grouped-grid-reads-as-the-report-i-arranged
lines:
  - application
persona: data-user
state: met
packages:
  - ui
requires:
  - browse-and-edit-a-table-without-writing-sql
issues: []
evidence:
  - type: command
    ref: vp run test:ci
  - type: test
    ref: packages/ui/src/components/Table/Table.aggregateColumns.test.tsx
  - type: test
    ref: packages/ui/src/components/Table/TableHeaderCell/TableHeaderActionsMenu/TableHeaderActionsMenu.test.tsx
  - type: code
    ref: packages/ui/src/components/Table/utils/withAggregateColumnOrder.util.ts
  - type: doc
    ref: docs/decisions/ADR-099-the-staged-aggregate-list-orders-the-measure-columns.md
---

# A grouped grid reads as the report I arranged

## Statement

When I summarise a table, I put the numbers in the order I want to read them —
the amounts together, the count at the end. The grid should show me the columns
in that order, and it should keep each column's numbers side by side under the
one heading that names them. When a control in a column's menu cannot do
anything, it should not look like it can: I should not click something, see it
accept, and find nothing changed.

## Acceptance

- The order of the aggregate list decides the order the measure columns paint
  in, across columns and not only within one. Decided by
  `Table.aggregateColumns.test.tsx` → "paints them in the staged order, not the
  declared column order".
- A column's measures paint next to each other whatever the list says, so the
  heading naming them spans them. Decided by the same file → "keeps a column's
  measures under one band when the staged list interleaves them", which also
  asserts the bands.
- The settings drawer's column list and the grid agree about that order.
  Decided by `resolveRenderedColumnKeys.util.test.ts` → "the drawer listing and
  the grid agree about measure order".
- A menu item that the grouped layout would immediately override is disabled and
  says why, and a grouped column can be ungrouped on its own. Decided by
  `TableHeaderActionsMenu.test.tsx` → "the layout actions a grouped column
  cannot take", and by `GroupActions.test.tsx` → "Remove from Grouping".
- None of the above changes an ungrouped grid. Decided by
  `TableHeaderActionsMenu.test.tsx` → "leaves an ungrouped column's menu exactly
  as it was", and by `withAggregateColumnOrder.util.test.ts` → the three
  "returns the inputs untouched" cases.

## Notes

The `command` pointer was checked the way this register requires rather than
assumed: bypassing `withAggregateColumnOrder` in
`getPinnedDerivedColumnsState` fails the two ordering cases with the reported
symptom (`Count` painting first), and dropping the layout lock from
`PinLeftButton` fails the two menu cases. Both were restored; the runs are in
[#1049](https://github.com/luciocabrera/lcabrera-stack/pull/1049).

The contiguity rule is a constraint, not a preference: `resolveHeaderBands`
spans only adjacent columns, so measures of one column that are not neighbours
lose the heading that says what they measure. That is why an interleaved list
paints as one block per column rather than in list positions — the one place
this requirement and the drawer's listing deliberately differ.
