import type {
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  DataKey,
  TableColumnsState,
  TableCrudConfig,
} from '@repo/ui/components/Table/Table.types';

import { ACTIONS_COLUMN_KEY } from '@repo/ui/components/Table/Table.constants';
import {
  deriveColumnViewState,
  resolveTableActionsColumn,
} from '@repo/ui/components/Table/utils';

type GetInitialTableStateArgs<TData extends Record<string, unknown>> = Partial<
  TableColumnsState<TData>
> & {
  readonly crud?: TableCrudConfig;
};

/**
 * Builds the columns store's initial state from what the loader read out of the
 * cookie. That is the only source: the server renders from it, so anything the
 * client preferred over it (sessionStorage, which SSR cannot see) could only
 * contradict the markup already painted and shift the columns at hydration.
 */
export const getInitialColumnsState = <TData extends Record<string, unknown>>({
  columnFilters = {} as ColumnFiltersState<TData>,
  columnOrder = [],
  columnPinning = { left: [], right: [] },
  columns = [],
  columnSizing = {} as ColumnSizingState<TData>,
  columnVisibility = new Set<DataKey<TData>>(),
  crud,
  sorting = [],
}: GetInitialTableStateArgs<TData>) => {
  const { columns: resolvedColumns, hasActionsColumn } =
    resolveTableActionsColumn<TData>({ columns, crud });

  // Persisted pinning state can arrive partial (e.g. `{}` on a cookie miss),
  // so treat both sides as optional and normalize to empty arrays.
  const rawColumnPinning: Partial<ColumnPinningState<TData>> = columnPinning;
  const pinnedLeft = (rawColumnPinning.left ?? []).filter(
    (columnKey) => columnKey !== ACTIONS_COLUMN_KEY,
  );
  const pinnedRight = (rawColumnPinning.right ?? []).filter(
    (columnKey) => columnKey !== ACTIONS_COLUMN_KEY,
  );

  const nextColumnPinning = {
    left: pinnedLeft,
    right: hasActionsColumn
      ? [...pinnedRight, ACTIONS_COLUMN_KEY]
      : pinnedRight,
  } as ColumnPinningState<TData>;
  const nextColumnOrder = columnOrder;
  const nextColumnSizing = columnSizing;
  const nextColumnVisibility = columnVisibility;

  const {
    columnGroups,
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
    staticKeys,
  } = deriveColumnViewState<TData>({
    columnOrder: nextColumnOrder,
    columnPinning: nextColumnPinning,
    columns: resolvedColumns,
    columnSizing: nextColumnSizing,
    columnVisibility: nextColumnVisibility,
    sorting,
  });

  return {
    columnFilters,
    columnGroups,
    columnOrder: nextColumnOrder,
    columnPinning: nextColumnPinning,
    columns: resolvedColumns,
    columnSizing: nextColumnSizing,
    columnVisibility: nextColumnVisibility,
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
    sorting,
    staticKeys,
  };
};
