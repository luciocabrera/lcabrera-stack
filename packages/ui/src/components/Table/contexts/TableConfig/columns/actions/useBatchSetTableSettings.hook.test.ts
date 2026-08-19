// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

import { useBatchSetTableSettings } from './useBatchSetTableSettings.hook';

type Row = {
  readonly age: number;
  readonly id: string;
  readonly name: string;
};

const NO_GROUPING: TableGroupingState = {
  aggregates: {},
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
};

const {
  mockBuildPersistencePayload,
  mockColumnsStore,
  mockDataStore,
  mockGroupingStore,
  mockMetaStore,
  mockPersistTableState,
  mockPersistUiFlags,
  mockResolveBatchTableSettingsUpdate,
} = vi.hoisted(() => {
  return {
    mockBuildPersistencePayload: vi.fn(() => [
      {
        persistenceKey: 'orders-table',
        slice: 'columnOrder',
        valueSlice: ['id', 'age', 'name'],
      },
    ]),
    mockColumnsStore: {
      get: vi.fn(() => ({
        columnFilters: {
          name: { operator: 'contains', type: 'text', value: 'ali' },
        },
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'age', label: 'Age' },
        ],
        sorting: [{ columnKey: 'name', direction: 'asc' }],
      })),
      set: vi.fn(),
    },
    mockDataStore: {
      set: vi.fn(),
    },
    mockGroupingStore: {
      get: vi.fn(
        (): TableGroupingState => ({
          aggregates: {},
          keys: [],
          mode: 'flat',
          periods: {},
          shares: [],
        }),
      ),
      set: vi.fn(),
    },
    mockMetaStore: {
      get: vi.fn(() => ({
        isTableSettingsPinned: false,
        persistenceKey: 'orders-table',
      })),
      set: vi.fn(),
    },
    mockPersistTableState: vi.fn(),
    mockPersistUiFlags: vi.fn(),
    mockResolveBatchTableSettingsUpdate: vi.fn(() => ({
      columnFilters: {
        name: { operator: 'contains', type: 'text', value: 'ali' },
      },
      columnOrder: ['id', 'age', 'name'],
      columnPinning: { left: ['id'], right: ['name'] },
      columnSizing: {
        actions: 0,
        age: 80,
        id: 100,
        name: 220,
      },
      columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(['age']),
      effectiveColumns: [
        { key: 'id', label: 'ID' },
        { key: 'age', label: 'Age' },
        { key: 'name', label: 'Name' },
      ],
      normalizedColumns: {
        age: { key: 'age', label: 'Age' },
        id: { key: 'id', label: 'ID' },
        name: {
          key: 'name',
          label: 'Name',
          sortDirection: 'asc',
          sortIndex: 0,
        },
      },
      pinnedColumnOffsets: {
        id: {
          isFirstPinnedRight: false,
          isLastPinnedLeft: true,
          offset: 0,
          side: 'left',
        },
      },
      pinnedColumnPartition: {
        centerCols: [{ key: 'age', label: 'Age' }],
        leftPinnedCols: [{ key: 'id', label: 'ID' }],
        rightPinnedCols: [{ key: 'name', label: 'Name' }],
      },
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    })),
  };
});

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({
      columnsStore: mockColumnsStore,
      groupingStore: mockGroupingStore,
      metaStore: mockMetaStore,
    }),
  }),
);

vi.mock(
  '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook',
  () => ({
    useTableDataContextValue: () => ({ dataStore: mockDataStore }),
  }),
);

vi.mock('./hooks/usePersistTableStateAction.hook', () => ({
  usePersistTableStateAction: () => mockPersistTableState,
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/meta/actions/usePersistTableUiFlagsAction.hook',
  () => ({
    usePersistTableUiFlagsAction: () => mockPersistUiFlags,
  }),
);

vi.mock('./utils/buildPersistencePayload.util', () => ({
  buildPersistencePayload: mockBuildPersistencePayload,
}));

vi.mock('./utils/resolveBatchTableSettingsUpdate.util', () => ({
  resolveBatchTableSettingsUpdate: mockResolveBatchTableSettingsUpdate,
}));

describe('useBatchSetTableSettings', () => {
  beforeEach(() => {
    mockBuildPersistencePayload.mockClear();
    mockColumnsStore.get.mockClear();
    mockColumnsStore.set.mockClear();
    mockDataStore.set.mockClear();
    mockGroupingStore.get.mockClear();
    mockGroupingStore.get.mockReturnValue({
      aggregates: {},
      keys: [],
      mode: 'flat',
      periods: {},
      shares: [],
    });
    mockGroupingStore.set.mockClear();
    mockMetaStore.get.mockClear();
    // Restored rather than only cleared: one case below pins the drawer, and
    // without this every later case would inherit that.
    mockMetaStore.get.mockReturnValue({
      isTableSettingsPinned: false,
      persistenceKey: 'orders-table',
    });
    mockMetaStore.set.mockClear();
    mockPersistUiFlags.mockClear();
    mockPersistTableState.mockClear();
    mockPersistTableState.mockReturnValue(true);
    mockResolveBatchTableSettingsUpdate.mockClear();
  });

  it('orchestrates derived state, persistence, and loading around a table-wide update', () => {
    const { result } = renderHook(() => useBatchSetTableSettings<Row>());

    const settings: {
      readonly columnFilters: ColumnFiltersState<Row>;
      readonly columnOrder: ColumnOrderState<Row>;
      readonly columnPinning: ColumnPinningState<Row>;
      readonly columnSizing: ColumnSizingState<Row>;
      readonly columnVisibility: ColumnVisibilityState<Row>;
      readonly sorting: SortingState<Row>;
    } = {
      columnFilters: {
        name: { operator: 'contains', type: 'text', value: 'new-value' },
      } as ColumnFiltersState<Row>,
      columnOrder: ['id', 'age', 'name'],
      columnPinning: { left: ['id'], right: ['name'] },
      columnSizing: {
        actions: 0,
        age: 80,
        id: 100,
        name: 220,
      } as ColumnSizingState<Row>,
      columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(['age']),
      sorting: [{ columnKey: 'name', direction: 'desc' }],
    };

    act(() => {
      result.current({
        grouping: NO_GROUPING,
        settings,
        totalsPlacement: 'last',
      });
    });

    expect(mockDataStore.set).toHaveBeenNthCalledWith(1, {
      isLoading: true,
    });
    expect(mockColumnsStore.get).toHaveBeenCalledTimes(1);
    expect(mockResolveBatchTableSettingsUpdate).toHaveBeenCalledWith({
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      // Empty because this Accept stages no grouping: the hierarchy column
      // follows the grouping being committed, not the one already applied.
      groupingKeys: [],
      settings,
    });
    expect(mockBuildPersistencePayload).toHaveBeenCalledWith({
      columnFilters: {
        name: { operator: 'contains', type: 'text', value: 'new-value' },
      },
      columnOrder: ['id', 'age', 'name'],
      columnPinning: { left: ['id'], right: ['name'] },
      columnSizing: { actions: 0, age: 80, id: 100, name: 220 },
      columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(['age']),
      persistenceKey: 'orders-table',
      sorting: [{ columnKey: 'name', direction: 'desc' }],
    });
    expect(mockPersistTableState).toHaveBeenCalledWith([
      {
        persistenceKey: 'orders-table',
        slice: 'columnOrder',
        valueSlice: ['id', 'age', 'name'],
      },
    ]);
    expect(mockColumnsStore.set).toHaveBeenCalledWith(
      mockResolveBatchTableSettingsUpdate.mock.results[0]?.value,
    );
    expect(mockPersistUiFlags).toHaveBeenCalledWith({
      currentState: {
        isTableSettingsPinned: false,
        persistenceKey: 'orders-table',
      },
      nextStatePatch: {
        isTableSettingsOpen: false,
      },
    });
    expect(mockMetaStore.set).toHaveBeenCalledWith({
      isTableSettingsOpen: false,
    });
    expect(mockDataStore.set).toHaveBeenCalledTimes(1);
  });

  it('does not set loading for UI-only table updates when filters/sorting are unchanged', () => {
    const { result } = renderHook(() => useBatchSetTableSettings<Row>());

    act(() => {
      result.current({
        grouping: NO_GROUPING,
        settings: {
          columnFilters: {
            name: { operator: 'contains', type: 'text', value: 'ali' },
          } as ColumnFiltersState<Row>,
          columnOrder: ['id', 'age', 'name'],
          columnPinning: { left: ['id'], right: ['name'] },
          columnSizing: {
            actions: 0,
            age: 80,
            id: 100,
            name: 220,
          } as ColumnSizingState<Row>,
          columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(['age']),
          sorting: [
            { columnKey: 'name', direction: 'asc' },
          ] as SortingState<Row>,
        },
        totalsPlacement: 'last',
      });
    });

    expect(mockPersistTableState).toHaveBeenCalledTimes(1);
    expect(mockDataStore.set).not.toHaveBeenCalled();
    expect(mockColumnsStore.set).toHaveBeenCalledTimes(1);
  });

  it('sets loading when table filters/sorting changed', () => {
    const { result } = renderHook(() => useBatchSetTableSettings<Row>());

    act(() => {
      result.current({
        grouping: NO_GROUPING,
        settings: {
          columnFilters: {
            name: { operator: 'contains', type: 'text', value: 'new-value' },
          } as ColumnFiltersState<Row>,
          columnOrder: ['id', 'age', 'name'],
          columnPinning: { left: ['id'], right: ['name'] },
          columnSizing: {
            actions: 0,
            age: 80,
            id: 100,
            name: 220,
          } as ColumnSizingState<Row>,
          columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(['age']),
          sorting: [
            { columnKey: 'name', direction: 'desc' },
          ] as SortingState<Row>,
        },
        totalsPlacement: 'last',
      });
    });

    expect(mockDataStore.set).toHaveBeenCalledWith({
      isLoading: true,
    });
  });

  it('keeps table settings open when drawer is pinned', () => {
    mockMetaStore.get.mockReturnValue({
      isTableSettingsPinned: true,
      persistenceKey: 'orders-table',
    });

    const { result } = renderHook(() => useBatchSetTableSettings<Row>());

    act(() => {
      result.current({
        grouping: NO_GROUPING,
        settings: {
          columnFilters: {} as ColumnFiltersState<Row>,
          columnOrder: ['id', 'age', 'name'],
          columnPinning: { left: ['id'], right: ['name'] },
          columnSizing: {
            actions: 0,
            age: 80,
            id: 100,
            name: 220,
          } as ColumnSizingState<Row>,
          columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(['age']),
          sorting: [] as SortingState<Row>,
        },
        totalsPlacement: 'last',
      });
    });

    expect(mockColumnsStore.set).toHaveBeenCalledTimes(1);
    expect(mockMetaStore.set).not.toHaveBeenCalledWith({
      isTableSettingsOpen: false,
    });
  });
  it('carries a staged grouping change in the same persistence call as the column state', () => {
    const { result } = renderHook(() => useBatchSetTableSettings<Row>());

    act(() => {
      result.current({
        grouping: {
          aggregates: { age: 'sum' },
          keys: ['name'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
        settings: {
          columnFilters: {} as ColumnFiltersState<Row>,
          columnOrder: ['id', 'age', 'name'],
          columnPinning: { left: [], right: [] },
          columnSizing: {} as ColumnSizingState<Row>,
          columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(),
          sorting: [] as SortingState<Row>,
        },
        totalsPlacement: 'last',
      });
    });

    // One call, not two: a second submission on the shared persist fetcher key
    // would abort this one, so the grouping entry has to ride along with the
    // column entries rather than follow them.
    expect(mockPersistTableState).toHaveBeenCalledTimes(1);
    expect(mockPersistTableState).toHaveBeenCalledWith([
      {
        persistenceKey: 'orders-table',
        slice: 'columnOrder',
        valueSlice: ['id', 'age', 'name'],
      },
      {
        searchParamKey: 'grouping',
        searchParamValue: '{"agg":{"age":"sum"},"keys":["name"]}',
      },
    ]);
    expect(mockGroupingStore.set).toHaveBeenCalledWith({
      aggregates: { age: 'sum' },
      keys: ['name'],
      mode: 'flat',
      periods: {},
      shares: [],
    });
    expect(mockDataStore.set).toHaveBeenCalledWith({ isLoading: true });
  });

  it('adds no grouping entry when the staged grouping is the applied one', () => {
    mockGroupingStore.get.mockReturnValue({
      aggregates: {},
      keys: ['name'],
      mode: 'flat',
      periods: {},
      shares: [],
    });

    const { result } = renderHook(() => useBatchSetTableSettings<Row>());

    act(() => {
      result.current({
        grouping: {
          aggregates: {},
          keys: ['name'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
        settings: {
          columnFilters: {
            name: { operator: 'contains', type: 'text', value: 'ali' },
          } as ColumnFiltersState<Row>,
          columnOrder: ['id', 'age', 'name'],
          columnPinning: { left: [], right: [] },
          columnSizing: {} as ColumnSizingState<Row>,
          columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(),
          sorting: [
            { columnKey: 'name', direction: 'asc' },
          ] as SortingState<Row>,
        },
        totalsPlacement: 'last',
      });
    });

    expect(mockPersistTableState).toHaveBeenCalledWith([
      {
        persistenceKey: 'orders-table',
        slice: 'columnOrder',
        valueSlice: ['id', 'age', 'name'],
      },
    ]);
    expect(mockGroupingStore.set).not.toHaveBeenCalled();
    expect(mockDataStore.set).not.toHaveBeenCalled();
  });

  it('leaves the grouping store untouched when persistence refuses the write', () => {
    mockPersistTableState.mockReturnValue(false);

    const { result } = renderHook(() => useBatchSetTableSettings<Row>());

    act(() => {
      result.current({
        grouping: {
          aggregates: {},
          keys: ['name'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
        settings: {
          columnFilters: {} as ColumnFiltersState<Row>,
          columnOrder: ['id', 'age', 'name'],
          columnPinning: { left: [], right: [] },
          columnSizing: {} as ColumnSizingState<Row>,
          columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(),
          sorting: [] as SortingState<Row>,
        },
        totalsPlacement: 'last',
      });
    });

    expect(mockGroupingStore.set).not.toHaveBeenCalled();
    expect(mockColumnsStore.set).not.toHaveBeenCalled();
  });
});
