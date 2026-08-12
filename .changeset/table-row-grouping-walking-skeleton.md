---
'@lcabrera/ui': minor
---

The Table can group rows server-side by one column, end to end.

A route opts in with one flag on its loader `meta` — `isGroupingEnabled: true`,
the same channel `crud`, `isKeysetEnabled` and `isServerFilterEnabled` already
use (ADR-063). From that flag, `createTableRouteLoader` reads a `grouping` search
param, sanitizes the keys against the route's own columns, seeds the table's
grouping state, and hands the keys to the route's `fetchPage` alongside the
filters and effective sort it already receives. Absent means off: a route that
declares nothing ignores the param entirely.

**What ships**

- `isGroupable` joins the column capabilities resolved by
  `resolveColumnCapabilities`, defaulting to `true` like its siblings, so a route
  marks a column ungroupable rather than marking every other one groupable. The
  row-actions column declares `isGroupable: false` for itself.
- A `grouping` search param in the same plain compact JSON as `sorting` and
  `filters` — `{"keys":["order_status"]}` — so a grouped view is shareable and
  restores in a fresh tab (ADR-061). It rides the existing persist-cookie flow;
  no new route and no new mechanism.
- A grouping store on the Table's **config** context, with
  `useGetTableGroupingKeys` and `useSetTableGrouping`. It is on the config
  context deliberately: a grouping change causes a navigation, and the data
  context is re-created by that navigation, so state placed there would be wiped
  by its own effect.
- Two commands in the column header menu — "Group by This" and "Clear Grouping" —
  rendered only when the route declared the capability, with `GroupRowsIcon` and
  `UngroupRowsIcon` added to the icon family.
- `TableGroupHeaderRow`, which renders one group as an ordinary body row. It
  composes `TableRow`, so it paints at the store's `rowHeight` and the
  virtualization window arithmetic holds unchanged under grouping.
- `TableGroupRowSummary` / `TableGroupRow` and `TABLE_GROUP_ROW_FIELD` — the
  contract a route's grouped read writes and the table reads. The renderer asks
  each **row** whether it is a group rather than asking the configuration, so a
  group row and a detail row can arrive in the same result.
- Row identity for group rows, derived from the group's own key and value with a
  third disjoint prefix, so a grouped result does not fall back to positional
  keys (ADR-062).

**A malformed `grouping` param yields a flat table, not a half-applied query.**
The codec admits one member named `keys` holding strings and refuses the whole
payload for anything else; the loader-side sanitizer then refuses the whole list
if one key is not a groupable column of that route, or if a key repeats. Key
order is the query's nesting order, so dropping one key silently would answer a
different question from the one the URL describes.

**Additive for existing consumers.** A route that declares no grouping meta
renders the same header menu it did before, returns the same loader fields, and
sends the same request. `TableMetaState` gains two optional members
(`groupingKeys`, `isGroupingEnabled`) and `TableColumn` one (`isGroupable`);
`resolveColumnCapabilities` returns one more resolved flag, which is a widening
for anything destructuring it.

**Not in this release:** multi-key grouping, choosing aggregates, rollup and cube
emission, expanding and collapsing groups, and the settings-drawer section. The
grouped read applies a fixed `count(*)` per group.
