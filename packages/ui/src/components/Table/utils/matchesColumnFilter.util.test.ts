import { describe, expect, it } from 'vite-plus/test';

import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { matchesColumnFilter } from './matchesColumnFilter.util';

const JSON_NULL: unknown = JSON.parse('null');

describe('matchesColumnFilter', () => {
  it('matches a boolean by value, read through its text', () => {
    const filter = { type: 'boolean', value: true } as const;

    expect(matchesColumnFilter({ filter, value: true })).toBe(true);
    expect(matchesColumnFilter({ filter, value: 'true' })).toBe(true);
    expect(matchesColumnFilter({ filter, value: false })).toBe(false);
    expect(matchesColumnFilter({ filter, value: JSON_NULL })).toBe(false);
  });

  it('tells a null value from a present one for the empty operators', () => {
    const emptyFilter = { operator: 'isEmpty', type: 'empty' } as const;
    const notEmptyFilter = { operator: 'isNotEmpty', type: 'empty' } as const;

    expect(matchesColumnFilter({ filter: emptyFilter, value: JSON_NULL })).toBe(
      true,
    );
    expect(matchesColumnFilter({ filter: emptyFilter, value: '' })).toBe(false);
    expect(matchesColumnFilter({ filter: notEmptyFilter, value: 0 })).toBe(
      true,
    );
    expect(
      matchesColumnFilter({ filter: notEmptyFilter, value: undefined }),
    ).toBe(false);
  });

  it('hands each remaining type to its own matcher', () => {
    expect(
      matchesColumnFilter({
        filter: { operator: 'after', type: 'date', value: '2024-01-01' },
        value: '2024-02-01',
      }),
    ).toBe(true);
    expect(
      matchesColumnFilter({
        filter: { operator: 'lessThan', type: 'number', value: 3 },
        value: 4,
      }),
    ).toBe(false);
    expect(
      matchesColumnFilter({
        filter: { operator: 'contains', type: 'text', value: 'lp' },
        value: 'Alpha',
      }),
    ).toBe(true);
    expect(
      matchesColumnFilter({
        filter: { type: 'select', value: 'open' },
        value: 'closed',
      }),
    ).toBe(false);
  });
});

describe('matchesColumnFilter, blank and missing cells, against the server’s SQL', () => {
  const JSON_NULL: unknown = JSON.parse('null');
  const BLANK_CELLS = [JSON_NULL, undefined, '', ' '] as const;
  const cases: readonly {
    readonly expected: readonly [boolean, boolean, boolean, boolean];
    readonly filter: ColumnFilter;
    readonly name: string;
  }[] = [
    {
      expected: [false, false, false, false],
      filter: { operator: 'contains', type: 'text', value: 'a' },
      name: 'text contains',
    },
    {
      expected: [false, false, true, true],
      filter: { operator: 'notContains', type: 'text', value: 'a' },
      name: 'text notContains',
    },
    {
      expected: [false, false, false, false],
      filter: { operator: 'equals', type: 'text', value: 'a' },
      name: 'text equals',
    },
    {
      expected: [false, false, true, true],
      filter: { operator: 'notEquals', type: 'text', value: 'a' },
      name: 'text notEquals',
    },
    {
      expected: [false, false, false, false],
      filter: { operator: 'startsWith', type: 'text', value: 'a' },
      name: 'text startsWith',
    },
    {
      expected: [false, false, false, false],
      filter: { operator: 'endsWith', type: 'text', value: 'a' },
      name: 'text endsWith',
    },
    {
      expected: [false, false, false, false],
      filter: { operator: 'equals', type: 'select', value: 'open' },
      name: 'select equals',
    },
    {
      expected: [false, false, true, true],
      filter: { operator: 'notEquals', type: 'select', value: 'open' },
      name: 'select notEquals',
    },
    {
      expected: [false, false, false, false],
      filter: { type: 'multiSelect', values: ['open'] },
      name: 'multiSelect equals',
    },
    {
      expected: [false, false, true, true],
      filter: { operator: 'notEquals', type: 'multiSelect', values: ['open'] },
      name: 'multiSelect notEquals',
    },
    {
      expected: [false, false, false, false],
      filter: { operator: 'equals', type: 'number', value: 1 },
      name: 'number equals',
    },
    {
      expected: [false, false, false, false],
      filter: { operator: 'notEquals', type: 'number', value: 1 },
      name: 'number notEquals',
    },
    {
      expected: [false, false, false, false],
      filter: { operator: 'greaterThan', type: 'number', value: 1 },
      name: 'number greaterThan',
    },
    {
      expected: [false, false, false, false],
      filter: { operator: 'lessThan', type: 'number', value: 1 },
      name: 'number lessThan',
    },
    {
      expected: [false, false, false, false],
      filter: { operator: 'between', type: 'number', value: 1, value2: 2 },
      name: 'number between',
    },
    {
      expected: [false, false, false, false],
      filter: { operator: 'equals', type: 'date', value: '2024-01-01' },
      name: 'date equals',
    },
    {
      expected: [false, false, false, false],
      filter: { operator: 'after', type: 'date', value: '2024-01-01' },
      name: 'date after',
    },
    {
      expected: [false, false, false, false],
      filter: { operator: 'before', type: 'date', value: '2024-01-01' },
      name: 'date before',
    },
    {
      expected: [false, false, false, false],
      filter: {
        operator: 'between',
        type: 'date',
        value: '2024-01-01',
        value2: '2024-02-01',
      },
      name: 'date between',
    },
    {
      expected: [false, false, false, false],
      filter: { type: 'boolean', value: true },
      name: 'boolean',
    },
    {
      expected: [true, true, false, false],
      filter: { operator: 'isEmpty', type: 'empty' },
      name: 'isEmpty',
    },
    {
      expected: [false, false, true, true],
      filter: { operator: 'isNotEmpty', type: 'empty' },
      name: 'isNotEmpty',
    },
  ];

  it.each(cases)(
    '$name keeps or drops null, undefined, empty and blank cells as SQL does',
    ({ expected, filter }) => {
      expect(
        BLANK_CELLS.map((value) => matchesColumnFilter({ filter, value })),
      ).toStrictEqual(expected);
    },
  );
});
