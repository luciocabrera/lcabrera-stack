import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  DataKey,
  TableColumn,
} from '#ui/components/Table/Table.types';

import { getEffectiveColumns } from './getEffectiveColumns.util';
import { getPinnedColumnOffsets } from './getPinnedColumnOffsets.util';
import { splitColumnsByPinning } from './splitColumnsByPinning.util';
import { withGroupedColumnLayout } from './withGroupedColumnLayout.util';

type GetPinnedDerivedColumnsStateArgs<TData> = {
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
 * and the left pin, and forced visible. No column is added — a group row states
 * each key's value in that key's own column — so `gridColumns` is the
 * consumer's own list, and comes back beside the slices because the
 * normalized-column map has to be built from the same list the header reads its
 * labels out of.
 */
export const getPinnedDerivedColumnsState = <TData>({
  columnOrder,
  columnPinning,
  columns,
  columnSizing,
  columnVisibility = new Set<DataKey<TData>>(),
  groupingKeys,
}: GetPinnedDerivedColumnsStateArgs<TData>) => {
  const {
    columnOrder: gridColumnOrder,
    columnPinning: gridColumnPinning,
    columns: gridColumns,
    columnVisibility: gridColumnVisibility,
  } = withGroupedColumnLayout<TData>({
    columnOrder,
    columnPinning,
    columns,
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
