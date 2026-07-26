import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
  TableColumn,
} from '@lcabrera/ui/components/Table/Table.types';
import type { UnpinConflictResolution } from '@lcabrera/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import {
  buildAllOrderedColumns,
  insertAdjacentToPinnedGroup,
} from '@lcabrera/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';

type ResolveAcceptedUnpinConflictStateArgs<
  TData extends Record<string, unknown>,
> = {
  readonly columnKey: DataKey<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnsOrder: ColumnOrderState<TData>;
  readonly resolution: UnpinConflictResolution;
  readonly side: 'left' | 'right';
};

export const resolveAcceptedUnpinConflictState = <
  TData extends Record<string, unknown>,
>({
  columnKey,
  columnPinning,
  columns,
  columnsOrder,
  resolution,
  side,
}: ResolveAcceptedUnpinConflictStateArgs<TData>) => {
  const allOrderedColumns = buildAllOrderedColumns({
    columns,
    columnsOrder,
  });
  const index = allOrderedColumns.findIndex(
    (column) => column.key === columnKey,
  );

  if (resolution === 'unpin-beyond') {
    let left = [...columnPinning.left];
    let right = [...columnPinning.right];

    if (side === 'left') {
      const keysFromIndex = new Set(
        allOrderedColumns.slice(index).map((column) => column.key),
      );
      left = left.filter((key) => !keysFromIndex.has(key));
    } else {
      const keysBeforeOrAtIndex = new Set(
        allOrderedColumns.slice(0, index + 1).map((column) => column.key),
      );
      right = right.filter((key) => !keysBeforeOrAtIndex.has(key));
    }

    return {
      columnPinning: {
        left,
        right,
      },
      kind: 'update-pinning',
    };
  }

  const nextPinning: ColumnPinningState<TData> = {
    left: columnPinning.left.filter((key) => key !== columnKey),
    right: columnPinning.right.filter((key) => key !== columnKey),
  };

  const nextOrder = allOrderedColumns
    .filter((column) => column.key !== columnKey)
    .map((column) => column.key) as readonly DataKey<TData>[];

  const columnOrder = insertAdjacentToPinnedGroup<TData>({
    columnKey,
    columnPinning: nextPinning,
    order: nextOrder,
    side,
  });

  return {
    columnOrder,
    columnPinning: nextPinning,
    kind: 'update-order-and-pinning',
  };
};
