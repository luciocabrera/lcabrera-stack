import type {
  ColumnPinningState,
  DataKey,
} from '#ui/components/Table/Table.types';

type RestoreStaticPinnedColumnsArgs<TData> = {
  readonly defaultPinning: ColumnPinningState<TData>;
  readonly finalPinning: ColumnPinningState<TData>;
  readonly staticKeys: ReadonlySet<string>;
};

export const restoreStaticPinnedColumns = <TData>({
  defaultPinning,
  finalPinning,
  staticKeys,
}: RestoreStaticPinnedColumnsArgs<TData>) => {
  if (staticKeys.size === 0) {
    return finalPinning;
  }

  const defaultLeft = new Set<string>(defaultPinning.left);
  const defaultRight = new Set<string>(defaultPinning.right);
  const finalLeft = new Set<string>(finalPinning.left);
  const finalRight = new Set<string>(finalPinning.right);

  const staticKeyList = [...staticKeys];
  const leftToRestore = staticKeyList.filter(
    (key) => defaultLeft.has(key) && !finalLeft.has(key),
  ) as DataKey<TData>[];
  const rightToRestore = staticKeyList.filter(
    (key) => defaultRight.has(key) && !finalRight.has(key),
  ) as DataKey<TData>[];

  if (leftToRestore.length === 0 && rightToRestore.length === 0) {
    return finalPinning;
  }

  return {
    ...finalPinning,
    left: [...finalPinning.left, ...leftToRestore],
    right: [...finalPinning.right, ...rightToRestore],
  };
};
