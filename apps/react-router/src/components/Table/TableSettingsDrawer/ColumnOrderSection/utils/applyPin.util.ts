import type {
  ColumnPinningState,
  DataKey,
} from '@/components/Table/Table.types';

type ApplyPinArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly side: 'left' | 'right';
  readonly staticKeys?: Set<string>;
};

/**
 * Creates a new pinning state with the given column added to the specified side.
 * Removes the column from the opposite side if present.
 * When pinning right, new columns are inserted before static columns.
 * When pinning left, new columns are inserted after static columns.
 */
export const applyPin = <TData>({
  columnKey,
  columnPinning,
  side,
  staticKeys,
}: ApplyPinArgs<TData>): ColumnPinningState<TData> => {
  const newPinning = {
    left: columnPinning.left.filter((k) => k !== columnKey),
    right: columnPinning.right.filter((k) => k !== columnKey),
  };

  if (side === 'left') {
    if (staticKeys) {
      // Insert after static columns on left
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
    // Insert before static columns on right
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
