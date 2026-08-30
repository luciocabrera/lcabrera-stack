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
import { withAggregateColumns } from './withAggregateColumns.util';
import { withGroupedColumnLayout } from './withGroupedColumnLayout.util';
import { withGroupedColumnScope } from './withGroupedColumnScope.util';

type GetPinnedDerivedColumnsStateArgs<TData> = {
  /**
   * **Required** for the reason `groupingKeys` is: a caller free to omit it would silently
   * paint the source column instead of its measures on the next column change.
   */
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  /**
   * **Required**, so every re-derivation is a compile error until it says what grouping is
   * applied — a caller free to omit it would silently drop the key hoist on the next column
   * change.
   */
  readonly groupingKeys: readonly string[];
};

/**
 * Every column slice the body and header paint from, derived together so they cannot
 * disagree about which columns exist.
 */
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

  const {
    columnOrder: gridColumnOrder,
    columnPinning: gridColumnPinning,
    columns: gridColumns,
    columnVisibility: gridColumnVisibility,
  } = withGroupedColumnLayout<TData>({
    columnOrder: scoped.columnOrder,
    columnPinning: scoped.columnPinning,
    columns: scoped.columns,
    columnVisibility: scoped.columnVisibility,
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
