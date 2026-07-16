import { describe, expect, it } from 'vitest';

import { createEmptyColumnsState } from './createEmptyColumnsState.util';

type Row = { readonly id: string; readonly name: string };

describe('createEmptyColumnsState', () => {
  it('returns genuinely empty defaults for every stateful field', () => {
    const columns = [{ key: 'name' as const, label: 'Name' }];
    const result = createEmptyColumnsState<Row>({ columns });

    expect(result).toEqual({
      columnFilters: {},
      columnOrder: [],
      columnPinning: { left: [], right: [] },
      columns,
      columnSizing: {},
      columnVisibility: new Set(),
      sorting: [],
    });
  });

  it('copies the columns array rather than aliasing it', () => {
    const columns = [{ key: 'name' as const, label: 'Name' }];
    const result = createEmptyColumnsState<Row>({ columns });

    expect(result.columns).not.toBe(columns);
    expect(result.columns).toEqual(columns);
  });
});
