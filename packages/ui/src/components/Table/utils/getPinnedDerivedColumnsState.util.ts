import type {
  ColumnGroupsState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  DataKey,
  PinnedColumnOffsetsState,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';

import { getEffectiveColumns } from './getEffectiveColumns.util';
import { getPinnedColumnOffsets } from './getPinnedColumnOffsets.util';
import { splitColumnsByPinning } from './splitColumnsByPinning.util';

type GetPinnedDerivedColumnsStateArgs<TData> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
};

type GetPinnedDerivedColumnsStateResult<TData> = {
  readonly columnGroups: ColumnGroupsState<TData>;
  readonly effectiveColumns: TableColumn<TData>[];
  readonly pinnedColumnOffsets: PinnedColumnOffsetsState<TData>;
};

export const getPinnedDerivedColumnsState = <TData>({
  columnOrder,
  columnPinning,
  columns,
  columnSizing,
  columnVisibility = new Set<DataKey<TData>>(),
}: GetPinnedDerivedColumnsStateArgs<TData>): GetPinnedDerivedColumnsStateResult<TData> => {
  const effectiveColumns = getEffectiveColumns<TData>({
    columnOrder,
    columnPinning,
    columns,
    columnVisibility,
  });

  const columnGroups = splitColumnsByPinning<TData>({
    columnPinning,
    effectiveColumns,
  });

  const pinnedColumnOffsets = getPinnedColumnOffsets<TData>({
    columnPinning,
    columnSizing: columnSizing ?? ({} as ColumnSizingState<TData>),
    effectiveColumns,
  });

  return {
    columnGroups,
    effectiveColumns,
    pinnedColumnOffsets,
  };
};
