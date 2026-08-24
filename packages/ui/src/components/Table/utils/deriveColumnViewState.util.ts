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
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  readonly groupingKeys: readonly string[];
  readonly sorting: SortingState<TData>;
};

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
