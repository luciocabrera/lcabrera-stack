// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBatchSetColumnSettings } from './useBatchSetColumnSettings.hook';

const {
  mockBuildPersistencePayload,
  mockColumnsStore,
  mockDataStore,
  mockMetaStore,
  mockPersistTableState,
  mockResolveBatchColumnSettingsUpdate,
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
    mockDataStore: {
      set: vi.fn(),
    },
    mockResolveBatchColumnSettingsUpdate: vi.fn(() => ({
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
    })),
    mockMetaStore: {
      get: vi.fn(() => ({
        isColumnSettingsPinned: false,
        isTableSettingsOpen: false,
        persistenceKey: 'orders-table',
        wasTableSettingsOpenBeforeColumnSettings: false,
      })),
      set: vi.fn(),
    },
    mockPersistTableState: vi.fn(),
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

vi.mock(
  '@/components/Table/contexts/TableData/data/useTableDataContextValue.hook',
  () => ({
    useTableDataContextValue: () => ({ dataStore: mockDataStore }),
  }),
);

vi.mock('@/components/Table/hooks', () => ({
  usePersistTableStateAction: () => mockPersistTableState,
}));

vi.mock('./utils/buildPersistencePayload.util', () => ({
  buildPersistencePayload: mockBuildPersistencePayload,
}));

vi.mock('./utils/resolveBatchColumnSettingsUpdate.util', () => ({
  resolveBatchColumnSettingsUpdate: mockResolveBatchColumnSettingsUpdate,
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
    mockDataStore.set.mockClear();
    mockMetaStore.get.mockClear();
    mockMetaStore.set.mockClear();
    mockPersistTableState.mockClear();
    mockPersistTableState.mockReturnValue(true);
    mockResolveBatchColumnSettingsUpdate.mockClear();
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

    expect(mockDataStore.set).toHaveBeenCalledWith({
      isLoading: true,
    });
    expect(mockColumnsStore.get).toHaveBeenCalledTimes(1);
    expect(mockResolveBatchColumnSettingsUpdate).toHaveBeenCalledWith({
      columnsState: {
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
      },
      settings: {
        columnFilter: { operator: 'contains', type: 'text', value: 'ali' },
        columnKey: 'name',
        columnPinning: 'right',
        columnSizing: 220,
        sorting: 'desc',
      },
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
    expect(mockColumnsStore.set).toHaveBeenCalledWith(
      mockResolveBatchColumnSettingsUpdate.mock.results[0]?.value,
    );
    expect(mockMetaStore.set).toHaveBeenCalledWith({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: false,
    });
  });

  it('restores table settings visibility when column drawer closes after hijacking it', () => {
    mockMetaStore.get.mockReturnValue({
      isColumnSettingsPinned: false,
      isTableSettingsOpen: false,
      persistenceKey: 'orders-table',
      wasTableSettingsOpenBeforeColumnSettings: true,
    });

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

    expect(mockMetaStore.set).toHaveBeenCalledWith({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: true,
      wasTableSettingsOpenBeforeColumnSettings: false,
    });
  });

  it('keeps column settings drawer open after accept when drawer is pinned', () => {
    mockMetaStore.get.mockReturnValue({
      isColumnSettingsPinned: true,
      isTableSettingsOpen: false,
      persistenceKey: 'orders-table',
      wasTableSettingsOpenBeforeColumnSettings: true,
    });

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

    expect(mockMetaStore.set).toHaveBeenCalledWith({
      isColumnSettingsOpen: true,
    });
  });

  it('does not set isLoading when only UI-only changes occur (column width, pinning)', () => {
    // Mock resolved update with same filters/sorting (UI-only changes)
    mockResolveBatchColumnSettingsUpdate.mockReturnValue({
      columnFilters: {}, // Same as current state (empty)
      columnGroups: {
        centerCols: [{ key: 'age', label: 'Age' }],
        leftPinnedCols: [{ key: 'id', label: 'ID' }],
        rightPinnedCols: [{ key: 'name', label: 'Name' }],
      },
      columnOrder: ['id', 'age', 'name'], // Changed order
      columnPinning: { left: ['id'], right: ['name'] }, // Changed pinning
      columnSizing: { actions: 0, age: 80, id: 100, name: 220 }, // Changed size
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
        name: {
          isFirstPinnedRight: true,
          isLastPinnedLeft: false,
          offset: 0,
          side: 'right',
        },
      },
      sorting: [], // Same as current state (empty)
    } as any);

    const { result } = renderHook(() =>
      useBatchSetColumnSettings<{
        readonly age: number;
        readonly id: string;
        readonly name: string;
      }>(),
    );

    act(() => {
      result.current({
        columnKey: 'name',
        columnPinning: 'right',
        columnSizing: 220,
      });
    });

    // isLoading should NOT be set when only UI changes occur
    expect(mockDataStore.set).not.toHaveBeenCalled();
    expect(mockPersistTableState).toHaveBeenCalledTimes(1);
    expect(mockColumnsStore.set).toHaveBeenCalledWith(
      mockResolveBatchColumnSettingsUpdate.mock.results[0]?.value,
    );
  });

  it('sets isLoading when query-affecting changes occur (filters or sorting)', () => {
    // Mock resolved update with different sorting (query-affecting change)
    mockResolveBatchColumnSettingsUpdate.mockReturnValue({
      columnFilters: {}, // Same as current state
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
      sorting: [{ columnKey: 'name', direction: 'desc' }], // Different from current state (was empty)
    } as any);

    const { result } = renderHook(() =>
      useBatchSetColumnSettings<{
        readonly age: number;
        readonly id: string;
        readonly name: string;
      }>(),
    );

    act(() => {
      result.current({
        columnKey: 'name',
        sorting: 'desc',
      });
    });

    // isLoading SHOULD be set when query-affecting changes occur
    expect(mockDataStore.set).toHaveBeenCalledWith({
      isLoading: true,
    });
  });
});
