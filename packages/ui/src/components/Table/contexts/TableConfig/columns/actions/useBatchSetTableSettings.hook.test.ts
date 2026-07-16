// @vitest-environment jsdom

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '@repo/ui/components/Table/Table.types';

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBatchSetTableSettings } from './useBatchSetTableSettings.hook';

type Row = {
  readonly age: number;
  readonly id: string;
  readonly name: string;
};

const {
  mockBuildPersistencePayload,
  mockColumnsStore,
  mockDataStore,
  mockMetaStore,
  mockPersistTableMetaUiState,
  mockPersistTableState,
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
    mockMetaStore: {
      get: vi.fn(() => ({
        isTableSettingsPinned: false,
        persistenceKey: 'orders-table',
      })),
      set: vi.fn(),
    },
    mockPersistTableMetaUiState: vi.fn(),
    mockPersistTableState: vi.fn(),
    mockResolveBatchTableSettingsUpdate: vi.fn(() => ({
      columnFilters: {
        name: { operator: 'contains', type: 'text', value: 'ali' },
      },
      columnGroups: {
        centerCols: [{ key: 'age', label: 'Age' }],
        leftPinnedCols: [{ key: 'id', label: 'ID' }],
        rightPinnedCols: [{ key: 'name', label: 'Name' }],
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
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    })),
  };
});

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({
      columnsStore: mockColumnsStore,
      metaStore: mockMetaStore,
    }),
  }),
);

vi.mock(
  '@repo/ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook',
  () => ({
    useTableDataContextValue: () => ({ dataStore: mockDataStore }),
  }),
);

vi.mock('./hooks/usePersistTableStateAction.hook', () => ({
  usePersistTableStateAction: () => mockPersistTableState,
}));

vi.mock('@repo/ui/components/Table/utils', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@repo/ui/components/Table/utils')>();

  return {
    ...actual,
    persistTableMetaUiState: mockPersistTableMetaUiState,
  };
});

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
    mockMetaStore.get.mockClear();
    mockMetaStore.set.mockClear();
    mockPersistTableMetaUiState.mockClear();
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
      result.current(settings);
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
    expect(mockPersistTableMetaUiState).toHaveBeenCalledWith({
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
        sorting: [{ columnKey: 'name', direction: 'asc' }] as SortingState<Row>,
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
      });
    });

    expect(mockColumnsStore.set).toHaveBeenCalledTimes(1);
    expect(mockMetaStore.set).not.toHaveBeenCalledWith({
      isTableSettingsOpen: false,
    });
  });
});
