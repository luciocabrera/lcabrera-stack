import type {
  ColumnPinningState,
  ColumnSizingState,
  DataKey,
  TableColumn,
} from '@/components/Table/Table.types';

import { getPinnedColumnOffsets } from '@/components/Table/utils';
import { getNewColumnSizingBasedOnColumnKey } from '@/components/Table/utils/getNewColumnSizingBasedOnColumnKey.util';

type ResolveColumnSizingUpdateArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnPinning?: ColumnPinningState<TData>;
  readonly columnSizingState?: ColumnSizingState<TData>;
  readonly effectiveColumns: readonly TableColumn<TData>[];
  readonly width: number | undefined;
};

export const resolveColumnSizingUpdate = <TData>({
  columnKey,
  columnPinning,
  columnSizingState,
  effectiveColumns,
  width,
}: ResolveColumnSizingUpdateArgs<TData>) => {
  const columnSizing = getNewColumnSizingBasedOnColumnKey<TData>({
    columnKey,
    columnSizesState: columnSizingState,
    columnSizing: width,
  });

  return {
    columnSizing,
    pinnedColumnOffsets: getPinnedColumnOffsets<TData>({
      columnPinning: columnPinning ?? { left: [], right: [] },
      columnSizing,
      effectiveColumns,
    }),
  };
};
