import type {
  ColumnPinningState,
  DataKey,
  TableColumn,
} from '#ui/components/Table/Table.types';

type GetIsContiguousPinArgs<TData> = {
  readonly allOrderedColumns: readonly TableColumn<TData>[];
  readonly columnKey: DataKey<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly side: 'left' | 'right';
};

export const getIsContiguousPin = <TData>({
  allOrderedColumns,
  columnKey,
  columnPinning,
  side,
}: GetIsContiguousPinArgs<TData>) => {
  const index = allOrderedColumns.findIndex((col) => col.key === columnKey);

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
