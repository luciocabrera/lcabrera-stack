import type { TableMetaState } from '@lcabrera/ui/components/Table/Table.types';

import {
  createMockStore,
  type MockStore,
} from '@lcabrera/ui/utils/tests/createMockStore.util';
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const createInitialMetaState = (): TableMetaState => {
  return {
    columnOverscan: 2,
    columnSelectedKey: 'id',
    columnSettingsSelectedTab: 'general',
    density: 'compact',
    enablePrefetch: true,
    error: undefined,
    initialPageSize: 20,
    isBordered: true,
    isColumnSettingsOpen: false,
    isColumnSettingsPinned: false,
    isStriped: true,
    isTableSettingsOpen: false,
    isTableSettingsPinned: false,
    loadMorePageSize: 50,
    overscan: 4,
    persistenceKey: 'orders',
    placeholderRowCount: 8,
    rowHeight: 44,
    tableSettingsExpandedFilters: [],
    tableSettingsSelectedTab: 'general',
    threshold: 200,
    title: {
      plural: 'Orders',
      singular: 'Order',
    },
    wasTableSettingsOpenBeforeColumnSettings: false,
  };
};

type MetaStoreState = ReturnType<typeof createInitialMetaState>;

const storesRef: {
  columnsStore: MockStore<Record<string, never>>;
  metaStore: MockStore<MetaStoreState>;
} = {
  columnsStore: createMockStore({}),
  metaStore: createMockStore(createInitialMetaState()),
};

const getTableConfigContextValue = vi.hoisted(() => {
  return function getTableConfigContextValue() {
    return {
      columnsStore: storesRef.columnsStore,
      metaStore: storesRef.metaStore,
    };
  };
});

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: getTableConfigContextValue,
  }),
);

vi.mock('@lcabrera/ui/hooks/usePersistCookieAction.hook', () => ({
  usePersistCookieAction: () => vi.fn(),
}));

import { useSetTableColumnSelectedKey } from './actions/useSetTableColumnSelectedKey.hook';
import { useSetTableDrawersOpenState } from './actions/useSetTableDrawersOpenState.hook';
import { useSetTableIsTableSettingsOpen } from './actions/useSetTableIsTableSettingsOpen.hook';
import { useSetTableIsTableSettingsPinned } from './actions/useSetTableIsTableSettingsPinned.hook';
import { useSetTableSettingsExpandedFilters } from './actions/useSetTableSettingsExpandedFilters.hook';
import { useSetTableSettingsSelectedTab } from './actions/useSetTableSettingsSelectedTab.hook';
import { useToogleTableIsColumnSettingsOpen } from './actions/useToogleTableIsColumnSettingsOpen.hook';
import { useToogleTableIsTableSettingsOpen } from './actions/useToogleTableIsTableSettingsOpen.hook';
import { useGetTableColumnOverscan } from './selectors/useGetTableColumnOverscan.hook';
import { useGetTableColumnSelectedKey } from './selectors/useGetTableColumnSelectedKey.hook';
import { useGetTableDensity } from './selectors/useGetTableDensity.hook';
import { useGetTableEnablePrefetch } from './selectors/useGetTableEnablePrefetch.hook';
import { useGetTableIsBordered } from './selectors/useGetTableIsBordered.hook';
import { useGetTableIsColumnSettingsOpen } from './selectors/useGetTableIsColumnSettingsOpen.hook';
import { useGetTableIsStriped } from './selectors/useGetTableIsStriped.hook';
import { useGetTableIsTableSettingsOpen } from './selectors/useGetTableIsTableSettingsOpen.hook';
import { useGetTableIsTableSettingsPinned } from './selectors/useGetTableIsTableSettingsPinned.hook';
import { useGetTableLoadMorePageSize } from './selectors/useGetTableLoadMorePageSize.hook';
import { useGetTableOverscan } from './selectors/useGetTableOverscan.hook';
import { useGetTablePlaceholderRowCount } from './selectors/useGetTablePlaceholderRowCount.hook';
import { useGetTableRowHeight } from './selectors/useGetTableRowHeight.hook';
import { useGetTableSettingsExpandedFilters } from './selectors/useGetTableSettingsExpandedFilters.hook';
import { useGetTableSettingsSelectedTab } from './selectors/useGetTableSettingsSelectedTab.hook';
import { useGetTableThreshold } from './selectors/useGetTableThreshold.hook';
import { useGetTableTitlePlural } from './selectors/useGetTableTitlePlural.hook';
import { useGetTableTitleSingular } from './selectors/useGetTableTitleSingular.hook';
import { useMetaStore } from './useMetaStore.hook';

describe('TableConfig meta hooks', () => {
  beforeEach(() => {
    storesRef.columnsStore = createMockStore({});
    storesRef.metaStore = createMockStore(createInitialMetaState());
  });

  it('subscribes to the meta store and updates selected state', () => {
    const { result } = renderHook(() => useMetaStore((state) => state.density));

    expect(result.current).toBe('compact');

    act(() => {
      storesRef.metaStore.set({ density: 'comfortable' });
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
    expect(
      renderHook(() => useGetTableIsTableSettingsPinned()).result.current,
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
    expect(
      renderHook(() => useGetTableSettingsExpandedFilters()).result.current,
    ).toEqual([]);
    expect(
      renderHook(() => useGetTableSettingsSelectedTab()).result.current,
    ).toBe('general');
    expect(renderHook(() => useGetTableThreshold()).result.current).toBe(200);
    expect(renderHook(() => useGetTableTitlePlural()).result.current).toBe(
      'Orders',
    );
    expect(renderHook(() => useGetTableTitleSingular()).result.current).toBe(
      'Order',
    );
  });

  it('updates selected column keys and drawer state through the action hooks', () => {
    const setSelectedKey = renderHook(() => useSetTableColumnSelectedKey());
    const toggleColumnSettings = renderHook(() =>
      useToogleTableIsColumnSettingsOpen(),
    );
    const toggleTableSettings = renderHook(() =>
      useToogleTableIsTableSettingsOpen(),
    );
    const setDrawersOpenState = renderHook(() => useSetTableDrawersOpenState());
    const setTableSettingsExpandedFilters = renderHook(() =>
      useSetTableSettingsExpandedFilters(),
    );
    const setTableSettingsSelectedTab = renderHook(() =>
      useSetTableSettingsSelectedTab(),
    );
    const setTableSettingsOpen = renderHook(() =>
      useSetTableIsTableSettingsOpen(),
    );
    const setTableSettingsPinned = renderHook(() =>
      useSetTableIsTableSettingsPinned(),
    );

    act(() => {
      setSelectedKey.result.current('status');
      toggleColumnSettings.result.current();
      toggleTableSettings.result.current();
      setDrawersOpenState.result.current({
        isColumnSettingsOpen: true,
        isTableSettingsOpen: false,
      });
      setTableSettingsExpandedFilters.result.current(['status']);
      setTableSettingsSelectedTab.result.current('sorting');
      setTableSettingsOpen.result.current(true);
      setTableSettingsPinned.result.current(true);
    });

    expect(storesRef.metaStore.get().columnSelectedKey).toBe('status');
    expect(storesRef.metaStore.get().isColumnSettingsOpen).toBe(true);
    expect(storesRef.metaStore.get().isTableSettingsPinned).toBe(true);
    expect(storesRef.metaStore.get().isTableSettingsOpen).toBe(true);
    expect(storesRef.metaStore.get().tableSettingsExpandedFilters).toEqual([
      'status',
    ]);
    expect(storesRef.metaStore.get().tableSettingsSelectedTab).toBe('sorting');
  });
});
