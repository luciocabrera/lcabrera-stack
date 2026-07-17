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

/**
 * Builds the `columnsState` a `TableLayout`/`StaticTable` needs when there
 * is no persisted sort/filter/pin state to seed it with (no
 * `readTableLoaderStateFromRequest` call) — every stateful field starts at
 * its genuinely empty default. `columnFilters`/`columnSizing` are `Record`
 * types keyed by every column, which TypeScript can't verify `{}` satisfies
 * for a generic `TData` — the cast here is the one place that's accepted,
 * rather than repeating it at every call site.
 */
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
