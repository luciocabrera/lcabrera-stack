# Type Guard Utilities Architecture

Generic runtime type guards shared across services and utilities. These are the
single source of truth for narrowing `unknown` values — never redeclare them
locally.

## Files

| File               | Description                                                           |
| ------------------ | --------------------------------------------------------------------- |
| `isObject.util.ts` | `unknown` → `value is Record<string, unknown>`; non-null object check |

## Consumers

- `src/services/carSales.api.ts` — response-shape guards
- `src/services/enterpriseOrders.api.ts` — response-shape guards
- `src/services/wideAlltypes150.api.ts` — response-shape guards
- `src/utils/globalSettings/getGlobalSettingsFromCookie.util.ts` — cookie payload guard
