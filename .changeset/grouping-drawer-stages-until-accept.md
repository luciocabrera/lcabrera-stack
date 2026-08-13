---
'@lcabrera/ui': patch
---

The table settings drawer's Grouping tab stages its edits and applies them on
Accept, like every other section in that drawer.

Previously each edit wrote the live grouping store as it was made. Two things
followed: **Cancel did not cancel** — the edits were already applied — and,
because grouping configuration is URL state, every toggle wrote the `grouping`
search param and re-ran the loader, so expressing one intent with five edits
cost five navigations and five grouped queries.

**What changes**

- Adding, removing or reordering a group key, adding or removing an aggregate,
  and the section's Clear button all write a drawer-local draft. Nothing
  navigates until Accept.
- **Accept applies the whole grouping configuration in exactly one navigation**,
  however many edits were staged. It rides in the same persistence write as the
  staged column state, because both submit through one fetcher and a second
  submission would abort the first.
- Cancel restores the grouping the table had when the drawer opened, with no
  navigation and no loader run. Re-opening the drawer shows the live grouping.

**What is unchanged**

- The column-header grouping menu still applies immediately. It is a direct
  action with no Accept to wait for, and that was never the problem.
- The `grouping` search-param shape, the URL contract and the grouped query are
  untouched.

**For a consumer calling the internals directly**

None of the following is reachable from a published entry point — the `exports`
map has no path into `components/Table/contexts/TableConfig/grouping`, and
`components/Table`'s barrel re-exports only `Table` plus a curated type list —
so a consumer on the documented surface is unaffected. A consumer reaching past
it by deep import is not:

- `useBatchSetTableSettings` now takes `{ grouping, settings }` rather than the
  settings object alone, so the one Accept write can carry both.
- `useSetTableGroupKeys` and `useGetTableGroupingAggregates` are removed. The
  drawer was their last caller and it now stages instead. The live store keeps
  `useToggleTableGroupKey`, `useSetTableColumnAggregate`,
  `useClearTableGrouping`, `useGetTableGroupingKeys` and
  `useGetTableColumnAggregate`, which the column-header menu still uses.
