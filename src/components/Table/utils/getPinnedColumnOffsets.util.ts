import type {
  ColumnPinningState,
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
} from '@/components/Table/Table.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '@/components/Table/Table.constants';

type GetPinnedColumnOffsetsArgs<TData> = {
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columnSizing: ColumnSizingState<TData>;
  readonly effectiveColumns: readonly TableColumn<TData>[];
};

export const getPinnedColumnOffsets = <TData = Record<string, unknown>>({
  columnPinning,
  columnSizing,
  effectiveColumns,
}: GetPinnedColumnOffsetsArgs<TData>): Partial<
  Record<DataKey<TData>, PinnedColumnInfo>
> => {
  const result = new Map<DataKey<TData>, PinnedColumnInfo>();
  const { left: leftPinned, right: rightPinned } = columnPinning;

  if (leftPinned.length === 0 && rightPinned.length === 0) {
    return Object.fromEntries(result) as Partial<
      Record<DataKey<TData>, PinnedColumnInfo>
    >;
  }

  // Compute left offsets (cumulative from left)
  let leftOffset = 0;
  for (const key of leftPinned) {
    const col = effectiveColumns.find((c) => c.key === key);
    if (!col) continue;
    const sized = columnSizing[col.key] as number | undefined;
    const width = sized ?? col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
    result.set(key, {
      isFirstPinnedRight: false,
      isLastPinnedLeft: false,
      offset: leftOffset,
      side: 'left',
    });
    leftOffset += width;
  }

  // Mark last left-pinned column (for shadow separator)
  const lastLeftKey = leftPinned.at(-1);
  if (lastLeftKey) {
    const entry = result.get(lastLeftKey);
    if (entry) {
      result.set(lastLeftKey, {
        ...entry,
        isLastPinnedLeft: true,
      });
    }
  }

  // Compute right offsets (cumulative from right)
  let rightOffset = 0;
  for (const key of [...rightPinned].toReversed()) {
    const col = effectiveColumns.find((c) => c.key === key);
    if (!col) continue;
    const sized = columnSizing[col.key] as number | undefined;
    const width = sized ?? col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
    result.set(key, {
      isFirstPinnedRight: false,
      isLastPinnedLeft: false,
      offset: rightOffset,
      side: 'right',
    });
    rightOffset += width;
  }

  // Mark first right-pinned column (for shadow separator)
  const firstRightKey = rightPinned.at(0);
  if (firstRightKey) {
    const entry = result.get(firstRightKey);
    if (entry) {
      result.set(firstRightKey, {
        ...entry,
        isFirstPinnedRight: true,
      });
    }
  }

  return Object.fromEntries(result) as Partial<
    Record<DataKey<TData>, PinnedColumnInfo>
  >;
};
