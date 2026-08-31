import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  DataKey,
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';

import { getEffectiveColumns } from './getEffectiveColumns.util';
import { getPinnedColumnOffsets } from './getPinnedColumnOffsets.util';
import { splitColumnsByPinning } from './splitColumnsByPinning.util';
import { withAggregateColumnOrder } from './withAggregateColumnOrder.util';
import { withAggregateColumns } from './withAggregateColumns.util';
import { withGroupedColumnLayout } from './withGroupedColumnLayout.util';
import { withGroupedColumnScope } from './withGroupedColumnScope.util';

type GetPinnedDerivedColumnsStateArgs<TData> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  readonly groupingKeys: readonly string[];
};

export const getPinnedDerivedColumnsState = <TData>({
  aggregates,
  columnOrder,
  columnPinning,
  columns,
  columnSizing,
  columnVisibility = new Set<DataKey<TData>>(),
  groupingKeys,
}: GetPinnedDerivedColumnsStateArgs<TData>) => {
  const measured = withAggregateColumns<TData>({
    aggregates,
    columnOrder,
    columnPinning,
    columns,
    columnVisibility,
    groupingKeys,
  });

  const scoped = withGroupedColumnScope<TData>({
    aggregates,
    columnOrder: measured.columnOrder,
    columnPinning: measured.columnPinning,
    columns: measured.columns,
    columnVisibility: measured.columnVisibility,
    groupingKeys,
  });

  const staged = withAggregateColumnOrder<TData>({
    aggregates,
    columnOrder: scoped.columnOrder,
    columnPinning: scoped.columnPinning,
    columns: scoped.columns,
    columnVisibility: scoped.columnVisibility,
    groupingKeys,
  });

  const {
    columnOrder: gridColumnOrder,
    columnPinning: gridColumnPinning,
    columns: gridColumns,
    columnVisibility: gridColumnVisibility,
  } = withGroupedColumnLayout<TData>({
    columnOrder: staged.columnOrder,
    columnPinning: staged.columnPinning,
    columns: staged.columns,
    columnVisibility: staged.columnVisibility,
    groupingKeys,
  });

  const effectiveColumns = getEffectiveColumns<TData>({
    columnOrder: gridColumnOrder,
    columnPinning: gridColumnPinning,
    columns: gridColumns,
    columnVisibility: gridColumnVisibility,
  });

  const pinnedColumnPartition = splitColumnsByPinning<TData>({
    columnPinning: gridColumnPinning,
    effectiveColumns,
  });

  const pinnedColumnOffsets = getPinnedColumnOffsets<TData>({
    columnPinning: gridColumnPinning,
    columnSizing: columnSizing ?? ({} as ColumnSizingState<TData>),
    effectiveColumns,
  });

  return {
    effectiveColumns,
    gridColumns,
    pinnedColumnOffsets,
    pinnedColumnPartition,
  };
};
