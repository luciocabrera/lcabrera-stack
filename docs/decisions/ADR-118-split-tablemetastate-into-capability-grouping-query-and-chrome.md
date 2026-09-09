---
governs:
  - ui
---

# ADR-118 — Split TableMetaState into capability, grouping query, and chrome

**Status:** Accepted

**Issue:** [#1138](https://github.com/luciocabrera/lcabrera-stack/issues/1138) — blocks [#1141](https://github.com/luciocabrera/lcabrera-stack/issues/1141)

**Relates to:** [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) (live grouping already has a store), [ADR-063](./ADR-063-request-shaping-capabilities-on-the-loader-meta.md) (a request-shaping capability is declared on loader meta), [ADR-068](./ADR-068-a-refused-read-is-rendered-data-not-an-exception.md) (`TableDataState.error` is already `TableResponseError`)

## Context

`TableMetaState` is one exported type on `@lcabrera/ui`. Its members run from
route capabilities (`crud`, `isGroupingEnabled`, `isKeysetEnabled`,
`isServerFilterEnabled`, `groupingCapabilities`, `groupDetailsPath`) through the
grouping query the loader applied (`groupingKeys`, `groupingMode`,
`groupingPeriods`, `groupingAggregates`, `groupingShares`, `totalsPlacement`)
through drawer chrome and layout flags (`density`, striping, rounding, open/pin,
tab order, panel width, `persistenceKey`, page sizes) to a string `error` field.

Three writers share that bag. `getInitialGroupingState` copies the grouping
members into `groupingStore` and every later grouping write goes there, but the
type still accepts a patch that sets `groupingKeys` and `density` together.
Density and the drawer flags write `metaStore` directly. Filter-options fetches
and grid load-more both call `metaStore.set({ error: message })` with a string,
while `TableDataState.error` is already `TableResponseError` — a discriminated
union ADR-068 put on the data store so a refused read is data the grid renders.

The empty body reads `useGetTableDataError`. Nothing in the tree reads
`TableMetaState.error` except the tests that assert the write. A failed
filter-options fetch and a failed load-more therefore land on a field no surface
renders, and they share that field with each other, so either one overwrites the
other.

`groupingStore` already exists beside `metaStore` on `TableConfigProvider`. The
duplication is the type: the grouping query is declared twice, once as the live
store and once as optional members on the bag the other two writers share.

This ADR decides the slices and which store owns each. It does not rename or
split the type in code. That is #1141.

## Problem

A `Partial<TableMetaState>` patch is well-typed for any mix of those members, so
a change in one slice cannot be rejected for touching another. The string
`error` is a third failure channel next to `TableDataState.error`, and it is the
one the filter-options path uses.

## Options considered

1. **Keep one type and document the fields.** Rejected: a comment on the type is
   what ADR-104 already forbids, and a document the compiler does not read is
   how the grouping members survived on meta after `groupingStore` existed.
2. **Split only `error` off and leave the rest.** Rejected: the bag still holds
   grouping query, capability, and chrome. Removing the string does not make a
   density patch illegal on a capability field.
3. **Three types. `groupingStore` owns the grouping query; `metaStore` owns
   capability and chrome as two types; each fetch writes the store that owns
   it, as `TableResponseError`. Chosen.**

## Decision

**`TableMetaState` splits into three types, and a writer patches one of them.**

The names below are the slices. #1141 picks the identifiers the code uses.

### Capability — `metaStore`

Route facts the loader declares. This is the ADR-063 channel: a flag that
changes the request shape lives here, and absent means off.

| Member                                                                              | Role                                                   |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `schemaName`, `tableName`, `title`                                                  | What the grid is bound to                              |
| `crud`, `deleteActionPath`                                                          | Row actions                                            |
| `isGroupingEnabled`, `isGroupingLocked`, `isKeysetEnabled`, `isServerFilterEnabled` | Request-shaping flags                                  |
| `groupingCapabilities`                                                              | Per-column grouping legality from the catalogue        |
| `groupDetailsPath`                                                                  | Where a group row opens its rows                       |
| `hasDefaultGrouping`                                                                | The route shipped a grouping, so empty is a real state |
| `lockedFilters`                                                                     | A scoped read's stated restriction                     |
| `locale`, `additionalMetadata`                                                      | Route-supplied extras                                  |
| `isUrlStateNested`                                                                  | How the route nests search params                      |
| `enablePrefetch`                                                                    | Whether load-more prefetches the next page             |

Capability does not change from a reader gesture. A new store for it is not
required: selectors already isolate the reads, and a fifth store on
`TableConfigProvider` would exist only to hold values that are written at seed.

### Grouping query — `groupingStore`

Live keys, mode, periods, aggregates, shares, and totals placement. That is
today's `TableGroupingState` plus `totalsPlacement`, which the type currently
comments as a query setting emitted as the grouped `ORDER BY` direction, not a
display flag.

`groupingStore` already owns the live copy. After the split, those members are
not on the capability type and not on chrome. The loader still hydrates
`groupingStore`; how that seed travels is #1141, and is out of scope here.

`preferredGroupingMode` and `defaultGroupFold` are reader preferences that seed
the query and the expansion set. They are not the live query. `defaultGroupFold`
already seeds `expansionStore`. `preferredGroupingMode` stays on chrome until a
loader applies it; it does not join `TableGroupingState`.

### Chrome — `metaStore`

Reader layout and drawer chrome, including what `getPersistedUiState` already
picks for the layout cookie.

| Member                                                                                                                                       | Role                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `density`, `isBordered`, `isStriped`, `isRounded`                                                                                            | Grid chrome                                             |
| `isColumnSettingsOpen`, `isColumnSettingsPinned`, `isTableSettingsOpen`, `isTableSettingsPinned`, `wasTableSettingsOpenBeforeColumnSettings` | Drawer open and pin                                     |
| `columnSelectedKey`, `columnSettingsSelectedTab`, `tableSettingsSelectedTab`, `tableSettingsExpandedFilters`                                 | Drawer selection                                        |
| `settingsPanelWidth`, `settingsTabOrder`                                                                                                     | Panel shape                                             |
| `persistenceKey`, `appId`                                                                                                                    | Layout-cookie identity                                  |
| `initialPageSize`, `loadMorePageSize`, `placeholderRowCount`                                                                                 | Page sizes                                              |
| `overscan`, `threshold`, `rowHeight`                                                                                                         | Virtual window                                          |
| `drawersSyncNonce`                                                                                                                           | Remount signal after a live column write                |
| `isColumnLayoutTransient`                                                                                                                    | Skip restoring a layout cookie on a view arrived at     |
| `preferredGroupingMode`                                                                                                                      | Reader default the loader applies when the URL is empty |
| `defaultGroupFold`                                                                                                                           | Reader default that seeds `expansionStore`              |

Capability and chrome share `metaStore` as two types. The snapshot the store
holds may still be one object; a writer still patches one slice. Splitting
chrome into its own store is not part of this decision.

### Filter-fetch failures — `filtersDataStore`, as `TableResponseError`

A filter-options fetch writes `FilterData.error` on the column it was loading,
typed as `TableResponseError | undefined`. That is the same discriminated union
the data store already holds. It is not `error?: string` on meta, and it is not
a new union that copies three of `TableResponseError`'s four arms.

A filter-options fetch writes `db-failed`, `db-canceled`, or `unexpected`. It
never writes `grouping-refused`; that arm stays on the union because the grid
read uses it.

The per-column slot is the grain of the fetch. A store-level filter error would
make one column's failure look like every dropdown's.

Grid reads, including load-more, write `TableDataState.error` as
`TableResponseError`. Load-more today writes the string on meta and leaves the
data store's `error` untouched, so `TableEmptyState` cannot see it.
`TableMetaState.error` is deleted. There is no third error channel.

## Consequences

**#1141 is a breaking change to a published type.** `TableMetaState` is on the
tracked surface. Splitting it rewrites the snapshot
`reports/api-surface/ui.txt` records, and the changeset gate will require a
`@lcabrera/ui` changeset. This ADR does not carry that changeset, because it
changes no runtime code.

**The loader's `meta` argument stays the seed path.** ADR-063 still holds: a
request-shaping capability is declared once, on loader meta. After the split
that argument is the capability type, not the current bag. Grouping query and
chrome that today ride the same object have to be threaded as their own seeds.
That wiring is #1141. Until it lands, `createTableRouteLoader` still returns
one `metaState`.

**`TableGroupingState` gains `totalsPlacement`.** Anything that constructs a
literal of that type — tests, the drawer draft, `getInitialGroupingState` —
gains the field in the same change. The layout cookie still hydrates it; live
reads move to `groupingStore`.

**A filter-options failure becomes visible on that column's dropdown, or it
stays as silent as it is today until a surface reads `FilterData.error`.**
Moving the write is not the same as rendering it. #1141 owns the write. A
surface that paints the union is a follow-up, not a requirement of the split.

**Capability readers still share a store with chrome writers.** A density
change notifies every `metaStore` subscriber; granular selectors keep that off
the capability reads that already select one field. If that isolation later
fails, a `chromeStore` is a new decision, not an amendment that this one
silently includes.

## Alternatives considered

**Put filter-options failures on the data store.** Rejected: `TableEmptyState`
renders `TableDataState.error` as "this table could not be loaded". A failed
distinct-values fetch is not a failed grid read. Sharing that field would make
the empty body lie about which request died.

**A new error store, or a new union beside `TableResponseError`.** Rejected:
that is the third channel. The data store already holds the union; the filters
store already holds the per-column fetch. A second union that repeats
`db-failed` / `db-canceled` / `unexpected` would drift from the first the same
way the string on meta already has.

**A `chromeStore` (or a `capabilityStore`) in the same split.** Rejected:
`groupingStore` exists because grouping is URL state and expansion cannot cross
the loader boundary (ADR-061, ADR-067), not because two slices shared a store.
Capability is written at seed. Chrome is the rest of today's meta writes.
Selectors already isolate those reads. A fifth store on `TableConfigProvider`
is a later call, if a measurement says the shared store is the cost.

**Leave `totalsPlacement` on chrome because the layout cookie stores it.**
Rejected: the member's own note is that it is a query setting. Cookie vs URL is
hydration, not ownership. Live placement belongs next to mode, which is the
other totals question.

## References

- [#1138](https://github.com/luciocabrera/lcabrera-stack/issues/1138) — this decision
- [#1141](https://github.com/luciocabrera/lcabrera-stack/issues/1141) — the blocked type split
- [#1137](https://github.com/luciocabrera/lcabrera-stack/issues/1137) — parent
- [ADR-061](./ADR-061-grouping-config-in-url-expansion-in-store.md) — grouping configuration is URL state; the live store is `groupingStore`
- [ADR-063](./ADR-063-request-shaping-capabilities-on-the-loader-meta.md) — capability is declared on loader meta
- [ADR-068](./ADR-068-a-refused-read-is-rendered-data-not-an-exception.md) — a refused read is `TableResponseError` on the data store
- [ADR-104](./ADR-104-the-no-comment-rule-covers-a-type-declaration.md) — a comment inside the type is not the split
