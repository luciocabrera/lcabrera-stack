/**
 * `@lcabrera/ui` and `@lcabrera/server` each declare the column-filter shapes
 * independently — neither package depends on the other, so neither can import
 * the other's definition. This suite keeps the two in step.
 *
 * The assertion is the call itself, not a type-level trick: `toQueryFilters`
 * requires `@lcabrera/server`'s shape and the values below are typed as
 * `@lcabrera/ui`'s, so the file only compiles while a filter built in the UI is
 * assignable to the query layer. The call checks one direction; the last case
 * adds the other.
 *
 * The annotation is `: Record<string, ColumnFilter>` and deliberately not
 * `satisfies`. `satisfies` keeps each value's narrow literal type, so the call
 * would only ever check the filters written here and an operator added to one
 * package's union alone would sail through. Verified by adding one and
 * confirming `typecheck` fails; with `satisfies` it did not.
 */

import type { ColumnFilter as QueryColumnFilter } from '@lcabrera/server/filters/filters.types';
import type { ColumnFilter } from '@lcabrera/ui/types/filterOperators.types';

import { toQueryFilters } from '@lcabrera/server/filters/to-query-filters.util';
import { describe, expect, it } from 'vite-plus/test';

const uiFilters: Record<string, ColumnFilter> = {
  customer_name: { operator: 'contains', type: 'text', value: 'ac' },
  delivered_at: { operator: 'before', type: 'date', value: '2026-01-01' },
  is_vip_customer: { type: 'boolean', value: true },
  order_status: { type: 'multiSelect', values: ['Pending'] },
  quantity: { operator: 'greaterThan', type: 'number', value: 2 },
  shipping_country: { operator: 'isEmpty', type: 'empty' },
};

describe('column-filter contract between @lcabrera/ui and @lcabrera/server', () => {
  it('accepts every UI filter variant and maps it to a query filter', () => {
    expect(toQueryFilters({ filters: uiFilters })).toStrictEqual([
      { column: 'customer_name', operator: 'ilike', value: '%ac%' },
      { column: 'delivered_at', operator: 'lt', value: '2026-01-01' },
      { column: 'is_vip_customer', operator: 'eq', value: true },
      { column: 'order_status', operator: 'in', value: ['Pending'] },
      { column: 'quantity', operator: 'gt', value: 2 },
      { column: 'shipping_country', operator: 'isNull' },
    ]);
  });

  it('carries a number filter left undefined mid-edit without inventing a clause', () => {
    const drafting: Record<string, ColumnFilter> = {
      quantity: { operator: 'equals', type: 'number', value: undefined },
    };

    expect(toQueryFilters({ filters: drafting })).toStrictEqual([]);
  });

  it('accepts every query-layer filter variant as a UI filter', () => {
    const queryLayerFilters: Record<string, QueryColumnFilter> = uiFilters;
    const backToUiFilters: Record<string, ColumnFilter> = queryLayerFilters;

    expect(backToUiFilters).toStrictEqual(uiFilters);
  });
});
