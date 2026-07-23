import { expect, it } from 'vite-plus/test';

import { toDateQueryFilters } from './to-date-query-filters.util.ts';

it('maps after/before/equals', () => {
  expect(
    toDateQueryFilters({
      column: 'order_date',
      filter: { operator: 'after', type: 'date', value: '2024-01-01' },
    }),
  ).toStrictEqual([
    { column: 'order_date', operator: 'gt', value: '2024-01-01' },
  ]);
  expect(
    toDateQueryFilters({
      column: 'order_date',
      filter: { operator: 'equals', type: 'date', value: '2024-01-01' },
    }),
  ).toStrictEqual([
    { column: 'order_date', operator: 'eq', value: '2024-01-01' },
  ]);
});

it('expands between into a gte + lte pair', () => {
  expect(
    toDateQueryFilters({
      column: 'order_date',
      filter: {
        operator: 'between',
        type: 'date',
        value: '2024-01-01',
        value2: '2024-02-01',
      },
    }),
  ).toStrictEqual([
    { column: 'order_date', operator: 'gte', value: '2024-01-01' },
    { column: 'order_date', operator: 'lte', value: '2024-02-01' },
  ]);
});

it('falls back to eq for a between with no upper bound', () => {
  expect(
    toDateQueryFilters({
      column: 'order_date',
      filter: { operator: 'between', type: 'date', value: '2024-01-01' },
    }),
  ).toStrictEqual([
    { column: 'order_date', operator: 'eq', value: '2024-01-01' },
  ]);
});
