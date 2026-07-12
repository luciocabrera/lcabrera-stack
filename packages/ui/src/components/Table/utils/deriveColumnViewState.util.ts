import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';

import { getNormalizedColumns } from './getNormalizedColumns.util';
import { getPinnedDerivedColumnsState } from './getPinnedDerivedColumnsState.util';
import { getStaticColumnKeys } from './getStaticColumnKeys.util';

type DeriveColumnViewStateArgs<TData> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  readonly sorting: SortingState<TData>;
};

export const deriveColumnViewState = <TData>({
  columnOrder,
  columnPinning,
  columns,
  columnSizing,
  columnVisibility,
  sorting,
}: DeriveColumnViewStateArgs<TData>) => {
  const normalizedColumns = getNormalizedColumns<TData>({
    columns,
    sorting,
  });

  const { columnGroups, effectiveColumns, pinnedColumnOffsets } =
    getPinnedDerivedColumnsState<TData>({
      columnOrder,
      columnPinning,
      columns,
      columnSizing,
      columnVisibility,
    });

  const staticKeys = getStaticColumnKeys<TData>(columns);

  return {
    columnGroups,
    effectiveColumns,
    normalizedColumns,
    pinnedColumnOffsets,
    staticKeys,
  };
};
