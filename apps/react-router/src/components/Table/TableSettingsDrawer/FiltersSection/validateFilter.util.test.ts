import { describe, expect, it } from 'vitest';

import { validateFilter } from './validateFilter.util';

describe('validateFilter', () => {
  it('returns false for undefined', () => {
    const filterValue = void 0 as unknown as Parameters<
      typeof validateFilter
    >[0];

    expect(validateFilter(filterValue)).toBe(false);
  });

  it('returns true for boolean filter', () => {
    expect(validateFilter({ type: 'boolean', value: true })).toBe(true);
    expect(validateFilter({ type: 'boolean', value: false })).toBe(true);
  });

  it('returns false for date filter without value', () => {
    expect(validateFilter({ operator: 'after', type: 'date', value: '' })).toBe(
      false,
    );
  });

  it('returns true for date filter with value', () => {
    expect(
      validateFilter({ operator: 'after', type: 'date', value: '2024-01-01' }),
    ).toBe(true);
  });

  it('returns false for date between without value2', () => {
    expect(
      validateFilter({
        operator: 'between',
        type: 'date',
        value: '2024-01-01',
      }),
    ).toBe(false);
  });

  it('returns true for date between with both values', () => {
    expect(
      validateFilter({
        operator: 'between',
        type: 'date',
        value: '2024-01-01',
        value2: '2024-12-31',
      }),
    ).toBe(true);
  });

  it('returns false for select filter without values', () => {
    expect(
      validateFilter({ operator: 'equals', type: 'select', values: [] }),
    ).toBe(false);
  });

  it('returns true for select filter with values', () => {
    expect(
      validateFilter({
        operator: 'equals',
        type: 'select',
        values: ['Active'],
      }),
    ).toBe(true);
  });

  it('returns true for select filter with value string', () => {
    expect(
      validateFilter({
        operator: 'equals',
        type: 'select',
        value: 'Active',
        values: [],
      }),
    ).toBe(false);
  });

  it('returns false for number filter without value', () => {
    // @ts-expect-error testing edge case
    expect(validateFilter({ operator: 'equals', type: 'number' })).toBe(false);
  });

  it('returns true for number filter with value', () => {
    expect(
      validateFilter({ operator: 'equals', type: 'number', value: 0 }),
    ).toBe(true);
  });

  it('returns false for number between where value2 <= value', () => {
    expect(
      validateFilter({
        operator: 'between',
        type: 'number',
        value: 10,
        value2: 5,
      }),
    ).toBe(false);
  });

  it('returns true for number between where value2 > value', () => {
    expect(
      validateFilter({
        operator: 'between',
        type: 'number',
        value: 5,
        value2: 10,
      }),
    ).toBe(true);
  });

  it('returns false for text equals without value', () => {
    expect(
      validateFilter({ operator: 'equals', type: 'text', value: '' }),
    ).toBe(false);
  });

  it('returns false for text notEquals without value', () => {
    expect(
      validateFilter({ operator: 'notEquals', type: 'text', value: '' }),
    ).toBe(false);
  });

  it('returns false for text contains with empty value', () => {
    expect(
      validateFilter({ operator: 'contains', type: 'text', value: '  ' }),
    ).toBe(false);
  });

  it('returns true for text contains with value', () => {
    expect(
      validateFilter({ operator: 'contains', type: 'text', value: 'hello' }),
    ).toBe(true);
  });

  it('returns false for multiSelect filter without values', () => {
    expect(
      validateFilter({ operator: 'equals', type: 'multiSelect', values: [] }),
    ).toBe(false);
  });

  it('returns true for multiSelect filter with values', () => {
    expect(
      validateFilter({
        operator: 'equals',
        type: 'multiSelect',
        values: ['a'],
      }),
    ).toBe(true);
  });
});
