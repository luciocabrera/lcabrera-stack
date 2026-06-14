// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '@/components/Table/Table.types';

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
  mockDeriveColumnViewState,
  mockMetaStore,
  mockPersistTableState,
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
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'age', label: 'Age' },
        ],
      })),
      set: vi.fn(),
    },
    mockDataStore: {
      set: vi.fn(),
    },
    mockDeriveColumnViewState: vi.fn(() => ({
      columnGroups: {
        centerCols: [{ key: 'age', label: 'Age' }],
        leftPinnedCols: [{ key: 'id', label: 'ID' }],
        rightPinnedCols: [{ key: 'name', label: 'Name' }],
      },
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
    })),
    mockMetaStore: {
      get: vi.fn(() => ({ persistenceKey: 'orders-table' })),
      set: vi.fn(),
    },
    mockPersistTableState: vi.fn(),
  };
});

vi.mock(
  '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({
      columnsStore: mockColumnsStore,
      metaStore: mockMetaStore,
    }),
  }),
);

vi.mock(
  '@/components/Table/contexts/TableData/data/useTableDataContextValue.hook',
  () => ({
    useTableDataContextValue: () => ({ dataStore: mockDataStore }),
  }),
);

vi.mock('@/components/Table/hooks', () => ({
  usePersistTableStateAction: () => mockPersistTableState,
}));

vi.mock('@/components/Table/utils', () => ({
  deriveColumnViewState: mockDeriveColumnViewState,
}));

vi.mock('./utils/buildPersistencePayload.util', () => ({
  buildPersistencePayload: mockBuildPersistencePayload,
}));

describe('useBatchSetTableSettings', () => {
  beforeEach(() => {
    mockBuildPersistencePayload.mockClear();
    mockColumnsStore.get.mockClear();
    mockColumnsStore.set.mockClear();
    mockDataStore.set.mockClear();
    mockDeriveColumnViewState.mockClear();
    mockMetaStore.get.mockClear();
    mockMetaStore.set.mockClear();
    mockPersistTableState.mockClear();
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
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    };

    act(() => {
      result.current(settings);
    });

    expect(mockDataStore.set).toHaveBeenNthCalledWith(1, {
      isLoadingMore: true,
    });
    expect(mockColumnsStore.get).toHaveBeenCalledTimes(1);
    expect(mockDeriveColumnViewState).toHaveBeenCalledWith({
      columnOrder: ['id', 'age', 'name'],
      columnPinning: { left: ['id'], right: ['name'] },
      columnSizing: { actions: 0, age: 80, id: 100, name: 220 },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(['age']),
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    });
    expect(mockBuildPersistencePayload).toHaveBeenCalledWith({
      columnFilters: {
        name: { operator: 'contains', type: 'text', value: 'ali' },
      },
      columnOrder: ['id', 'age', 'name'],
      columnPinning: { left: ['id'], right: ['name'] },
      columnSizing: { actions: 0, age: 80, id: 100, name: 220 },
      columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(['age']),
      persistenceKey: 'orders-table',
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    });
    expect(mockPersistTableState).toHaveBeenCalledWith([
      {
        persistenceKey: 'orders-table',
        slice: 'columnOrder',
        valueSlice: ['id', 'age', 'name'],
      },
    ]);
    expect(mockColumnsStore.set).toHaveBeenCalledWith({
      ...settings,
      columnGroups: {
        centerCols: [{ key: 'age', label: 'Age' }],
        leftPinnedCols: [{ key: 'id', label: 'ID' }],
        rightPinnedCols: [{ key: 'name', label: 'Name' }],
      },
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
    });
    expect(mockMetaStore.set).toHaveBeenCalledWith({
      isTableSettingsOpen: false,
    });
    expect(mockDataStore.set).toHaveBeenNthCalledWith(2, {
      isLoadingMore: false,
    });
  });
});
