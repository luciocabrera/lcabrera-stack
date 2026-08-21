import { describe, expect, it, vi } from 'vite-plus/test';

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
} from '#ui/components/Table/Table.types';

import { resolveBatchTableSettingsUpdate } from './resolveBatchTableSettingsUpdate.util';

type Row = {
  readonly age: number;
  readonly id: string;
  readonly name: string;
};

const { mockDeriveColumnViewState } = vi.hoisted(() => ({
  mockDeriveColumnViewState: vi.fn(() => ({
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
  })),
}));

vi.mock('#ui/components/Table/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#ui/components/Table/utils')>()),
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
      aggregates: [],
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      groupingKeys: ['age'],
      settings,
    });

    expect(mockDeriveColumnViewState).toHaveBeenCalledWith({
      // Forwarded, not derived: the Accept that commits a grouping change is
      // the one that has to bring the hierarchy column with it.
      aggregates: [],
      columnOrder: ['id', 'age', 'name'],
      columnPinning: { left: ['id'], right: ['name'] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      columnSizing: { actions: 0, age: 80, id: 100, name: 220 },
      columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(['age']),
      groupingKeys: ['age'],
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    });

    expect(result).toEqual({
      ...settings,
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
    });
  });

  it('keeps the sort of a column this Accept only hid', () => {
    // The discriminating case, and the one a defect here passes silently:
    // `effectiveColumns` is visibility-filtered while `normalizedColumns` is
    // the painted list. Pruning against the former drops the sort of a column
    // the user merely hid — a view preference, with the column still there to
    // order by. The two lists must therefore DIFFER for this to test anything,
    // which is why the mock is overridden rather than reused.
    mockDeriveColumnViewState.mockReturnValueOnce({
      // `name` is hidden, so it is absent here...
      effectiveColumns: [{ key: 'id', label: 'ID' }],
      // ...and present here, because the grid still has the column.
      normalizedColumns: {
        id: { key: 'id', label: 'ID' },
        name: { key: 'name', label: 'Name' },
      },
      pinnedColumnOffsets: {},
      pinnedColumnPartition: {
        centerCols: [],
        leftPinnedCols: [],
        rightPinnedCols: [],
      },
    } as unknown as ReturnType<typeof mockDeriveColumnViewState>);

    const result = resolveBatchTableSettingsUpdate<Row>({
      aggregates: [],
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
      groupingKeys: [],
      settings: {
        columnFilters: {} as ColumnFiltersState<Row>,
        columnOrder: ['id', 'name'],
        columnPinning: { left: [], right: [] },
        columnSizing: {} as ColumnSizingState<Row>,
        columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(['name']),
        sorting: [{ columnKey: 'name', direction: 'asc' }] as SortingState<Row>,
      },
    });

    expect(result.sorting).toStrictEqual([
      { columnKey: 'name', direction: 'asc' },
    ]);
  });

  it('drops the sort of a column the grid no longer has at all', () => {
    // The other half, so the case above cannot pass by simply never pruning.
    mockDeriveColumnViewState.mockReturnValueOnce({
      effectiveColumns: [{ key: 'id', label: 'ID' }],
      normalizedColumns: { id: { key: 'id', label: 'ID' } },
      pinnedColumnOffsets: {},
      pinnedColumnPartition: {
        centerCols: [],
        leftPinnedCols: [],
        rightPinnedCols: [],
      },
    } as unknown as ReturnType<typeof mockDeriveColumnViewState>);

    const result = resolveBatchTableSettingsUpdate<Row>({
      aggregates: [],
      columns: [{ key: 'id', label: 'ID' }],
      groupingKeys: [],
      settings: {
        columnFilters: {} as ColumnFiltersState<Row>,
        columnOrder: ['id'],
        columnPinning: { left: [], right: [] },
        columnSizing: {} as ColumnSizingState<Row>,
        columnVisibility: new Set<'actions' | 'age' | 'id' | 'name'>(),
        sorting: [
          { columnKey: 'total_amount:avg', direction: 'desc' },
        ] as unknown as SortingState<Row>,
      },
    });

    expect(result.sorting).toStrictEqual([]);
  });
});
