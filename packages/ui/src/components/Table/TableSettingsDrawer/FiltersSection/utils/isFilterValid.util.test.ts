import { describe, expect, it } from 'vitest';

import { isFilterValid } from './isFilterValid.util';

describe('isFilterValid', () => {
  it('returns false for undefined', () => {
    const filterValue = void 0 as unknown as Parameters<
      typeof isFilterValid
    >[0];

    expect(isFilterValid(filterValue)).toBe(false);
  });

  it('returns true for boolean filter', () => {
    expect(isFilterValid({ type: 'boolean', value: true })).toBe(true);
    expect(isFilterValid({ type: 'boolean', value: false })).toBe(true);
  });

  it('returns false for date filter without value', () => {
    expect(isFilterValid({ operator: 'after', type: 'date', value: '' })).toBe(
      false,
    );
  });

  it('returns true for date filter with value', () => {
    expect(
      isFilterValid({ operator: 'after', type: 'date', value: '2024-01-01' }),
    ).toBe(true);
  });

  it('returns false for date between without value2', () => {
    expect(
      isFilterValid({
        operator: 'between',
        type: 'date',
        value: '2024-01-01',
      }),
    ).toBe(false);
  });

  it('returns true for date between with both values', () => {
    expect(
      isFilterValid({
        operator: 'between',
        type: 'date',
        value: '2024-01-01',
        value2: '2024-12-31',
      }),
    ).toBe(true);
  });

  it('returns false for select filter without values', () => {
    expect(
      isFilterValid({ operator: 'equals', type: 'select', values: [] }),
    ).toBe(false);
  });

  it('returns true for select filter with values', () => {
    expect(
      isFilterValid({
        operator: 'equals',
        type: 'select',
        values: ['Active'],
      }),
    ).toBe(true);
  });

  it('returns true for select filter with value string', () => {
    expect(
      isFilterValid({
        operator: 'equals',
        type: 'select',
        value: 'Active',
        values: [],
      }),
    ).toBe(false);
  });

  it('returns false for number filter without value', () => {
    // @ts-expect-error testing edge case
    expect(isFilterValid({ operator: 'equals', type: 'number' })).toBe(false);
  });

  it('returns true for number filter with value', () => {
    expect(
      isFilterValid({ operator: 'equals', type: 'number', value: 0 }),
    ).toBe(true);
  });

  it('returns false for number between where value2 <= value', () => {
    expect(
      isFilterValid({
        operator: 'between',
        type: 'number',
        value: 10,
        value2: 5,
      }),
    ).toBe(false);
  });

  it('returns true for number between where value2 > value', () => {
    expect(
      isFilterValid({
        operator: 'between',
        type: 'number',
        value: 5,
        value2: 10,
      }),
    ).toBe(true);
  });

  it('returns false for text equals without value', () => {
    expect(isFilterValid({ operator: 'equals', type: 'text', value: '' })).toBe(
      false,
    );
  });

  it('returns false for text notEquals without value', () => {
    expect(
      isFilterValid({ operator: 'notEquals', type: 'text', value: '' }),
    ).toBe(false);
  });

  it('returns false for text contains with empty value', () => {
    expect(
      isFilterValid({ operator: 'contains', type: 'text', value: '  ' }),
    ).toBe(false);
  });

  it('returns true for text contains with value', () => {
    expect(
      isFilterValid({ operator: 'contains', type: 'text', value: 'hello' }),
    ).toBe(true);
  });

  it('returns false for multiSelect filter without values', () => {
    expect(
      isFilterValid({ operator: 'equals', type: 'multiSelect', values: [] }),
    ).toBe(false);
  });

  it('returns true for multiSelect filter with values', () => {
    expect(
      isFilterValid({
        operator: 'equals',
        type: 'multiSelect',
        values: ['a'],
      }),
    ).toBe(true);
  });
});
