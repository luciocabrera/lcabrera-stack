import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
  TableColumn,
} from '@/components/Table/Table.types';

type SyncColumnOrderWithPinningArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnPinning: 'left' | 'right' | undefined;
  readonly columns: readonly TableColumn<TData>[];
  readonly currentOrder?: readonly DataKey<TData>[];
  readonly previousPinning?: ColumnPinningState<TData>;
  readonly newPinning: ColumnPinningState<TData>;
};

/**
 * Syncs column order with pinning so that the display order in the
 * Table Settings drawer reflects the actual visual position:
 * - Left-pinned columns are placed at the start (after existing left-pinned)
 * - Right-pinned columns are placed at the end (before existing right-pinned)
 * - Unpinned columns move adjacent to the pinned group they were removed from
 */
export const syncColumnOrderWithPinning = <TData>({
  columnKey,
  columnPinning,
  columns,
  currentOrder = [],
  previousPinning,
  newPinning,
}: SyncColumnOrderWithPinningArgs<TData>): ColumnOrderState<TData> => {
  // Build base order: use currentOrder if populated, otherwise derive from columns
  const baseOrder =
    currentOrder.length > 0 ? currentOrder : columns.map((c) => c.key);

  // Remove the column from its current position
  const orderWithoutColumn = baseOrder.filter((k) => k !== columnKey);

  if (columnPinning === undefined) {
    const wasLeftPinned = previousPinning?.left.includes(columnKey) ?? false;
    const wasRightPinned = previousPinning?.right.includes(columnKey) ?? false;

    if (!wasLeftPinned && !wasRightPinned) {
      return [...baseOrder] as ColumnOrderState<TData>;
    }

    if (wasLeftPinned) {
      let lastLeftPinnedIndex = -1;
      for (const [index, key] of orderWithoutColumn.entries()) {
        if (newPinning.left.includes(key)) {
          lastLeftPinnedIndex = index;
        }
      }

      return [
        ...orderWithoutColumn.slice(0, lastLeftPinnedIndex + 1),
        columnKey,
        ...orderWithoutColumn.slice(lastLeftPinnedIndex + 1),
      ] as ColumnOrderState<TData>;
    }

    const firstRightPinnedIndex = orderWithoutColumn.findIndex((key) =>
      newPinning.right.includes(key),
    );
    const insertAt =
      firstRightPinnedIndex === -1
        ? orderWithoutColumn.length
        : firstRightPinnedIndex;

    return [
      ...orderWithoutColumn.slice(0, insertAt),
      columnKey,
      ...orderWithoutColumn.slice(insertAt),
    ] as ColumnOrderState<TData>;
  }

  if (columnPinning === 'left') {
    // Insert after existing left-pinned columns
    const otherLeftPinnedCount = newPinning.left.filter(
      (k) => k !== columnKey,
    ).length;

    return [
      ...orderWithoutColumn.slice(0, otherLeftPinnedCount),
      columnKey,
      ...orderWithoutColumn.slice(otherLeftPinnedCount),
    ] as ColumnOrderState<TData>;
  }

  // columnPinning === 'right'
  // Insert before existing right-pinned columns
  const otherRightPinnedCount = newPinning.right.filter(
    (k) => k !== columnKey,
  ).length;
  const insertAt = orderWithoutColumn.length - otherRightPinnedCount;

  return [
    ...orderWithoutColumn.slice(0, insertAt),
    columnKey,
    ...orderWithoutColumn.slice(insertAt),
  ] as ColumnOrderState<TData>;
};
