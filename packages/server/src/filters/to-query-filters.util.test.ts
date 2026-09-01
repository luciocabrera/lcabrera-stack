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
  expect(
    toQueryFilters({
      filters: { shipping_country: { operator: 'isEmpty', type: 'empty' } },
    }),
  ).toStrictEqual([{ column: 'shipping_country', operator: 'isNull' }]);
});

it('reaches SQL as IS NULL, binding no parameter and shifting no index', () => {
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
