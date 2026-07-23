import { expect, it } from 'vite-plus/test';

import { toNumberQueryFilters } from './to-number-query-filters.util.ts';

it('maps comparison operators directly', () => {
  expect(
    toNumberQueryFilters({
      column: 'quantity',
      filter: { operator: 'greaterThanOrEqual', type: 'number', value: 5 },
    }),
  ).toStrictEqual([{ column: 'quantity', operator: 'gte', value: 5 }]);
  expect(
    toNumberQueryFilters({
      column: 'quantity',
      filter: { operator: 'lessThan', type: 'number', value: 5 },
    }),
  ).toStrictEqual([{ column: 'quantity', operator: 'lt', value: 5 }]);
});

it('expands between into a gte + lte pair', () => {
  expect(
    toNumberQueryFilters({
      column: 'quantity',
      filter: { operator: 'between', type: 'number', value: 2, value2: 8 },
    }),
  ).toStrictEqual([
    { column: 'quantity', operator: 'gte', value: 2 },
    { column: 'quantity', operator: 'lte', value: 8 },
  ]);
});

it('yields nothing for a drafting (undefined) value or an open between', () => {
  expect(
    toNumberQueryFilters({
      column: 'quantity',
      filter: { operator: 'equals', type: 'number', value: undefined },
    }),
  ).toStrictEqual([]);
  expect(
    toNumberQueryFilters({
      column: 'quantity',
      filter: { operator: 'between', type: 'number', value: 2 },
    }),
  ).toStrictEqual([]);
});
