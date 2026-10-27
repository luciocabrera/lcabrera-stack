import { describe, expect, it } from 'vite-plus/test';

import { isColumnFilter } from './is-column-filter.util.ts';

describe('isColumnFilter', () => {
  it.each([
    { type: 'boolean', value: false },
    {
      operator: 'between',
      type: 'date',
      value: '2026-01-01',
      value2: '2026-02-01',
    },
    { operator: 'after', type: 'date', value: '2026-01-01' },
    { operator: 'isNotEmpty', type: 'empty' },
    { operator: 'between', type: 'number', value: 1, value2: 9 },
    { operator: 'equals', type: 'number' },
    { type: 'select', value: 'open' },
    { operator: 'notEquals', type: 'multiSelect', values: ['a', 'b'] },
    { type: 'multiSelect' },
    { operator: 'startsWith', type: 'text', value: 'ab' },
  ])('accepts %o', (filter) => {
    expect(isColumnFilter(filter)).toBe(true);
  });

  it.each([
    { label: 'a non-object', value: 'text' },
    { label: 'JSON null', value: JSON.parse('null') },
    { label: 'an array', value: [{ type: 'boolean', value: true }] },
    { label: 'an unknown type', value: { type: 'range', value: 1 } },
    {
      label: 'a type inherited from the prototype',
      value: { type: 'toString' },
    },
    {
      label: 'a boolean filter with a string value',
      value: { type: 'boolean', value: 'true' },
    },
    {
      label: 'a date filter with an unknown operator',
      value: { operator: 'since', type: 'date', value: '2026-01-01' },
    },
    {
      label: 'a date filter with a numeric value',
      value: { operator: 'after', type: 'date', value: 20_260_101 },
    },
    {
      label: 'a date filter with a numeric upper bound',
      value: {
        operator: 'between',
        type: 'date',
        value: '2026-01-01',
        value2: 1,
      },
    },
    {
      label: 'an empty filter with a text operator',
      value: { operator: 'contains', type: 'empty' },
    },
    {
      label: 'a number filter with a string value',
      value: { operator: 'equals', type: 'number', value: '5' },
    },
    {
      label: 'a number filter with a non-finite value',
      value: { operator: 'equals', type: 'number', value: NaN },
    },
    {
      label: 'a number filter with a string upper bound',
      value: { operator: 'between', type: 'number', value: 1, value2: '9' },
    },
    {
      label: 'a select filter with an unknown operator',
      value: { operator: 'contains', type: 'select', value: 'a' },
    },
    {
      label: 'a select filter with a numeric value',
      value: { type: 'select', value: 1 },
    },
    {
      label: 'a multi-select filter with a non-string member',
      value: { type: 'multiSelect', values: ['a', 2] },
    },
    {
      label: 'a multi-select filter whose values are not a list',
      value: { type: 'multiSelect', values: 'a' },
    },
    {
      label: 'a text filter with no value',
      value: { operator: 'contains', type: 'text' },
    },
    {
      label: 'a text filter with a number operator',
      value: { operator: 'greaterThan', type: 'text', value: 'a' },
    },
  ])('rejects $label', ({ value }) => {
    expect(isColumnFilter(value)).toBe(false);
  });
});
