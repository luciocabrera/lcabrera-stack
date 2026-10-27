import { describe, expect, it } from 'vite-plus/test';

import type { DateFilter } from '#ui/types/filterOperators.types';

import { matchesDateFilter } from './matchesDateFilter.util';

const JSON_NULL: unknown = JSON.parse('null');

describe('matchesDateFilter', () => {
  it('matches every row while the filter has no date', () => {
    expect(
      matchesDateFilter({
        filter: { operator: 'after', type: 'date', value: '' },
        value: JSON_NULL,
      }),
    ).toBe(true);
  });

  it('never matches a missing or unreadable value', () => {
    const filter: DateFilter = {
      operator: 'before',
      type: 'date',
      value: '2024-01-02',
    };

    expect(matchesDateFilter({ filter, value: JSON_NULL })).toBe(false);
    expect(matchesDateFilter({ filter, value: 'soon' })).toBe(false);
  });

  it.each([
    { date: '2024-01-01', isExpected: true, operator: 'after' },
    { date: '2024-01-02', isExpected: false, operator: 'after' },
    { date: '2024-01-03', isExpected: true, operator: 'before' },
    { date: '2024-01-02', isExpected: false, operator: 'before' },
    { date: '2024-01-02', isExpected: true, operator: 'equals' },
    { date: '2024-01-01', isExpected: false, operator: 'equals' },
  ] as const)(
    'applies $operator $date to 2024-01-02',
    ({ date, isExpected, operator }) => {
      expect(
        matchesDateFilter({
          filter: { operator, type: 'date', value: date },
          value: '2024-01-02',
        }),
      ).toBe(isExpected);
    },
  );

  it('includes both bounds of a range', () => {
    const filter: DateFilter = {
      operator: 'between',
      type: 'date',
      value: '2024-01-01',
      value2: '2024-01-31',
    };

    expect(matchesDateFilter({ filter, value: '2024-01-01' })).toBe(true);
    expect(matchesDateFilter({ filter, value: '2024-01-31' })).toBe(true);
    expect(matchesDateFilter({ filter, value: '2024-02-01' })).toBe(false);
  });

  it('treats a range with no end as an equality', () => {
    const filter: DateFilter = {
      operator: 'between',
      type: 'date',
      value: '2024-01-01',
      value2: '',
    };

    expect(matchesDateFilter({ filter, value: '2024-01-01' })).toBe(true);
    expect(matchesDateFilter({ filter, value: '2024-01-02' })).toBe(false);
  });

  it('reads a number as a timestamp', () => {
    expect(
      matchesDateFilter({
        filter: { operator: 'equals', type: 'date', value: '2024-01-02' },
        value: Date.parse('2024-01-02'),
      }),
    ).toBe(true);
  });

  it.each([' ', NaN, new Date('not a date')])(
    'never matches the unreadable value %o',
    (value) => {
      expect(
        matchesDateFilter({
          filter: { operator: 'after', type: 'date', value: '2000-01-01' },
          value,
        }),
      ).toBe(false);
    },
  );

  it('never matches against a filter date it cannot read', () => {
    expect(
      matchesDateFilter({
        filter: { operator: 'before', type: 'date', value: 'soon' },
        value: '2024-01-02',
      }),
    ).toBe(false);
    expect(
      matchesDateFilter({
        filter: {
          operator: 'between',
          type: 'date',
          value: '2024-01-01',
          value2: 'later',
        },
        value: '2024-01-02',
      }),
    ).toBe(false);
  });

  it('reads a Date value', () => {
    expect(
      matchesDateFilter({
        filter: { operator: 'equals', type: 'date', value: '2024-01-02' },
        value: new Date('2024-01-02'),
      }),
    ).toBe(true);
  });
});
