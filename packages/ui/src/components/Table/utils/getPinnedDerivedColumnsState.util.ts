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
import { withGroupHierarchyColumn } from './withGroupHierarchyColumn.util';

type GetPinnedDerivedColumnsStateArgs<TData> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  /**
   * The applied group keys. **Required**, so every re-derivation is a compile
   * error until it says what grouping is applied — a caller free to omit it
   * would silently drop the hierarchy column on the next column change.
   */
  readonly groupingKeys: readonly string[];
};

/**
 * Every column slice the body and header paint from, derived together so they
 * cannot disagree about which columns exist.
 *
 * The hierarchy column is injected here, at the one point all three slices are
 * computed from (ADR-065). `gridColumns` comes back beside them because the
 * normalized-column map has to be built from that same augmented list — the
 * header cell reads its label out of the map, and a column in the partition but
 * not in the map renders an empty header.
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
  } = withGroupHierarchyColumn<TData>({
    columnOrder,
    columnPinning,
    columns,
    groupingKeys,
  });

  const effectiveColumns = getEffectiveColumns<TData>({
    columnOrder: gridColumnOrder,
    columnPinning: gridColumnPinning,
    columns: gridColumns,
    columnVisibility,
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
