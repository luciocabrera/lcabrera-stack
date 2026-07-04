# Filters Utilities Architecture

Table filter-specific adapter utilities that bridge static data to the Table component's async filter options contract.

## Files

| File                                  | Description                                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `createDistinctFilterOptions.util.ts` | Adapts a distinct-values API (`columnName`, `limit`, `offset`) to the table async filter options contract                            |
| `createStaticFilterOptions.util.ts`   | Wraps a `string[]` into `fetchFilterOptions` + selector functions compatible with the Table's `FilterOptionsResponse` async contract |

## Usage Pattern

```ts
// In a column definition
{
  dataType: 'string',
  ...createStaticFilterOptions(['Pending', 'Shipped', 'Delivered']),
  key: 'status',
  label: 'Status',
}
```

The helper supports pagination (`skip`/`limit`) for consistency with server-fetched options, so filter dropdowns behave identically whether options are static or remote.

## Consumers

- `src/routes/enterprise-orders/EnterpriseOrders.constants.tsx`
