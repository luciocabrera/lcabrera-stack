import type {
  ColumnGroupsState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  NormalizedColumnsState,
  PinnedColumnOffsetsState,
  SortingState,
  TableColumn,
} from '@/components/Table/Table.types';

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

type DeriveColumnViewStateResult<TData> = {
  readonly columnGroups: ColumnGroupsState<TData>;
  readonly effectiveColumns: TableColumn<TData>[];
  readonly normalizedColumns: NormalizedColumnsState<TData>;
  readonly pinnedColumnOffsets: PinnedColumnOffsetsState<TData>;
  readonly staticKeys: Set<string>;
};

export const deriveColumnViewState = <TData>({
  columnOrder,
  columnPinning,
  columns,
  columnSizing,
  columnVisibility,
  sorting,
}: DeriveColumnViewStateArgs<TData>): DeriveColumnViewStateResult<TData> => {
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
