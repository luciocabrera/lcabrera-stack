import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
  TableColumnAggregate,
} from '#ui/components/Table/Table.types';

import { getNormalizedColumns } from './getNormalizedColumns.util';
import { getPinnedDerivedColumnsState } from './getPinnedDerivedColumnsState.util';
import { getStaticColumnKeys } from './getStaticColumnKeys.util';

type DeriveColumnViewStateArgs<TData> = {
  /** The applied aggregates — see `getPinnedDerivedColumnsState`. */
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  /** The applied group keys — see `getPinnedDerivedColumnsState`. */
  readonly groupingKeys: readonly string[];
  readonly sorting: SortingState<TData>;
};

/**
 * `normalizedColumns` is built from `gridColumns` — the columns the grid
 * paints, hierarchy column included — while `staticKeys` stays on the
 * consumer's own list. The split is deliberate: the first is a lookup for
 * anything rendered, and the second is the set the user's column-order state is
 * restored around, which the grid's own column is not part of.
 */
export const deriveColumnViewState = <TData>({
  aggregates,
  columnOrder,
  columnPinning,
  columns,
  columnSizing,
  columnVisibility,
  groupingKeys,
  sorting,
}: DeriveColumnViewStateArgs<TData>) => {
  const {
    effectiveColumns,
    gridColumns,
    pinnedColumnOffsets,
    pinnedColumnPartition,
  } = getPinnedDerivedColumnsState<TData>({
    aggregates,
    columnOrder,
    columnPinning,
    columns,
    columnSizing,
    columnVisibility,
    groupingKeys,
  });

  const normalizedColumns = getNormalizedColumns<TData>({
    columns: gridColumns,
    sorting,
  });

  const staticKeys = getStaticColumnKeys<TData>(columns);

  return {
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
    pinnedColumnPartition,
    staticKeys,
  };
};
