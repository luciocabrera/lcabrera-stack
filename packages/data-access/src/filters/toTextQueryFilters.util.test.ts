import { expect, it } from 'vitest';

import { toTextQueryFilters } from './toTextQueryFilters.util.ts';

it('maps contains/startsWith/endsWith to ilike patterns', () => {
  expect(
    toTextQueryFilters({
      column: 'customer_name',
      filter: { operator: 'contains', type: 'text', value: 'ada' },
    }),
  ).toStrictEqual([
    { column: 'customer_name', operator: 'ilike', value: '%ada%' },
  ]);
  expect(
    toTextQueryFilters({
      column: 'customer_name',
      filter: { operator: 'startsWith', type: 'text', value: 'ad' },
    }),
  ).toStrictEqual([
    { column: 'customer_name', operator: 'ilike', value: 'ad%' },
  ]);
  expect(
    toTextQueryFilters({
      column: 'customer_name',
      filter: { operator: 'endsWith', type: 'text', value: 'da' },
    }),
  ).toStrictEqual([
    { column: 'customer_name', operator: 'ilike', value: '%da' },
  ]);
});

it('maps notContains to a notIlike pattern', () => {
  expect(
    toTextQueryFilters({
      column: 'customer_name',
      filter: { operator: 'notContains', type: 'text', value: 'temp' },
    }),
  ).toStrictEqual([
    { column: 'customer_name', operator: 'notIlike', value: '%temp%' },
  ]);
});

it('maps equals/notEquals to eq/neq', () => {
  expect(
    toTextQueryFilters({
      column: 'carrier',
      filter: { operator: 'equals', type: 'text', value: 'UPS' },
    }),
  ).toStrictEqual([{ column: 'carrier', operator: 'eq', value: 'UPS' }]);
  expect(
    toTextQueryFilters({
      column: 'carrier',
      filter: { operator: 'notEquals', type: 'text', value: 'UPS' },
    }),
  ).toStrictEqual([{ column: 'carrier', operator: 'neq', value: 'UPS' }]);
});

it('drops empty values', () => {
  expect(
    toTextQueryFilters({
      column: 'carrier',
      filter: { operator: 'contains', type: 'text', value: '' },
    }),
  ).toStrictEqual([]);
});
