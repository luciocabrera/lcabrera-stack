import { expect, it } from 'vitest';

import { toSelectQueryFilters } from './to-select-query-filters.util.ts';

it('maps a multi-value equals to an in filter', () => {
  expect(
    toSelectQueryFilters({
      column: 'order_status',
      filter: { type: 'multiSelect', values: ['Pending', 'Shipped'] },
    }),
  ).toStrictEqual([
    { column: 'order_status', operator: 'in', value: ['Pending', 'Shipped'] },
  ]);
});

it('expands a multi-value notEquals into an AND of neq (NOT IN)', () => {
  expect(
    toSelectQueryFilters({
      column: 'order_status',
      filter: {
        operator: 'notEquals',
        type: 'multiSelect',
        values: ['Pending', 'Shipped'],
      },
    }),
  ).toStrictEqual([
    { column: 'order_status', operator: 'neq', value: 'Pending' },
    { column: 'order_status', operator: 'neq', value: 'Shipped' },
  ]);
});

it('maps a single value to eq/neq', () => {
  expect(
    toSelectQueryFilters({
      column: 'priority',
      filter: { type: 'select', value: 'High' },
    }),
  ).toStrictEqual([{ column: 'priority', operator: 'eq', value: 'High' }]);
  expect(
    toSelectQueryFilters({
      column: 'priority',
      filter: { operator: 'notEquals', type: 'select', value: 'High' },
    }),
  ).toStrictEqual([{ column: 'priority', operator: 'neq', value: 'High' }]);
});

it('yields nothing for an empty filter', () => {
  expect(
    toSelectQueryFilters({ column: 'priority', filter: { type: 'select' } }),
  ).toStrictEqual([]);
});
