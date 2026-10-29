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
  const NULL_CELLS = [JSON_NULL, undefined];
  const BLANK_CELLS = ['', ' '];
  const KEEPS_BLANK_TEXT = new Set(['notContains', 'notEquals']);
  const DATE = '2024-01-01';
  const FILTERS: readonly ColumnFilter[] = [
    ...(
      [
        'contains',
        'endsWith',
        'equals',
        'notContains',
        'notEquals',
        'startsWith',
      ] as const
    ).map((operator) => ({ operator, type: 'text', value: 'a' }) as const),
    ...(['equals', 'notEquals'] as const).flatMap((operator) => [
      { operator, type: 'select', value: 'open' } as const,
      { operator, type: 'multiSelect', values: ['open'] } as const,
    ]),
    ...(
      [
        'equals',
        'greaterThan',
        'greaterThanOrEqual',
        'lessThan',
        'lessThanOrEqual',
        'notEquals',
      ] as const
    ).map((operator) => ({ operator, type: 'number', value: 1 }) as const),
    { operator: 'between', type: 'number', value: 1, value2: 2 },
    ...(['after', 'before', 'equals'] as const).map(
      (operator) => ({ operator, type: 'date', value: DATE }) as const,
    ),
    { operator: 'between', type: 'date', value: DATE, value2: '2024-02-01' },
    { type: 'boolean', value: true },
  ];
  const describeFilter = (filter: ColumnFilter) =>
    `${filter.type} ${'operator' in filter ? (filter.operator ?? 'equals') : 'equals'}`;
  const isBlankKept = (filter: ColumnFilter) =>
    filter.type !== 'number' &&
    filter.type !== 'date' &&
    filter.type !== 'boolean' &&
    'operator' in filter &&
    KEEPS_BLANK_TEXT.has(filter.operator ?? 'equals');

  it.each(FILTERS.map((filter) => ({ filter, name: describeFilter(filter) })))(
    '$name drops null and undefined cells, as SQL drops NULL',
    ({ filter }) => {
      expect(
        NULL_CELLS.map((value) => matchesColumnFilter({ filter, value })),
      ).toStrictEqual([false, false]);
    },
  );

  it.each(FILTERS.map((filter) => ({ filter, name: describeFilter(filter) })))(
    '$name treats empty and blank text as SQL treats an empty string',
    ({ filter }) => {
      expect(
        BLANK_CELLS.map((value) => matchesColumnFilter({ filter, value })),
      ).toStrictEqual([isBlankKept(filter), isBlankKept(filter)]);
    },
  );

  it.each([
    { expected: [true, true, false, false], operator: 'isEmpty' },
    { expected: [false, false, true, true], operator: 'isNotEmpty' },
  ] as const)(
    '$operator tells NULL from an empty string',
    ({ expected, operator }) => {
      expect(
        [...NULL_CELLS, ...BLANK_CELLS].map((value) =>
          matchesColumnFilter({ filter: { operator, type: 'empty' }, value }),
        ),
      ).toStrictEqual(expected);
    },
  );
});
