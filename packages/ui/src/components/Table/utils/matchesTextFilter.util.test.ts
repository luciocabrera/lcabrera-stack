import { describe, expect, it } from 'vite-plus/test';

import { matchesTextFilter } from './matchesTextFilter.util';

const JSON_NULL: unknown = JSON.parse('null');

describe('matchesTextFilter', () => {
  it('matches every row while the filter text is empty', () => {
    expect(
      matchesTextFilter({
        filter: { operator: 'contains', type: 'text', value: '' },
        value: JSON_NULL,
      }),
    ).toBe(true);
  });

  it('never matches a missing value once the filter has text', () => {
    expect(
      matchesTextFilter({
        filter: { operator: 'notContains', type: 'text', value: 'a' },
        value: JSON_NULL,
      }),
    ).toBe(false);
  });

  it.each([
    { isExpected: true, needle: 'LPH', operator: 'contains' },
    { isExpected: false, needle: 'xyz', operator: 'contains' },
    { isExpected: false, needle: 'lph', operator: 'notContains' },
    { isExpected: true, needle: 'al', operator: 'startsWith' },
    { isExpected: false, needle: 'ph', operator: 'startsWith' },
    { isExpected: true, needle: 'HA', operator: 'endsWith' },
    { isExpected: false, needle: 'al', operator: 'endsWith' },
  ] as const)(
    'folds case for $operator $needle',
    ({ isExpected, needle, operator }) => {
      expect(
        matchesTextFilter({
          filter: { operator, type: 'text', value: needle },
          value: 'Alpha',
        }),
      ).toBe(isExpected);
    },
  );

  it.each([
    { isExpected: true, needle: 'Alpha', operator: 'equals' },
    { isExpected: false, needle: 'alpha', operator: 'equals' },
    { isExpected: true, needle: 'alpha', operator: 'notEquals' },
  ] as const)(
    'compares $operator $needle exactly',
    ({ isExpected, needle, operator }) => {
      expect(
        matchesTextFilter({
          filter: { operator, type: 'text', value: needle },
          value: 'Alpha',
        }),
      ).toBe(isExpected);
    },
  );

  it('reads a non-string value through its text', () => {
    expect(
      matchesTextFilter({
        filter: { operator: 'equals', type: 'text', value: '42' },
        value: 42,
      }),
    ).toBe(true);
  });
});
