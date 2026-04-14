import { describe, expect, it } from 'vitest';

import { serializeStateSlice } from './serializeStateSlice.util';

describe('serializeStateSlice', () => {
  it('returns key with storage prefix', () => {
    const result = serializeStateSlice({
      persistenceKey: 'myTable',
      slice: 'sorting',
      value: [],
    });
    expect(result.key).toBe('table-state-myTable-sorting');
  });

  it('serializes value with version', () => {
    const sorting = [{ columnKey: 'name', direction: 'asc' }];
    const result = serializeStateSlice({
      persistenceKey: 'myTable',
      slice: 'sorting',
      value: sorting,
    });
    const parsed = JSON.parse(result.value) as {
      value: unknown;
      version: number;
    };
    expect(parsed.version).toBe(1);
    expect(parsed.value).toEqual(sorting);
  });

  it('converts Set to Array for columnVisibility', () => {
    const visibility = new Set(['id', 'name']);
    const result = serializeStateSlice({
      persistenceKey: 'myTable',
      slice: 'columnVisibility',
      value: visibility,
    });
    const parsed = JSON.parse(result.value) as {
      value: unknown;
      version: number;
    };
    expect(Array.isArray(parsed.value)).toBe(true);
    expect((parsed.value as string[]).sort()).toEqual(['id', 'name'].sort());
  });

  it('does not convert non-Set value for columnVisibility', () => {
    const result = serializeStateSlice({
      persistenceKey: 'myTable',
      slice: 'columnVisibility',
      value: ['id'],
    });
    const parsed = JSON.parse(result.value) as { value: unknown };
    expect(parsed.value).toEqual(['id']);
  });
});
