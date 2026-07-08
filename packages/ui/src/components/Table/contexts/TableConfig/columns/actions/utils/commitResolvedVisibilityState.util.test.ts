import { describe, expect, it, vi } from 'vitest';

import { commitResolvedVisibilityState } from './commitResolvedVisibilityState.util';

const { mockGetPinnedDerivedColumnsState } = vi.hoisted(() => ({
  mockGetPinnedDerivedColumnsState: vi.fn(() => ({
    columnGroups: {
      centerCols: [{ key: 'name', label: 'Name' }],
      leftPinnedCols: [{ key: 'id', label: 'ID' }],
      rightPinnedCols: [],
    },
    effectiveColumns: [{ key: 'id', label: 'ID' }],
    pinnedColumnOffsets: {
      id: {
        isFirstPinnedRight: false,
        isLastPinnedLeft: true,
        offset: 0,
        side: 'left',
      },
    },
  })),
}));

vi.mock('@repo/ui/components/Table/utils', () => ({
  getPinnedDerivedColumnsState: mockGetPinnedDerivedColumnsState,
}));

type TData = { id: string; name: string };

describe('commitResolvedVisibilityState', () => {
  it('recomputes derived state, persists, commits, and bumps drawersSyncNonce', () => {
    const columnsStore = { set: vi.fn() };
    const metaStore = { set: vi.fn() };
    const persistTableState = vi.fn(() => true);
    const columnVisibility = new Set<keyof TData>(['name']);

    const result = commitResolvedVisibilityState<TData>({
      columnOrder: ['id', 'name'],
      columnPinning: { left: ['id'], right: [] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      columnSizing: { actions: 0, id: 100, name: 0 },
      columnsStore,
      columnVisibility,
      drawersSyncNonce: 3,
      metaStore,
      persistenceKey: 'orders-table',
      persistTableState,
    });

    expect(mockGetPinnedDerivedColumnsState).toHaveBeenCalledWith({
      columnOrder: ['id', 'name'],
      columnPinning: { left: ['id'], right: [] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      columnSizing: { actions: 0, id: 100, name: 0 },
      columnVisibility,
    });

    expect(persistTableState).toHaveBeenCalledWith([
      {
        persistenceKey: 'orders-table',
        slice: 'columnVisibility',
        valueSlice: columnVisibility,
      },
    ]);

    expect(columnsStore.set).toHaveBeenCalledWith({
      columnGroups: {
        centerCols: [{ key: 'name', label: 'Name' }],
        leftPinnedCols: [{ key: 'id', label: 'ID' }],
        rightPinnedCols: [],
      },
      columnVisibility,
      effectiveColumns: [{ key: 'id', label: 'ID' }],
      pinnedColumnOffsets: {
        id: {
          isFirstPinnedRight: false,
          isLastPinnedLeft: true,
          offset: 0,
          side: 'left',
        },
      },
    });

    expect(metaStore.set).toHaveBeenCalledWith({ drawersSyncNonce: 4 });
    expect(result).toBe(true);
  });

  it('does not commit or bump the nonce when persistence fails', () => {
    const columnsStore = { set: vi.fn() };
    const metaStore = { set: vi.fn() };
    const persistTableState = vi.fn(() => false);

    const result = commitResolvedVisibilityState<TData>({
      columnOrder: ['id', 'name'],
      columnPinning: { left: [], right: [] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      columnsStore,
      columnVisibility: new Set(['name']),
      drawersSyncNonce: 3,
      metaStore,
      persistenceKey: 'orders-table',
      persistTableState,
    });

    expect(columnsStore.set).not.toHaveBeenCalled();
    expect(metaStore.set).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});
