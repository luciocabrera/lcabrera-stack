import { describe, expect, it } from 'vite-plus/test';

import { deserializeFilter } from './deserializeFilter.util';

describe('deserializeFilter', () => {
  it('returns boolean filter for true', () => {
    expect(deserializeFilter(true)).toEqual({ type: 'boolean', value: true });
  });

  it('returns boolean filter for false', () => {
    expect(deserializeFilter(false)).toEqual({ type: 'boolean', value: false });
  });

  it('returns undefined for non-array non-boolean', () => {
    expect(deserializeFilter('string')).toBeUndefined();
    expect(deserializeFilter(42)).toBeUndefined();
    expect(deserializeFilter({})).toBeUndefined();
  });

  it('returns undefined for empty array', () => {
    expect(deserializeFilter([])).toBeUndefined();
  });

  it('returns select notEquals for ["!", ...]', () => {
    expect(deserializeFilter(['!', 'Draft', 'Active'])).toEqual({
      operator: 'notEquals',
      type: 'select',
      values: ['Draft', 'Active'],
    });
  });

  it('returns number filter for operator + number', () => {
    expect(deserializeFilter(['eq', 42])).toEqual({
      operator: 'equals',
      type: 'number',
      value: 42,
    });
  });

  it('returns undefined for non-number operators with numeric payload', () => {
    expect(deserializeFilter(['ct', 5])).toBeUndefined();
  });

  it('returns number between filter for bw operator', () => {
    expect(deserializeFilter(['bw', 10, 20])).toEqual({
      operator: 'between',
      type: 'number',
      value: 10,
      value2: 20,
    });
  });

  it('returns date filter for date operator + date string', () => {
    expect(deserializeFilter(['af', '2024-01-15'])).toEqual({
      operator: 'after',
      type: 'date',
      value: '2024-01-15',
    });
  });

  it('returns date between filter', () => {
    expect(deserializeFilter(['bw', '2024-01-01', '2024-12-31'])).toEqual({
      operator: 'between',
      type: 'date',
      value: '2024-01-01',
      value2: '2024-12-31',
    });
  });

  it('returns text filter for text operator + string', () => {
    expect(deserializeFilter(['ct', 'hello'])).toEqual({
      operator: 'contains',
      type: 'text',
      value: 'hello',
    });
  });

  it('returns select equals for plain string array', () => {
    expect(deserializeFilter(['Active', 'Inactive'])).toEqual({
      operator: 'equals',
      type: 'select',
      values: ['Active', 'Inactive'],
    });
  });

  it('returns undefined for null', () => {
    expect(deserializeFilter(undefined)).toBeUndefined();
  });
});
