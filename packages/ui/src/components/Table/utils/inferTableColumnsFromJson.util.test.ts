import { describe, expect, it } from 'vite-plus/test';

import { inferTableColumnsFromJson } from './inferTableColumnsFromJson.util';

describe('inferTableColumnsFromJson', () => {
  it('returns an empty array for no rows', () => {
    expect(inferTableColumnsFromJson({ rows: [] })).toEqual([]);
  });

  it('infers primitive column types from the first non-null observation', () => {
    const result = inferTableColumnsFromJson({
      rows: [{ active: true, age: 30, name: 'Ada' }],
    });
    expect(result).toEqual([
      { dataType: 'boolean', key: 'active', label: 'Active', minWidth: 120 },
      { dataType: 'number', key: 'age', label: 'Age', minWidth: 120 },
      { dataType: 'string', key: 'name', label: 'Name', minWidth: 120 },
    ]);
  });

  it('infers date columns from ISO-8601-shaped strings', () => {
    const result = inferTableColumnsFromJson({
      rows: [{ generatedAt: '2026-07-04T12:00:00Z' }],
    });
    expect(result).toEqual([
      {
        dataType: 'date',
        key: 'generatedAt',
        label: 'Generated At',
        minWidth: 120,
      },
    ]);
  });

  it('unions keys across rows with differing shapes, preserving first-seen order', () => {
    const result = inferTableColumnsFromJson({
      rows: [{ a: 1 }, { a: 2, b: 'x' }, { c: true }],
    });
    expect(result.map((col) => col.key)).toEqual(['a', 'b', 'c']);
  });

  it('falls back to string for a column with conflicting types across rows', () => {
    const result = inferTableColumnsFromJson({
      rows: [{ value: 1 }, { value: 'two' }],
    });
    expect(result).toEqual([
      { dataType: 'string', key: 'value', label: 'Value', minWidth: 120 },
    ]);
  });

  it('ignores null/undefined observations when inferring a type', () => {
    const rowsWithJsonNull = JSON.parse(
      '[{ "count": null }, { "count": 5 }]',
    ) as readonly Record<string, unknown>[];
    const result = inferTableColumnsFromJson({
      rows: rowsWithJsonNull,
    });
    expect(result).toEqual([
      { dataType: 'number', key: 'count', label: 'Count', minWidth: 120 },
    ]);
  });

  it('renders object and array columns as compact JSON strings, with no dataType', () => {
    const result = inferTableColumnsFromJson({
      rows: [{ instances: [{ file: 'a.ts' }], meta: { severity: 'high' } }],
    });
    expect(result[0]?.dataType).toBeUndefined();
    expect(
      result[0]?.render?.({ instances: [{ file: 'a.ts' }], meta: {} }),
    ).toBe('[{"file":"a.ts"}]');
    expect(result[1]?.dataType).toBeUndefined();
    expect(
      result[1]?.render?.({ instances: [], meta: { severity: 'high' } }),
    ).toBe('{"severity":"high"}');
  });

  it('humanizes camelCase and snake_case keys into labels', () => {
    const result = inferTableColumnsFromJson({
      rows: [{ file_path: 'x', locationHint: 'y' }],
    });
    expect(result.map((col) => col.label)).toEqual([
      'File path',
      'Location Hint',
    ]);
  });
});
