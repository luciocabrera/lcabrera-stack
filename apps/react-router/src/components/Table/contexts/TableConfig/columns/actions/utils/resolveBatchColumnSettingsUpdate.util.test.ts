import type {
  ColumnFiltersState,
  TableColumnsState,
} from '@/components/Table/Table.types';

import { describe, expect, it, vi } from 'vitest';

import { resolveBatchColumnSettingsUpdate } from './resolveBatchColumnSettingsUpdate.util';

const {
  mockDeriveColumnViewState,
  mockGetNewColumnFiltersBasedOnColumnKey,
  mockGetNewColumnSizingBasedOnColumnKey,
  mockGetNewPinningBasedOnColumnKey,
  mockGetNewSortingBasedOnColumnKey,
  mockSyncColumnOrderWithPinning,
} = vi.hoisted(() => ({
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
  mockSyncColumnOrderWithPinning: vi.fn(() => ['id', 'age', 'name']),
}));

vi.mock('@/components/Table/utils', () => ({
  deriveColumnViewState: mockDeriveColumnViewState,
  syncColumnOrderWithPinning: mockSyncColumnOrderWithPinning,
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

vi.mock('@/components/Table/utils/getNewSortingBasedOnColumnKey.util', () => ({
  getNewSortingBasedOnColumnKey: mockGetNewSortingBasedOnColumnKey,
}));

describe('resolveBatchColumnSettingsUpdate', () => {
  it('combines per-column resolvers into the next table config slices', () => {
    const columnsState: Partial<
      TableColumnsState<{
        readonly age: number;
        readonly id: string;
        readonly name: string;
      }>
    > = {
      columnFilters: {} as ColumnFiltersState<{
        readonly age: number;
        readonly id: string;
        readonly name: string;
      }>,
      columnOrder: ['id', 'name', 'age'],
      columnPinning: { left: ['id'], right: [] },
      columnSizing: { actions: 0, age: 80, id: 100, name: 140 },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      sorting: [],
      staticKeys: new Set<string>(['id']),
    };

    const result = resolveBatchColumnSettingsUpdate<{
      readonly age: number;
      readonly id: string;
      readonly name: string;
    }>({
      columnsState,
      settings: {
        columnFilter: { operator: 'contains', type: 'text', value: 'ali' },
        columnKey: 'name',
        columnPinning: 'right',
        columnSizing: 220,
        sorting: 'desc',
      },
    });

    expect(mockGetNewSortingBasedOnColumnKey).toHaveBeenCalledWith({
      columnKey: 'name',
      existingSorting: [],
      sorting: 'desc',
    });
    expect(mockGetNewColumnFiltersBasedOnColumnKey).toHaveBeenCalledWith({
      columnFiltersState: {},
      columnFilter: { operator: 'contains', type: 'text', value: 'ali' },
      columnKey: 'name',
    });
    expect(mockGetNewColumnSizingBasedOnColumnKey).toHaveBeenCalledWith({
      columnKey: 'name',
      columnSizesState: { actions: 0, age: 80, id: 100, name: 140 },
      columnSizing: 220,
    });
    expect(mockGetNewPinningBasedOnColumnKey).toHaveBeenCalledWith({
      columnKey: 'name',
      columnPinning: 'right',
      existingPinning: { left: ['id'], right: [] },
      staticKeys: new Set<string>(['id']),
    });
    expect(mockSyncColumnOrderWithPinning).toHaveBeenCalledWith({
      columnKey: 'name',
      columnPinning: 'right',
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      currentOrder: ['id', 'name', 'age'],
      newPinning: { left: ['id'], right: ['name'] },
    });
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

    expect(result).toEqual({
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
  });
});
