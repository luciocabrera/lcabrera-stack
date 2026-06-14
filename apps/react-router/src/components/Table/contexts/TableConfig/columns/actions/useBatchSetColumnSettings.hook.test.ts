// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBatchSetColumnSettings } from './useBatchSetColumnSettings.hook';

const {
  mockBuildPersistencePayload,
  mockColumnsStore,
  mockDeriveColumnViewState,
  mockGetNewColumnFiltersBasedOnColumnKey,
  mockGetNewColumnSizingBasedOnColumnKey,
  mockGetNewPinningBasedOnColumnKey,
  mockGetNewSortingBasedOnColumnKey,
  mockMetaStore,
  mockPersistTableState,
  mockSyncColumnOrderWithPinning,
  setColumnsState,
} = vi.hoisted(() => {
  let columnsState = {
    columnFilters: {},
    columnOrder: ['id', 'name', 'age'],
    columnPinning: { left: ['id'], right: [] },
    columnSizing: { actions: 0, age: 80, id: 100, name: 140 },
    columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(['age']),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'age', label: 'Age' },
    ],
    sorting: [],
    staticKeys: new Set<string>(['id']),
  };

  return {
    mockBuildPersistencePayload: vi.fn(() => [
      { persistenceKey: 'orders-table', slice: 'sorting', valueSlice: [] },
    ]),
    mockColumnsStore: {
      get: vi.fn(() => columnsState),
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
          sortDirection: 'desc',
          sortIndex: 0,
        },
      },
      pinnedColumnOffsets: {
        name: {
          isFirstPinnedRight: true,
          isLastPinnedLeft: false,
          offset: 0,
          side: 'right',
        },
      },
    })),
    mockGetNewColumnFiltersBasedOnColumnKey: vi.fn(() => ({
      name: { operator: 'contains', type: 'text', value: 'ali' },
    })),
    mockGetNewColumnSizingBasedOnColumnKey: vi.fn(() => ({
      actions: 0,
      age: 80,
      id: 100,
      name: 220,
    })),
    mockGetNewPinningBasedOnColumnKey: vi.fn(() => ({
      left: ['id'],
      right: ['name'],
    })),
    mockGetNewSortingBasedOnColumnKey: vi.fn(() => [
      { columnKey: 'name', direction: 'desc' },
    ]),
    mockMetaStore: {
      get: vi.fn(() => ({ persistenceKey: 'orders-table' })),
      set: vi.fn(),
    },
    mockPersistTableState: vi.fn(),
    mockSyncColumnOrderWithPinning: vi.fn(() => ['id', 'age', 'name']),
    setColumnsState: (nextState: typeof columnsState) => {
      columnsState = nextState;
    },
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

vi.mock('@/components/Table/hooks', () => ({
  usePersistTableStateAction: () => mockPersistTableState,
}));

vi.mock('@/components/Table/utils', () => ({
  deriveColumnViewState: mockDeriveColumnViewState,
  syncColumnOrderWithPinning: mockSyncColumnOrderWithPinning,
}));

vi.mock('@/components/Table/utils/getNewSortingBasedOnColumnKey.util', () => ({
  getNewSortingBasedOnColumnKey: mockGetNewSortingBasedOnColumnKey,
}));

vi.mock(
  '@/components/Table/utils/getNewColumnFiltersBasedOnColumnKey.util',
  () => ({
    getNewColumnFiltersBasedOnColumnKey:
      mockGetNewColumnFiltersBasedOnColumnKey,
  }),
);

vi.mock(
  '@/components/Table/utils/getNewColumnSizingBasedOnColumnKey.util',
  () => ({
    getNewColumnSizingBasedOnColumnKey: mockGetNewColumnSizingBasedOnColumnKey,
  }),
);

vi.mock('@/components/Table/utils/getNewPinningBasedOnColumnKey.util', () => ({
  getNewPinningBasedOnColumnKey: mockGetNewPinningBasedOnColumnKey,
}));

vi.mock('./buildPersistencePayload.util', () => ({
  buildPersistencePayload: mockBuildPersistencePayload,
}));

describe('useBatchSetColumnSettings', () => {
  beforeEach(() => {
    setColumnsState({
      columnFilters: {},
      columnOrder: ['id', 'name', 'age'],
      columnPinning: { left: ['id'], right: [] },
      columnSizing: { actions: 0, age: 80, id: 100, name: 140 },
      columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(['age']),
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      sorting: [],
      staticKeys: new Set<string>(['id']),
    });
    mockBuildPersistencePayload.mockClear();
    mockColumnsStore.get.mockClear();
    mockColumnsStore.set.mockClear();
    mockDeriveColumnViewState.mockClear();
    mockGetNewColumnFiltersBasedOnColumnKey.mockClear();
    mockGetNewColumnSizingBasedOnColumnKey.mockClear();
    mockGetNewPinningBasedOnColumnKey.mockClear();
    mockGetNewSortingBasedOnColumnKey.mockClear();
    mockMetaStore.get.mockClear();
    mockMetaStore.set.mockClear();
    mockPersistTableState.mockClear();
    mockSyncColumnOrderWithPinning.mockClear();
  });

  it('orchestrates the extracted utilities and commits the merged state', () => {
    const { result } = renderHook(() =>
      useBatchSetColumnSettings<{
        readonly age: number;
        readonly id: string;
        readonly name: string;
      }>(),
    );

    act(() => {
      result.current({
        columnFilter: { operator: 'contains', type: 'text', value: 'ali' },
        columnKey: 'name',
        columnPinning: 'right',
        columnSizing: 220,
        sorting: 'desc',
      });
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
      sorting: [{ columnKey: 'name', direction: 'desc' }],
    });
    expect(mockBuildPersistencePayload).toHaveBeenCalledWith({
      columnFilters: {
        name: { operator: 'contains', type: 'text', value: 'ali' },
      },
      columnOrder: ['id', 'age', 'name'],
      columnPinning: { left: ['id'], right: ['name'] },
      columnSizing: { actions: 0, age: 80, id: 100, name: 220 },
      persistenceKey: 'orders-table',
      sorting: [{ columnKey: 'name', direction: 'desc' }],
    });
    expect(mockPersistTableState).toHaveBeenCalledWith([
      { persistenceKey: 'orders-table', slice: 'sorting', valueSlice: [] },
    ]);
    expect(mockColumnsStore.set).toHaveBeenCalledWith({
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
      columnSizing: { actions: 0, age: 80, id: 100, name: 220 },
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
          sortDirection: 'desc',
          sortIndex: 0,
        },
      },
      pinnedColumnOffsets: {
        name: {
          isFirstPinnedRight: true,
          isLastPinnedLeft: false,
          offset: 0,
          side: 'right',
        },
      },
      sorting: [{ columnKey: 'name', direction: 'desc' }],
    });
    expect(mockMetaStore.set).toHaveBeenCalledWith({
      isColumnSettingsOpen: false,
    });
  });
});
