import type {
  ColumnPinningState,
  DataKey,
} from '@repo/ui/components/Table/Table.types';

type RestoreStaticPinnedColumnsArgs<TData> = {
  readonly defaultPinning: ColumnPinningState<TData>;
  readonly finalPinning: ColumnPinningState<TData>;
  readonly staticKeys: ReadonlySet<string>;
};

export const restoreStaticPinnedColumns = <TData>({
  defaultPinning,
  finalPinning,
  staticKeys,
}: RestoreStaticPinnedColumnsArgs<TData>): ColumnPinningState<TData> => {
  if (staticKeys.size === 0) {
    return finalPinning;
  }

  let nextPinning = finalPinning;

  for (const key of staticKeys) {
    const columnKey = key as DataKey<TData>;

    if (
      defaultPinning.left.includes(columnKey) &&
      !nextPinning.left.includes(columnKey)
    ) {
      nextPinning = {
        ...nextPinning,
        left: [...nextPinning.left, columnKey],
      };
    }

    if (
      defaultPinning.right.includes(columnKey) &&
      !nextPinning.right.includes(columnKey)
    ) {
      nextPinning = {
        ...nextPinning,
        right: [...nextPinning.right, columnKey],
      };
    }
  }

  return nextPinning;
};
