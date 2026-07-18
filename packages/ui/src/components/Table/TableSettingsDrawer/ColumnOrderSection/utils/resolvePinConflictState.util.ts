import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';
import type { PinConflictResolution } from '@repo/ui/types/ui.types';

import { syncColumnOrderWithPinning } from '@repo/ui/components/Table/utils';

import { applyPin } from './applyPin.util';
import { insertAdjacentToPinnedGroup } from './insertAdjacentToPinnedGroup.util';
import { pinAllBetween } from './pinAllBetween.util';

type ResolvePinConflictStateArgs<TData> = {
  readonly allOrderedColumns: readonly TableColumn<TData>[];
  readonly columnKey: DataKey<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly currentOrder: ColumnOrderState<TData>;
  readonly currentPinning: ColumnPinningState<TData>;
  readonly resolution: PinConflictResolution;
  readonly side: 'left' | 'right';
  readonly staticKeys?: Set<string>;
};

export const resolvePinConflictState = <TData>({
  allOrderedColumns,
  columnKey,
  columns,
  currentOrder,
  currentPinning,
  resolution,
  side,
  staticKeys,
}: ResolvePinConflictStateArgs<TData>) => {
  const allOrderedKeys = allOrderedColumns.map((column) => column.key);
  const index = allOrderedColumns.findIndex(
    (column) => column.key === columnKey,
  );

  if (resolution === 'move-column') {
    let newOrder: ColumnOrderState<TData> = allOrderedColumns
      .filter((column) => column.key !== columnKey)
      .map((column) => column.key);
    const targetColumn = allOrderedColumns[index];

    if (targetColumn?.key) {
      newOrder = insertAdjacentToPinnedGroup<TData>({
        columnKey: targetColumn.key,
        columnPinning: currentPinning,
        order: newOrder,
        side,
      });
    }

    return {
      columnOrder: newOrder,
      columnPinning: applyPin({
        columnKey,
        columnPinning: currentPinning,
        side,
        staticKeys,
      }),
    };
  }

  const newPinning =
    resolution === 'pin-all-between'
      ? pinAllBetween<DataKey<TData>>({
          allOrderedKeys,
          columnPinning: currentPinning,
          index,
          side,
        })
      : applyPin({
          columnKey,
          columnPinning: currentPinning,
          side,
          staticKeys,
        });

  return {
    columnOrder: syncColumnOrderWithPinning<TData>({
      columnKey,
      columnPinning: side,
      columns,
      currentOrder,
      newPinning,
    }),
    columnPinning: newPinning,
  };
};
