// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { MockStore } from '#ui/utils/tests/createMockStore.util';

import { createMockStore } from '#ui/utils/tests/createMockStore.util';

const createInitialColumnsState = () => {
  return {
    columnFilters: {
      status: {
        operator: 'equals',
        type: 'select',
        value: 'paid',
      },
    },
    columnOrder: ['id', 'status', 'actions'],
    columnPinning: { left: ['id'], right: ['actions'] },
    columns: [{ key: 'id' }, { key: 'status' }, { key: 'actions' }],
    columnSizing: { id: 120, status: 180 },
    columnVisibility: new Set(['status']),
    effectiveColumns: [{ key: 'id' }, { key: 'status' }],
    normalizedColumns: {
      actions: { key: 'actions', label: 'Actions' },
      status: { key: 'status', label: 'Status' },
    },
    pinnedColumnOffsets: {
      actions: {
        isFirstPinnedRight: true,
        isLastPinnedLeft: false,
        offset: 0,
        side: 'right',
      },
      id: {
        isFirstPinnedRight: false,
        isLastPinnedLeft: true,
        offset: 0,
        side: 'left',
      },
    },
    pinnedColumnPartition: {
      center: [{ key: 'status' }],
      left: [{ key: 'id' }],
      right: [{ key: 'actions' }],
    },
    sorting: [{ columnKey: 'status', direction: 'desc' }],
    staticKeys: new Set(['id']),
  };
};

type ColumnsStoreState = ReturnType<typeof createInitialColumnsState>;

const storesRef: {
  columnsStore: MockStore<ColumnsStoreState>;
  metaStore: MockStore<Record<string, never>>;
} = {
  columnsStore: createMockStore(createInitialColumnsState()),
  metaStore: createMockStore({}),
};

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({
      columnsStore: storesRef.columnsStore,
      metaStore: storesRef.metaStore,
    }),
  }),
);

import { useGetColumnFilters } from './selectors/useGetColumnFilters.hook';
import { useGetColumnOrder } from './selectors/useGetColumnOrder.hook';
import { useGetColumnPinning } from './selectors/useGetColumnPinning.hook';
import { useGetColumns } from './selectors/useGetColumns.hook';
import { useGetColumnSizing } from './selectors/useGetColumnSizing.hook';
import { useGetColumnsSorting } from './selectors/useGetColumnsSorting.hook';
import { useGetColumnVisibility } from './selectors/useGetColumnVisibility.hook';
import { useGetColumnWidth } from './selectors/useGetColumnWidth.hook';
import { useGetNormalizedColumn } from './selectors/useGetNormalizedColumn.hook';
import { useGetNormalizedColumns } from './selectors/useGetNormalizedColumns.hook';
import { useGetPinnedColumnInfo } from './selectors/useGetPinnedColumnInfo.hook';
import { useGetPinnedColumnOffsets } from './selectors/useGetPinnedColumnOffsets.hook';
import { useGetPinnedColumnPartition } from './selectors/useGetPinnedColumnPartition.hook';
import { useColumnsStore } from './useColumnsStore.hook';

describe('TableConfig column hooks', () => {
  beforeEach(() => {
    storesRef.columnsStore = createMockStore(createInitialColumnsState());
    storesRef.metaStore = createMockStore({});
  });

  it('subscribes to the columns store and updates derived selections', () => {
    const { result } = renderHook(() =>
      useColumnsStore((state) => state.columnOrder),
    );

    expect(result.current).toEqual(['id', 'status', 'actions']);

    act(() => {
      storesRef.columnsStore.set({ columnOrder: ['status', 'id', 'actions'] });
    });

    expect(result.current).toEqual(['status', 'id', 'actions']);
  });

  it('exposes the column selector hooks', () => {
    expect(renderHook(() => useGetColumns()).result.current).toEqual([
      { key: 'id' },
      { key: 'status' },
      { key: 'actions' },
    ]);
    expect(renderHook(() => useGetColumnFilters()).result.current).toEqual({
      status: {
        operator: 'equals',
        type: 'select',
        value: 'paid',
      },
    });
    expect(
      renderHook(() => useGetPinnedColumnPartition()).result.current,
    ).toEqual({
      center: [{ key: 'status' }],
      left: [{ key: 'id' }],
      right: [{ key: 'actions' }],
    });
    expect(renderHook(() => useGetColumnOrder()).result.current).toEqual([
      'id',
      'status',
      'actions',
    ]);
    expect(renderHook(() => useGetColumnPinning()).result.current).toEqual({
      left: ['id'],
      right: ['actions'],
    });
    expect(renderHook(() => useGetColumnSizing()).result.current).toEqual({
      id: 120,
      status: 180,
    });
    expect(renderHook(() => useGetColumnWidth('id')).result.current).toBe(120);
    expect(
      renderHook(() => useGetColumnWidth('actions')).result.current,
    ).toBeUndefined();
    expect(renderHook(() => useGetColumnVisibility()).result.current).toEqual(
      new Set(['status']),
    );
    expect(renderHook(() => useGetColumnsSorting()).result.current).toEqual([
      { columnKey: 'status', direction: 'desc' },
    ]);
    expect(renderHook(() => useGetNormalizedColumns()).result.current).toEqual({
      actions: { key: 'actions', label: 'Actions' },
      status: { key: 'status', label: 'Status' },
    });
    expect(
      renderHook(() => useGetNormalizedColumn('status')).result.current,
    ).toEqual({
      key: 'status',
      label: 'Status',
    });
    expect(
      renderHook(() => useGetPinnedColumnOffsets()).result.current,
    ).toEqual({
      actions: {
        isFirstPinnedRight: true,
        isLastPinnedLeft: false,
        offset: 0,
        side: 'right',
      },
      id: {
        isFirstPinnedRight: false,
        isLastPinnedLeft: true,
        offset: 0,
        side: 'left',
      },
    });
    expect(
      renderHook(() => useGetPinnedColumnInfo('id')).result.current,
    ).toEqual({
      isFirstPinnedRight: false,
      isLastPinnedLeft: true,
      offset: 0,
      side: 'left',
    });
    expect(
      renderHook(() => useGetPinnedColumnInfo('status')).result.current,
    ).toBeUndefined();
  });
});
