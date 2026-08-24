import type {
  ColumnFiltersState,
  ColumnSizingState,
  TableColumn,
  TableColumnsState,
} from '../Table.types';

type CreateEmptyColumnsStateArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
};

type EmptyColumnsState<TData extends Record<string, unknown>> = Omit<
  TableColumnsState<TData>,
  | 'effectiveColumns'
  | 'normalizedColumns'
  | 'pinnedColumnOffsets'
  | 'pinnedColumnPartition'
  | 'staticKeys'
>;

export const createEmptyColumnsState = <TData extends Record<string, unknown>>({
  columns,
}: CreateEmptyColumnsStateArgs<TData>): EmptyColumnsState<TData> => ({
  columnFilters: {} as ColumnFiltersState<TData>,
  columnOrder: [],
  columnPinning: { left: [], right: [] },
  columns: [...columns],
  columnSizing: {} as ColumnSizingState<TData>,
  columnVisibility: new Set(),
  sorting: [],
});
