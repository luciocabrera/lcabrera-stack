import { expect, it } from 'vite-plus/test';

import { buildWhereClause } from '../db/query-builder/build-where-clause.util.ts';
import { toQueryFilters } from './to-query-filters.util.ts';

it('dispatches each column filter to its type mapper and flattens', () => {
  const result = toQueryFilters({
    filters: {
      is_vip_customer: { type: 'boolean', value: true },
      order_status: { type: 'multiSelect', values: ['Pending'] },
      quantity: { operator: 'between', type: 'number', value: 1, value2: 3 },
    },
  });

  expect(result).toStrictEqual([
    { column: 'is_vip_customer', operator: 'eq', value: true },
    { column: 'order_status', operator: 'in', value: ['Pending'] },
    { column: 'quantity', operator: 'gte', value: 1 },
    { column: 'quantity', operator: 'lte', value: 3 },
  ]);
});

it('routes a text notContains filter through to a notIlike entry', () => {
  expect(
    toQueryFilters({
      filters: {
        customer_name: { operator: 'notContains', type: 'text', value: 'temp' },
      },
    }),
  ).toStrictEqual([
    { column: 'customer_name', operator: 'notIlike', value: '%temp%' },
  ]);
});

it('returns an empty array for no filters', () => {
  expect(toQueryFilters({ filters: {} })).toStrictEqual([]);
});

it('maps an empty filter to a unary query filter carrying no value', () => {
  // No `value` key at all, not `value: undefined`. `appendFilterClause`
  // branches on the operator rather than on whether a value is present, so
  // the difference would go unnoticed here and surface as a wrong parameter
  // index on a *later* filter.
  expect(
    toQueryFilters({
      filters: { shipping_country: { operator: 'isEmpty', type: 'empty' } },
    }),
  ).toStrictEqual([{ column: 'shipping_country', operator: 'isNull' }]);
});

it('reaches SQL as IS NULL, binding no parameter and shifting no index', () => {
  // End to end, because that is the claim worth pinning: a filter with no
  // value must not consume a `$n` slot. If it did, every filter after it
  // would bind the wrong parameter — a silent failure landing on a different
  // filter than the one that caused it.
  //
  // **The empty filter must come first or this proves nothing**, since only a
  // filter *after* it can show the shift. `toQueryFilters` walks
  // `Object.entries`, so the order here is the literal's order — and
  // `perfectionist/sort-objects` requires that to be alphabetical. The column
  // names are chosen so the sorted order is the order under test; renaming
  // either one to sort the other way silently disarms this.
  const { text, values } = buildWhereClause({
    filters: toQueryFilters({
      filters: {
        a_country: { operator: 'isEmpty', type: 'empty' },
        z_quantity: { operator: 'greaterThan', type: 'number', value: 2 },
      },
    }),
  });

  expect(text).toBe('WHERE "a_country" IS NULL AND "z_quantity" > $1');
  expect(values).toStrictEqual([2]);
});
