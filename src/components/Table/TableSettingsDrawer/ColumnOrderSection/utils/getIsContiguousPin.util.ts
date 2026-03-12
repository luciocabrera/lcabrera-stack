import type {
  ColumnPinningState,
  TableColumn,
} from '@/components/Table/Table.types';

type GetIsContiguousPinArgs<TData> = {
  allOrderedColumns: TableColumn<TData>[];
  columnKey: string;
  columnPinning: ColumnPinningState;
  side: 'left' | 'right';
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
}: GetIsContiguousPinArgs<TData>): boolean => {
  const index = allOrderedColumns.findIndex((col) => col.key === columnKey);

  if (side === 'left') {
    for (let i = 0; i < index; i++) {
      if (!columnPinning.left.includes(allOrderedColumns[i]?.key ?? '')) {
        return false;
      }
    }
  } else {
    for (let i = index + 1; i < allOrderedColumns.length; i++) {
      if (!columnPinning.right.includes(allOrderedColumns[i]?.key ?? '')) {
        return false;
      }
    }
  }

  return true;
};
