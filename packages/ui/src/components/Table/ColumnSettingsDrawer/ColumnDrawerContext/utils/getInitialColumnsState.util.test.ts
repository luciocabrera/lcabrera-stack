import { describe, expect, it } from 'vite-plus/test';

import { getInitialColumnsState } from './getInitialColumnsState.util';

describe('getInitialColumnsState (ColumnDrawerContext)', () => {
  it('returns all provided fields', () => {
    const result = getInitialColumnsState({
      columnKey: 'name',
      columnPinning: 'left',
      columnSizing: 100,
      sorting: 'asc',
    });
    expect(result.columnKey).toBe('name');
    expect(result.columnPinning).toBe('left');
    expect(result.columnSizing).toBe(100);
    expect(result.sorting).toBe('asc');
  });

  it('returns undefined for omitted optional fields', () => {
    const result = getInitialColumnsState({});
    expect(result.columnKey).toBeUndefined();
    expect(result.columnFilter).toBeUndefined();
  });
});
