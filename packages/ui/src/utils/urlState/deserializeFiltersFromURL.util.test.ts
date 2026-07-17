import type { ColumnFiltersState } from '@repo/ui/components/Table';

import { describe, expect, it } from 'vitest';

import { deserializeFiltersFromURL } from './deserializeFiltersFromURL.util';

type AnyFilters = ColumnFiltersState<Record<string, unknown>>;

describe('deserializeFiltersFromURL', () => {
  it('deserializes a boolean filter', () => {
    const param = JSON.stringify({ active: true });
    const result = deserializeFiltersFromURL(param) as AnyFilters;
    expect(result.active).toEqual({ type: 'boolean', value: true });
  });

  it('deserializes a text filter', () => {
    const param = JSON.stringify({ name: ['ct', 'hello'] });
    const result = deserializeFiltersFromURL(param) as AnyFilters;
    expect(result.name).toEqual({
      operator: 'contains',
      type: 'text',
      value: 'hello',
    });
  });

  it('deserializes a select equals filter', () => {
    const param = JSON.stringify({ status: ['Active', 'Inactive'] });
    const result = deserializeFiltersFromURL(param) as AnyFilters;
    expect(result.status).toEqual({
      operator: 'equals',
      type: 'select',
      values: ['Active', 'Inactive'],
    });
  });

  it('deserializes a select notEquals filter', () => {
    const param = JSON.stringify({ status: ['!', 'Draft'] });
    const result = deserializeFiltersFromURL(param) as AnyFilters;
    expect(result.status).toEqual({
      operator: 'notEquals',
      type: 'select',
      values: ['Draft'],
    });
  });

  it('returns empty object for invalid JSON', () => {
    expect(deserializeFiltersFromURL('not-json')).toEqual({});
  });

  it('filters out unparseable entries', () => {
    const param = JSON.stringify({ bad: [], name: ['ct', 'test'] });
    const result = deserializeFiltersFromURL(param) as AnyFilters;
    expect('bad' in result).toBe(false);
    expect(result.name).toBeDefined();
  });
});
