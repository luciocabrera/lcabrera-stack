import { describe, expect, it } from 'vitest';

import { serializeFiltersToURL } from './serializeFiltersToURL.util';

describe('serializeFiltersToURL', () => {
  it('returns undefined for empty filters', () => {
    expect(serializeFiltersToURL({})).toBeUndefined();
  });

  it('serializes a boolean filter', () => {
    const result = serializeFiltersToURL({
      active: { type: 'boolean', value: true },
    });
    const parsed = JSON.parse(result!) as Record<string, unknown>;
    expect(parsed['active']).toBe(true);
  });

  it('serializes a text filter', () => {
    const result = serializeFiltersToURL({
      name: { operator: 'contains', type: 'text', value: 'hello' },
    });
    const parsed = JSON.parse(result!) as Record<string, unknown>;
    expect(parsed['name']).toEqual(['ct', 'hello']);
  });

  it('serializes a number filter with between operator', () => {
    const result = serializeFiltersToURL({
      age: { operator: 'between', type: 'number', value: 10, value2: 20 },
    });
    const parsed = JSON.parse(result!) as Record<string, unknown>;
    expect(parsed['age']).toEqual(['bw', 10, 20]);
  });

  it('serializes a number filter without between', () => {
    const result = serializeFiltersToURL({
      age: { operator: 'equals', type: 'number', value: 42 },
    });
    const parsed = JSON.parse(result!) as Record<string, unknown>;
    expect(parsed['age']).toEqual(['eq', 42]);
  });

  it('serializes a select filter with equals', () => {
    const result = serializeFiltersToURL({
      status: {
        operator: 'equals',
        type: 'select',
        values: ['Active', 'Inactive'],
      },
    });
    const parsed = JSON.parse(result!) as Record<string, unknown>;
    expect(parsed['status']).toEqual(['Active', 'Inactive']);
  });

  it('serializes a select filter with notEquals', () => {
    const result = serializeFiltersToURL({
      status: { operator: 'notEquals', type: 'select', values: ['Draft'] },
    });
    const parsed = JSON.parse(result!) as Record<string, unknown>;
    expect(parsed['status']).toEqual(['!', 'Draft']);
  });

  it('serializes a date filter with between operator', () => {
    const result = serializeFiltersToURL({
      date: {
        operator: 'between',
        type: 'date',
        value: '2024-01-01',
        value2: '2024-12-31',
      },
    });
    const parsed = JSON.parse(result!) as Record<string, unknown>;
    expect(parsed['date']).toEqual(['bw', '2024-01-01', '2024-12-31']);
  });

  it('serializes a date filter without between', () => {
    const result = serializeFiltersToURL({
      date: { operator: 'after', type: 'date', value: '2024-01-01' },
    });
    const parsed = JSON.parse(result!) as Record<string, unknown>;
    expect(parsed['date']).toEqual(['af', '2024-01-01']);
  });

  it('falls back to single select value when values array is not provided', () => {
    const result = serializeFiltersToURL({
      status: { operator: 'equals', type: 'select', value: 'Active' },
    });
    const parsed = JSON.parse(result!) as Record<string, unknown>;

    expect(parsed['status']).toEqual(['Active']);
  });

  it('serializes a number between filter without value2 as a single-value tuple', () => {
    const result = serializeFiltersToURL({
      amount: { operator: 'between', type: 'number', value: 100 },
    });
    const parsed = JSON.parse(result!) as Record<string, unknown>;

    expect(parsed['amount']).toEqual(['bw', 100]);
  });

  it('serializes a date between filter without value2 as a single-value tuple', () => {
    const result = serializeFiltersToURL({
      date: { operator: 'between', type: 'date', value: '2024-01-01' },
    });
    const parsed = JSON.parse(result!) as Record<string, unknown>;

    expect(parsed['date']).toEqual(['bw', '2024-01-01']);
  });
});
