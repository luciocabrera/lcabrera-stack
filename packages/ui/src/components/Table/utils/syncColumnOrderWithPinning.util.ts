import type {
  ColumnPinningState,
  DataKey,
  TableColumn,
} from '@lcabrera/ui/components/Table/Table.types';

import { insertAfterLeftPinned } from './insertAfterLeftPinned.util';
import { insertBeforeRightPinned } from './insertBeforeRightPinned.util';
import { resolveUnpinnedOrder } from './resolveUnpinnedOrder.util';

type SyncColumnOrderWithPinningArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnPinning: 'left' | 'right' | undefined;
  readonly columns: readonly TableColumn<TData>[];
  readonly currentOrder?: readonly DataKey<TData>[];
  readonly newPinning: ColumnPinningState<TData>;
  readonly previousPinning?: ColumnPinningState<TData>;
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
  newPinning,
  previousPinning,
}: SyncColumnOrderWithPinningArgs<TData>) => {
  // Build base order: use currentOrder if populated, otherwise derive from columns
  const baseOrder =
    currentOrder.length > 0 ? currentOrder : columns.map((c) => c.key);

  // Remove the column from its current position
  const orderWithoutColumn = baseOrder.filter((k) => k !== columnKey);

  if (columnPinning === undefined) {
    return resolveUnpinnedOrder<TData>({
      baseOrder,
      columnKey,
      newPinning,
      orderWithoutColumn,
      previousPinning,
    });
  }

  if (columnPinning === 'left') {
    return insertAfterLeftPinned<TData>({
      columnKey,
      newPinning,
      orderWithoutColumn,
    });
  }

  return insertBeforeRightPinned<TData>({
    columnKey,
    newPinning,
    orderWithoutColumn,
  });
};
