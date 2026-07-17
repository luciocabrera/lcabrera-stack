import { describe, expect, it, vi } from 'vitest';

import { commitResolvedPinningState } from './commitResolvedPinningState.util';

const { mockCommitPinningAndOrderUpdate, mockGetPinnedDerivedColumnsState } =
  vi.hoisted(() => ({
    mockCommitPinningAndOrderUpdate: vi.fn(() => true),
    mockGetPinnedDerivedColumnsState: vi.fn(() => ({
      effectiveColumns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      pinnedColumnOffsets: {
        id: {
          isFirstPinnedRight: false,
          isLastPinnedLeft: true,
          offset: 0,
          side: 'left',
        },
      },
      pinnedColumnPartition: {
        centerCols: [{ key: 'name', label: 'Name' }],
        leftPinnedCols: [{ key: 'id', label: 'ID' }],
        rightPinnedCols: [],
      },
    })),
  }));

vi.mock('@repo/ui/components/Table/utils', () => ({
  getPinnedDerivedColumnsState: mockGetPinnedDerivedColumnsState,
}));

vi.mock('./commitPinningAndOrderUpdate.util', () => ({
  commitPinningAndOrderUpdate: mockCommitPinningAndOrderUpdate,
}));

type TData = { id: string; name: string };
describe('commitResolvedPinningState', () => {
  it('computes pinned derived state and commits through the shared helper', () => {
    const columnsStore = { set: vi.fn() };
    const metaStore = { set: vi.fn() };
    const persistTableState = vi.fn();

    commitResolvedPinningState<TData>({
      columnOrder: ['id', 'name'],
      columnPinning: { left: ['id'], right: [] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      columnSizing: {
        actions: 0,
        id: 100,
        name: 0,
      },
      columnsStore,
      columnVisibility: new Set<keyof TData>(),
      drawersSyncNonce: 7,
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
      columnSizing: {
        actions: 0,
        id: 100,
        name: 0,
      },
      columnVisibility: new Set<keyof TData>(),
    });

    expect(mockCommitPinningAndOrderUpdate).toHaveBeenCalledWith({
      columnsStore,
      effectiveColumns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      newColumnOrder: ['id', 'name'],
      newPinning: { left: ['id'], right: [] },
      persistenceKey: 'orders-table',
      persistTableState,
      pinnedColumnOffsets: {
        id: {
          isFirstPinnedRight: false,
          isLastPinnedLeft: true,
          offset: 0,
          side: 'left',
        },
      },
      pinnedColumnPartition: {
        centerCols: [{ key: 'name', label: 'Name' }],
        leftPinnedCols: [{ key: 'id', label: 'ID' }],
        rightPinnedCols: [],
      },
    });
    expect(metaStore.set).toHaveBeenCalledWith({ drawersSyncNonce: 8 });
  });
});
