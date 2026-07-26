import type {
  ColumnPinningState,
  DataKey,
  TableColumn,
} from '@lcabrera/ui/components/Table/Table.types';

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

  // The index bounds are kept as written rather than expressed with `slice`:
  // when the column is absent `index` is -1, and `slice(0, -1)` would mean
  // "all but the last" instead of the empty range this loop walks.
  if (side === 'left') {
    const leftPinned = new Set<string>(columnPinning.left);

    for (let i = 0; i < index; i++) {
      if (!leftPinned.has(allOrderedColumns[i]?.key ?? '')) {
        return false;
      }
    }
  } else {
    const rightPinned = new Set<string>(columnPinning.right);

    for (let i = index + 1; i < allOrderedColumns.length; i++) {
      if (!rightPinned.has(allOrderedColumns[i]?.key ?? '')) {
        return false;
      }
    }
  }

  return true;
};
