import type {
  ColumnPinningState,
  TableColumn,
} from '@/components/Table/Table.types';

type SyncColumnOrderWithPinningArgs = {
  readonly columnKey: string;
  readonly columnPinning: 'left' | 'right' | undefined;
  readonly columns: readonly TableColumn<Record<string, unknown>>[];
  readonly currentOrder: readonly string[];
  readonly newPinning: ColumnPinningState<Record<string, unknown>>;
};

/**
 * Syncs column order with pinning so that the display order in the
 * Table Settings drawer reflects the actual visual position:
 * - Left-pinned columns are placed at the start (after existing left-pinned)
 * - Right-pinned columns are placed at the end (before existing right-pinned)
 * - Unpinned columns keep their current position
 */
export const syncColumnOrderWithPinning = ({
  columnKey,
  columnPinning,
  columns,
  currentOrder,
  newPinning,
}: SyncColumnOrderWithPinningArgs): string[] => {
  // If not pinning/unpinning, no order change needed
  if (columnPinning === undefined) return [...currentOrder];

  // Build base order: use currentOrder if populated, otherwise derive from columns
  const baseOrder =
    currentOrder.length > 0 ? currentOrder : columns.map((c) => c.key);

  // Remove the column from its current position
  const orderWithoutColumn = baseOrder.filter((k) => k !== columnKey);

  if (columnPinning === 'left') {
    // Insert after existing left-pinned columns
    const otherLeftPinnedCount = newPinning.left.filter(
      (k) => k !== columnKey,
    ).length;

    return [
      ...orderWithoutColumn.slice(0, otherLeftPinnedCount),
      columnKey,
      ...orderWithoutColumn.slice(otherLeftPinnedCount),
    ];
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
  ];
};
