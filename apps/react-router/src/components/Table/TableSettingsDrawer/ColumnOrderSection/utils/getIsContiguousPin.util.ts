import type {
  ColumnPinningState,
  DataKey,
  TableColumn,
} from '@/components/Table/Table.types';

type GetIsContiguousPinArgs<TData> = {
  readonly allOrderedColumns: readonly TableColumn<TData>[];
  readonly columnKey: DataKey<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly side: 'left' | 'right';
};

/**
 * Checks whether pinning a column on a given side would maintain contiguous pinning.
 * - For 'left': all columns before the target must already be left-pinned.
 * - For 'right': all columns after the target must already be right-pinned.
 */
export const getIsContiguousPin = <TData>({
  allOrderedColumns,
  columnKey,
  columnPinning,
  side,
}: GetIsContiguousPinArgs<TData>) => {
  const index = allOrderedColumns.findIndex((col) => col.key === columnKey);

  if (side === 'left') {
    for (let i = 0; i < index; i++) {
      if (
        !columnPinning.left.includes(
          allOrderedColumns[i]?.key ?? ('' as DataKey<TData>),
        )
      ) {
        return false;
      }
    }
  } else {
    for (let i = index + 1; i < allOrderedColumns.length; i++) {
      if (
        !columnPinning.right.includes(
          allOrderedColumns[i]?.key ?? ('' as DataKey<TData>),
        )
      ) {
        return false;
      }
    }
  }

  return true;
};
