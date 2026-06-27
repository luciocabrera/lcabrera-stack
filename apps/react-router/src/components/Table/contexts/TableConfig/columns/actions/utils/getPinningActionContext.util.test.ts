import { describe, expect, it } from 'vitest';

import type {
  ColumnSizingState,
  TableColumnsState,
} from '@/components/Table/Table.types';

import { getPinningActionContext } from './getPinningActionContext.util';

describe('getPinningActionContext', () => {
  it('returns safe defaults when stores have no state', () => {
    const context = getPinningActionContext({
      columnsStore: {
        get: () => {},
      },
      metaStore: {
        get: () => {},
      },
    });

    expect(context).toEqual({
      columnOrder: [],
      columnPinning: { left: [], right: [] },
      columns: [],
      columnSizing: undefined,
      columnVisibility: undefined,
      drawersSyncNonce: 0,
      persistenceKey: '',
      staticKeys: undefined,
    });
  });
  type TData = { id: string; name: string };

  it('returns normalized state from stores when available', () => {
    const context = getPinningActionContext<TData>({
      columnsStore: {
        get: () =>
          ({
            columnOrder: ['id', 'name'],
            columnPinning: { left: ['id'], right: [] },
            columns: [
              { key: 'id', label: 'ID' },
              { key: 'name', label: 'Name' },
            ],
            columnSizing: { id: 100 } as unknown as ColumnSizingState<TData>,
            columnVisibility: new Set(['name']),
            staticKeys: new Set(['id']),
          }) as unknown as TableColumnsState<TData>,
      },
      metaStore: {
        get: () => ({ drawersSyncNonce: 3, persistenceKey: 'orders-table' }),
      },
    });

    expect(context.columnOrder).toEqual(['id', 'name']);
    expect(context.columnPinning).toEqual({ left: ['id'], right: [] });
    expect(context.columnSizing).toEqual({ id: 100 });
    expect(context.columnVisibility).toEqual(new Set(['name']));
    expect(context.columns).toEqual([
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ]);
    expect(context.staticKeys).toEqual(new Set(['id']));
    expect(context.drawersSyncNonce).toBe(3);
    expect(context.persistenceKey).toBe('orders-table');
  });
});
