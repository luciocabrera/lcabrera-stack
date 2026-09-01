import { describe, expect, it } from 'vite-plus/test';

import type { ColumnFiltersState } from '#ui/components/Table';

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

  it('drops the whole state for a param that is not a column-keyed object', () => {
    expect(deserializeFiltersFromURL('[["ct","hello"]]')).toEqual({});
    expect(deserializeFiltersFromURL('"hello"')).toEqual({});
    expect(deserializeFiltersFromURL('42')).toEqual({});
    expect(deserializeFiltersFromURL('null')).toEqual({});
  });

  it('degrades rather than throwing on a hand-edited param', () => {
    expect(() => deserializeFiltersFromURL('{not json')).not.toThrow();
    expect(() => deserializeFiltersFromURL('[["ct","hello"]]')).not.toThrow();
  });
});
