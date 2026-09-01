import type {
  ColumnPinningState,
  DataKey,
} from '#ui/components/Table/Table.types';

type ApplyPinArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly side: 'left' | 'right';
  readonly staticKeys?: Set<string>;
};

export const applyPin = <TData>({
  columnKey,
  columnPinning,
  side,
  staticKeys,
}: ApplyPinArgs<TData>) => {
  const newPinning = {
    left: columnPinning.left.filter((k) => k !== columnKey),
    right: columnPinning.right.filter((k) => k !== columnKey),
  };

  if (side === 'left') {
    if (staticKeys) {
      const lastStaticIndex = newPinning.left.findLastIndex((k) =>
        staticKeys.has(k),
      );
      newPinning.left.splice(lastStaticIndex + 1, 0, columnKey);
    } else {
      newPinning.left = [...newPinning.left, columnKey];
    }
    return newPinning;
  }

  if (staticKeys) {
    const firstStaticIndex = newPinning.right.findIndex((k) =>
      staticKeys.has(k),
    );
    if (firstStaticIndex === -1) {
      newPinning.right = [...newPinning.right, columnKey];
    } else {
      newPinning.right.splice(firstStaticIndex, 0, columnKey);
    }
  } else {
    newPinning.right = [...newPinning.right, columnKey];
  }

  return newPinning;
};
