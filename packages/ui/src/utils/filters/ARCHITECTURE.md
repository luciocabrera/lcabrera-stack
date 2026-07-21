# Filters Utilities Architecture

The client half of the serializable filter-options descriptor system
(ADR-009): executors that turn a column's `filterOptionsDescriptor` (plain
JSON baked by a loader) into the `{ onLoadMore, dataSelector,
dataTotalSelector }` contract the Table's filter fetch chain
(`useFetchFilterData`) consumes. HTTP + response validation delegate to
`@repo/api`; nothing here is ever a function on a column.

## Files

| File                                     | Description                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `createStaticFilterOptions.util.ts`      | Emits a `{ kind: 'static', values }` descriptor for build-time enum lists (spread into a column definition)        |
| `filters.constants.ts`                   | Transport request targets: `/_api/filter-options` (loader) and the `/distinct` BFF path suffix                     |
| `getFilterOptionsBaseUrl.util.ts`        | Resolves a transport to its request base (`getApiBaseUrl() + '/distinct'` for bff, resource-route path for loader) |
| `resolveDistinctFilterOptions.util.ts`   | Executor for `kind: 'distinct'`: pages via `fetchDistinctValues` (`@repo/api`), maps `skip`→`offset`               |
| `resolveStaticFilterOptions.util.ts`     | Executor for `kind: 'static'`: serves pages by slicing the baked values client-side (no network)                   |
| `resolveFilterOptionsDescriptor.util.ts` | The client tool: dispatches on `descriptor.kind` to the matching executor                                          |

Both executors preserve the `dataTotalSelector = hasMore ? Infinity : length`
convention so `getTotalRows`/`hasMore` math downstream is untouched, and the
ADR-006 prefetch cache keeps working unchanged.

## Usage Pattern

```ts
// Static enum — in a column definition (serializable, loader-safe)
{
  dataType: 'string',
  ...createStaticFilterOptions(['Pending', 'Shipped', 'Delivered']),
  key: 'status',
  label: 'Status',
}

// Distinct values — appended by the LOADER via
// @repo/ui/routing/appendDistinctFilterDescriptors (columnName = column.key)
```

`SelectFilterInput` resolves the descriptor at fetch time:
`fetchInitial(resolveFilterOptionsDescriptor(column.filterOptionsDescriptor))`.

## Consumers

- `components/Table/filters/SelectFilterInput/` (descriptor → fetch chain)
- `components/Table/filters/FilterInputs/` (`hasFetchableOptions` gate)
- `apps/react-router/src/routes/enterprise-orders/EnterpriseOrders.constants.tsx` (static descriptors)
