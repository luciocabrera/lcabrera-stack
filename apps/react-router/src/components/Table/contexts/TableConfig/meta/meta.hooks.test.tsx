// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TableMetaState } from '@/components/Table/Table.types';
import {
  createMockStore,
  type MockStore,
} from '@/components/test-utils/createMockStore.util';

const createInitialMetaState = (): TableMetaState => {
  return {
    columnOverscan: 2,
    columnSelectedKey: 'id',
    density: 'compact',
    enablePrefetch: true,
    error: undefined,
    initialPageSize: 20,
    isBordered: true,
    isColumnSettingsOpen: false,
    isStriped: true,
    isTableSettingsOpen: false,
    loadMorePageSize: 50,
    overscan: 4,
    persistenceKey: 'orders',
    placeholderRowCount: 8,
    rowHeight: 44,
    threshold: 200,
    title: 'Orders',
  };
};

type MetaStoreState = ReturnType<typeof createInitialMetaState>;

let columnsStore: MockStore<Record<string, never>> = createMockStore({});
let metaStore: MockStore<MetaStoreState> = createMockStore(
  createInitialMetaState(),
);

vi.mock(
  '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({
      columnsStore,
      metaStore,
    }),
  }),
);

import { useSetTableColumnSelectedKey } from './actions/useSetTableColumnSelectedKey.hook';
import { useToogleTableIsColumnSettingsOpen } from './actions/useToogleTableIsColumnSettingsOpen.hook';
import { useToogleTableIsTableSettingsOpen } from './actions/useToogleTableIsTableSettingsOpen.hook';
import { useMetaStore } from './useMetaStore.hook';
import { useGetTableColumnOverscan } from './selectors/useGetTableColumnOverscan.hook';
import { useGetTableColumnSelectedKey } from './selectors/useGetTableColumnSelectedKey.hook';
import { useGetTableDensity } from './selectors/useGetTableDensity.hook';
import { useGetTableEnablePrefetch } from './selectors/useGetTableEnablePrefetch.hook';
import { useGetTableIsBordered } from './selectors/useGetTableIsBordered.hook';
import { useGetTableIsColumnSettingsOpen } from './selectors/useGetTableIsColumnSettingsOpen.hook';
import { useGetTableIsStriped } from './selectors/useGetTableIsStriped.hook';
import { useGetTableIsTableSettingsOpen } from './selectors/useGetTableIsTableSettingsOpen.hook';
import { useGetTableLoadMorePageSize } from './selectors/useGetTableLoadMorePageSize.hook';
import { useGetTableOverscan } from './selectors/useGetTableOverscan.hook';
import { useGetTablePlaceholderRowCount } from './selectors/useGetTablePlaceholderRowCount.hook';
import { useGetTableRowHeight } from './selectors/useGetTableRowHeight.hook';
import { useGetTableThreshold } from './selectors/useGetTableThreshold.hook';
import { useGetTableTitle } from './selectors/useGetTableTitle.hook';

describe('TableConfig meta hooks', () => {
  beforeEach(() => {
    columnsStore = createMockStore({});
    metaStore = createMockStore(createInitialMetaState());
  });

  it('subscribes to the meta store and updates selected state', () => {
    const { result } = renderHook(() => useMetaStore((state) => state.density));

    expect(result.current).toBe('compact');

    act(() => {
      metaStore.set({ density: 'comfortable' });
    });

    expect(result.current).toBe('comfortable');
  });

  it('exposes the meta selector hooks', () => {
    expect(renderHook(() => useGetTableColumnOverscan()).result.current).toBe(
      2,
    );
    expect(
      renderHook(() => useGetTableColumnSelectedKey()).result.current,
    ).toBe('id');
    expect(renderHook(() => useGetTableDensity()).result.current).toBe(
      'compact',
    );
    expect(renderHook(() => useGetTableEnablePrefetch()).result.current).toBe(
      true,
    );
    expect(renderHook(() => useGetTableIsBordered()).result.current).toBe(true);
    expect(
      renderHook(() => useGetTableIsColumnSettingsOpen()).result.current,
    ).toBe(false);
    expect(renderHook(() => useGetTableIsStriped()).result.current).toBe(true);
    expect(
      renderHook(() => useGetTableIsTableSettingsOpen()).result.current,
    ).toBe(false);
    expect(renderHook(() => useGetTableLoadMorePageSize()).result.current).toBe(
      50,
    );
    expect(renderHook(() => useGetTableOverscan()).result.current).toBe(4);
    expect(
      renderHook(() => useGetTablePlaceholderRowCount()).result.current,
    ).toBe(8);
    expect(renderHook(() => useGetTableRowHeight()).result.current).toBe(44);
    expect(renderHook(() => useGetTableThreshold()).result.current).toBe(200);
    expect(renderHook(() => useGetTableTitle()).result.current).toBe('Orders');
  });

  it('updates selected column keys and drawer state through the action hooks', () => {
    const setSelectedKey = renderHook(() => useSetTableColumnSelectedKey());
    const toggleColumnSettings = renderHook(() =>
      useToogleTableIsColumnSettingsOpen(),
    );
    const toggleTableSettings = renderHook(() =>
      useToogleTableIsTableSettingsOpen(),
    );

    act(() => {
      setSelectedKey.result.current('status');
      toggleColumnSettings.result.current();
      toggleTableSettings.result.current();
    });

    expect(metaStore.get().columnSelectedKey).toBe('status');
    expect(metaStore.get().isColumnSettingsOpen).toBe(true);
    expect(metaStore.get().isTableSettingsOpen).toBe(true);
  });
});
