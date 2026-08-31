import type {
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  DataKey,
  TableColumnAggregate,
  TableColumnsState,
  TableCrudConfig,
} from '#ui/components/Table/Table.types';

import { ACTIONS_COLUMN_KEY } from '#ui/components/Table/Table.constants';
import {
  deriveColumnViewState,
  resolveTableActionsColumn,
} from '#ui/components/Table/utils';

type GetInitialTableStateArgs<TData extends Record<string, unknown>> = Partial<
  TableColumnsState<TData>
> & {
  readonly aggregates?: readonly TableColumnAggregate[];
  readonly crud?: TableCrudConfig;
  readonly groupingKeys?: readonly string[];
};

export const getInitialColumnsState = <TData extends Record<string, unknown>>({
  aggregates = [],
  columnFilters = {} as ColumnFiltersState<TData>,
  columnOrder = [],
  columnPinning = { left: [], right: [] },
  columns = [],
  columnSizing = {} as ColumnSizingState<TData>,
  columnVisibility = new Set<DataKey<TData>>(),
  crud,
  groupingKeys = [],
  sorting = [],
}: GetInitialTableStateArgs<TData>) => {
  const { columns: resolvedColumns, hasActionsColumn } =
    resolveTableActionsColumn<TData>({ columns, crud });

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
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
    pinnedColumnPartition,
    staticKeys,
  } = deriveColumnViewState<TData>({
    aggregates,
    columnOrder: nextColumnOrder,
    columnPinning: nextColumnPinning,
    columns: resolvedColumns,
    columnSizing: nextColumnSizing,
    columnVisibility: nextColumnVisibility,
    groupingKeys,
    sorting,
  });

  return {
    columnFilters,
    columnOrder: nextColumnOrder,
    columnPinning: nextColumnPinning,
    columns: resolvedColumns,
    columnSizing: nextColumnSizing,
    columnVisibility: nextColumnVisibility,
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
    pinnedColumnPartition,
    sorting,
    staticKeys,
  };
};
