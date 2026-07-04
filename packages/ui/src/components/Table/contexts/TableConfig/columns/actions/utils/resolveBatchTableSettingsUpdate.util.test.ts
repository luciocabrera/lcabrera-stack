import { describe, expect, it, vi } from 'vitest';

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '@repo/ui/components/Table/Table.types';

import { resolveBatchTableSettingsUpdate } from './resolveBatchTableSettingsUpdate.util';

type Row = {
  readonly age: number;
  readonly id: string;
  readonly name: string;
};

const { mockDeriveColumnViewState } = vi.hoisted(() => ({
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
}));

vi.mock('@repo/ui/components/Table/utils', () => ({
  deriveColumnViewState: mockDeriveColumnViewState,
}));

describe('resolveBatchTableSettingsUpdate', () => {
  it('combines table-wide settings with derived column view slices', () => {
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

    const result = resolveBatchTableSettingsUpdate<Row>({
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      settings,
    });

    expect(mockDeriveColumnViewState).toHaveBeenCalledWith({
      columnOrder: ['id', 'age', 'name'],
      columnPinning: { left: ['id'], right: ['name'] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      columnSizing: { actions: 0, age: 80, id: 100, name: 220 },
      columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(['age']),
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    });

    expect(result).toEqual({
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
  });
});
