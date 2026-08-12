import type {
  ColumnPinningState,
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
} from '#ui/components/Table/Table.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';

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

  // Set<string> rather than .includes() on the raw arrays, for the reason
  // splitColumnsByPinning documents: DataKey<unknown> narrows to the literal
  // 'actions' and stops accepting the broader keys the columns carry.
  const leftPinnedSet = new Set<string>(leftPinned);
  const rightPinnedSet = new Set<string>(rightPinned);

  // Compute left offsets (cumulative from left)
  let leftOffset = 0;
  const leftPinnedInEffectiveOrder = effectiveColumns.filter((c) =>
    leftPinnedSet.has(c.key),
  );
  for (const col of leftPinnedInEffectiveOrder) {
    const sized = columnSizing[col.key] as number | undefined;
    const width = sized ?? col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
    result.set(col.key, {
      isFirstPinnedRight: false,
      isLastPinnedLeft: false,
      offset: leftOffset,
      side: 'left',
    });
    leftOffset += width;
  }

  // Mark last left-pinned column (for shadow separator)
  const lastLeftKey = leftPinnedInEffectiveOrder.at(-1)?.key;
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
  const rightPinnedInReverseEffectiveOrder = effectiveColumns
    .toReversed()
    .filter((c) => rightPinnedSet.has(c.key));
  for (const col of rightPinnedInReverseEffectiveOrder) {
    const sized = columnSizing[col.key] as number | undefined;
    const width = sized ?? col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
    result.set(col.key, {
      isFirstPinnedRight: false,
      isLastPinnedLeft: false,
      offset: rightOffset,
      side: 'right',
    });
    rightOffset += width;
  }

  // Mark first right-pinned column (for shadow separator)
  const firstRightKey = rightPinnedInReverseEffectiveOrder.at(-1)?.key;
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
