import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  DataKey,
  TableColumn,
} from '@lcabrera/ui/components/Table/Table.types';

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

export const getPinnedDerivedColumnsState = <TData>({
  columnOrder,
  columnPinning,
  columns,
  columnSizing,
  columnVisibility = new Set<DataKey<TData>>(),
}: GetPinnedDerivedColumnsStateArgs<TData>) => {
  const effectiveColumns = getEffectiveColumns<TData>({
    columnOrder,
    columnPinning,
    columns,
    columnVisibility,
  });

  const pinnedColumnPartition = splitColumnsByPinning<TData>({
    columnPinning,
    effectiveColumns,
  });

  const pinnedColumnOffsets = getPinnedColumnOffsets<TData>({
    columnPinning,
    columnSizing: columnSizing ?? ({} as ColumnSizingState<TData>),
    effectiveColumns,
  });

  return {
    effectiveColumns,
    pinnedColumnOffsets,
    pinnedColumnPartition,
  };
};
