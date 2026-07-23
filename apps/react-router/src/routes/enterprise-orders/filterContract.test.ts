import type { ColumnFilter } from '@lcabrera/ui/types/filterOperators.types';

import { toQueryFilters } from '@lcabrera/server/filters/to-query-filters.util';
import { describe, expect, it } from 'vite-plus/test';

/**
 * `@lcabrera/ui` and `@lcabrera/server` each declare the column-filter shapes
 * independently — neither package depends on the other, so neither can import
 * the other's definition (see the header of either `filters.types.ts`). This is
 * the guard that keeps the two in step.
 *
 * The assertion is the **call itself**, not a type-level trick: `toQueryFilters`
 * requires `@lcabrera/server`'s shape, the values below are typed as `@lcabrera/ui`'s,
 * so this file only compiles while a filter built in the UI is assignable to the
 * query layer. Add an operator or a variant on one side and `vp run typecheck`
 * fails here, naming the contract.
 *
 * It lives in the app because the app is the only thing that legitimately
 * depends on both packages — integrating them is precisely what it is for.
 *
 * The annotation below is `: Record<string, ColumnFilter>` and **not**
 * `satisfies`, which matters more than it looks. `satisfies` keeps the narrow
 * literal type of each value, so the call would only ever check the five filters
 * written here — adding an operator to one package's union and not the other's
 * would sail through. The annotation widens them to the union itself, so the
 * call checks the whole `ColumnFilter` against the whole of the query layer's.
 * Verified by deliberately adding an operator to one side and confirming
 * `typecheck` fails; with `satisfies` it did not.
 */
const uiFilters: Record<string, ColumnFilter> = {
  customer_name: { operator: 'contains', type: 'text', value: 'ac' },
  delivered_at: { operator: 'before', type: 'date', value: '2026-01-01' },
  is_vip_customer: { type: 'boolean', value: true },
  order_status: { type: 'multiSelect', values: ['Pending'] },
  quantity: { operator: 'greaterThan', type: 'number', value: 2 },
};

describe('column-filter contract between @lcabrera/ui and @lcabrera/server', () => {
  it('accepts every UI filter variant and maps it to a query filter', () => {
    expect(toQueryFilters({ filters: uiFilters })).toStrictEqual([
      { column: 'customer_name', operator: 'ilike', value: '%ac%' },
      { column: 'delivered_at', operator: 'lt', value: '2026-01-01' },
      { column: 'is_vip_customer', operator: 'eq', value: true },
      { column: 'order_status', operator: 'in', value: ['Pending'] },
      { column: 'quantity', operator: 'gt', value: 2 },
    ]);
  });

  it('carries a number filter left undefined mid-edit without inventing a clause', () => {
    // The UI shape admits `value: undefined` while the user is still typing, and
    // the query layer has to tolerate exactly that — the reason its own shape is
    // laxer than a SQL-facing contract would otherwise be.
    const drafting: Record<string, ColumnFilter> = {
      quantity: { operator: 'equals', type: 'number', value: undefined },
    };

    expect(toQueryFilters({ filters: drafting })).toStrictEqual([]);
  });
});
