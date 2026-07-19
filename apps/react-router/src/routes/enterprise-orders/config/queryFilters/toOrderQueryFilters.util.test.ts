import { expect, it } from 'vitest';

import { toOrderQueryFilters } from './toOrderQueryFilters.util';

it('dispatches each column filter to its type mapper and flattens', () => {
  const result = toOrderQueryFilters({
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

it('returns an empty array for no filters', () => {
  expect(toOrderQueryFilters({ filters: {} })).toStrictEqual([]);
});
