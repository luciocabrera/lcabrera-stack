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

type GetPinnedDerivedColumnsStateArgs<TData> = {
  /**
   * The applied aggregates. **Required** for the reason `groupingKeys` is: a
   * caller free to omit it would silently paint the source column instead of
   * its measures on the next column change.
   */
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  /**
   * The applied group keys. **Required**, so every re-derivation is a compile
   * error until it says what grouping is applied — a caller free to omit it
   * would silently drop the key hoist on the next column change.
   */
  readonly groupingKeys: readonly string[];
};

/**
 * Every column slice the body and header paint from, derived together so they
 * cannot disagree about which columns exist.
 *
 * The grouped layout is derived here, at the one point all the slices are
 * computed from (ADR-080): the group keys are hoisted to the head of the order
 * and the left pin, and forced visible.
 *
 * **Two derivations, in an order that matters.** `withAggregateColumns` runs
 * first and replaces each measured column with one column per aggregate applied
 * to it, so the hoist that follows sees the final column list. They cannot
 * conflict — an aggregate naming a group key is dropped by the first, because
 * that column already carries its key's value — but running the hoist first
 * would leave the second rewriting a list the slices were already derived from.
 *
 * `gridColumns` is therefore the consumer's list **with its measured columns
 * expanded**, and comes back beside the slices because the normalized-column
 * map has to be built from the same list the header reads its labels out of.
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
    groupingKeys,
  });

  const {
    columnOrder: gridColumnOrder,
    columnPinning: gridColumnPinning,
    columns: gridColumns,
    columnVisibility: gridColumnVisibility,
  } = withGroupedColumnLayout<TData>({
    columnOrder: measured.columnOrder,
    columnPinning: measured.columnPinning,
    columns: measured.columns,
    columnVisibility,
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
